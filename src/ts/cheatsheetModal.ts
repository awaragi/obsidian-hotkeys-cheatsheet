import { App, Modal, Notice, setIcon, TFile } from "obsidian";
import { collectHotkeys } from "./hotkeyCollector";
import type { CategoryGroup, HotkeyBinding, HotkeysCheatsheetSettings, SortMode } from "./types";
import { t } from "./i18n";
import { modLabel, filterLabel, keyIcon } from "./keyDisplay";
import { matchesFilters, matchesFlatItem } from "./filterHotkeys";
import { fillTemplate, renderHtmlSections } from "./htmlExportTemplate";
import { getUsageCounts } from "./usageTracker";
import { resolveUsage, type UsageResolution } from "./usageResolver";
import { countToGlyph } from "./usageGlyph";
import { sortByMostUsedCategory, sortByMostUsedShortcut, type FlatHotkeyItem } from "./sortHotkeys";

const EXPORT_FILENAME = "Hotkeys Cheatsheet.md";
const EXPORT_HTML_FILENAME = "Hotkeys Cheatsheet.html";

// ── Modal ─────────────────────────────────────────────────────────────────

export class CheatsheetModal extends Modal {
  private settings: HotkeysCheatsheetSettings;
  private groups: CategoryGroup[] = [];
  private usageResolution!: UsageResolution;
  private searchQuery = "";
  private activeModifiers: Set<string> = new Set();

  private searchInput!: HTMLInputElement;
  private filterBtn!: HTMLButtonElement;
  private filterDropdown!: HTMLElement;
  private filterOpen = false;
  private exportBtn!: HTMLButtonElement;
  private exportDropdown!: HTMLElement;
  private exportOpen = false;
  private sortBtn!: HTMLButtonElement;
  private sortDropdown!: HTMLElement;
  private sortItems: HTMLElement[] = [];
  private sortOpen = false;
  private sortMode: SortMode = "category";
  private pendingOverwrite = false;
  private gridEl!: HTMLElement;

  private collapseToggleBtn!: HTMLButtonElement;

  // Collapse state: category names in this set are collapsed.
  // Empty on every modal open (all expanded by default).
  private collapsedSections = new Set<string>();

  // Snapshot of collapsedSections taken when search becomes active,
  // restored when search is cleared.
  private searchSnapshot: Set<string> | null = null;

  private readonly handleOutsideClick = (e: MouseEvent) => {
    if (this.filterOpen && !this.filterDropdown.contains(e.target as Node)) {
      this.filterOpen = false;
      this.filterDropdown.addClass("hkc-hidden");
    }
    if (this.exportOpen && !this.exportDropdown.contains(e.target as Node)) {
      this.exportOpen = false;
      this.exportDropdown.addClass("hkc-hidden");
    }
    if (this.sortOpen && !this.sortDropdown.contains(e.target as Node)) {
      this.sortOpen = false;
      this.sortDropdown.addClass("hkc-hidden");
    }
  };

  constructor(app: App, settings: HotkeysCheatsheetSettings) {
    super(app);
    this.settings = settings;
  }

  /**
   * Override close() so Escape clears an active search before closing.
   * The built-in Obsidian Escape handler calls modal.close().
   */
  close() {
    if (this.searchQuery) {
      this.searchInput.value = "";
      this.clearSearch();
    } else {
      super.close();
    }
  }

  onOpen() {
    this.modalEl.addClass("hkc-full-modal");
    this.titleEl.setText(t("modal.title"));

    // Reset collapse/sort state on every open
    this.collapsedSections = new Set();
    this.searchSnapshot = null;
    this.pendingOverwrite = false;
    this.sortMode = "category";

    this.groups = collectHotkeys(this.app);
    this.usageResolution = resolveUsage(this.groups, getUsageCounts());
    this.buildUI();
    activeDocument.addEventListener("click", this.handleOutsideClick);
  }

  onClose() {
    activeDocument.removeEventListener("click", this.handleOutsideClick);
    this.pendingOverwrite = false;
    this.contentEl.empty();
  }

  // ── UI Construction ───────────────────────────────────────────────────────

  private buildUI() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("hkc-content");

    this.buildToolbar(contentEl);

    this.gridEl = contentEl.createDiv({ cls: "hkc-grid" });
    this.renderGrid();

    window.setTimeout(() => this.searchInput?.focus(), 30);
  }

  private buildToolbar(parent: HTMLElement) {
    const toolbar = parent.createDiv({ cls: "hkc-toolbar" });

    // Export dropdown — leftmost
    const exportWrapper = toolbar.createDiv({ cls: "hkc-export-wrapper" });
    this.exportBtn = exportWrapper.createEl("button", { cls: "hkc-export-btn" });
    setIcon(this.exportBtn, "download");
    this.exportBtn.setAttribute("aria-label", t("modal.export_label"));
    this.exportDropdown = exportWrapper.createDiv({
      cls: "hkc-export-dropdown hkc-hidden",
    });

    const saveNoteItem = this.exportDropdown.createDiv({ cls: "hkc-export-item" });
    saveNoteItem.setText(t("modal.export_save_note"));
    saveNoteItem.addEventListener("click", () => {
      this.exportOpen = false;
      this.exportDropdown.addClass("hkc-hidden");
      this.exportNote();
    });

    const saveHtmlItem = this.exportDropdown.createDiv({ cls: "hkc-export-item" });
    saveHtmlItem.setText(t("modal.export_save_html"));
    saveHtmlItem.addEventListener("click", () => {
      this.exportOpen = false;
      this.exportDropdown.addClass("hkc-hidden");
      this.saveHtml();
    });

    this.exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.exportOpen = !this.exportOpen;
      this.exportDropdown.toggleClass("hkc-hidden", !this.exportOpen);
      if (this.exportOpen) this.searchInput.focus();
    });

    this.exportDropdown.addEventListener("click", (e) => e.stopPropagation());

    // Search input wrapper
    const searchWrapper = toolbar.createDiv({ cls: "hkc-search-wrapper" });
    this.searchInput = searchWrapper.createEl("input", {
      type: "text",
      placeholder: t("modal.search_placeholder"),
      cls: "hkc-search",
    });

    const clearBtn = searchWrapper.createEl("button", { cls: "hkc-search-clear hkc-hidden" });
    setIcon(clearBtn, "x");
    clearBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchInput.focus();
      clearBtn.addClass("hkc-hidden");
      this.searchInput.classList.remove("hkc-search--active");
      this.searchQuery = "";
      this.restoreSnapshot();
      this.updateToolbarState();
      this.renderGrid();
    });

    this.searchInput.addEventListener("input", () => {
      const prev = this.searchQuery;
      this.searchQuery = this.searchInput.value;

      clearBtn.toggleClass("hkc-hidden", this.searchQuery === "");
      this.searchInput.classList.toggle("hkc-search--active", this.searchQuery !== "");

      if (prev === "" && this.searchQuery !== "") {
        this.searchSnapshot = new Set(this.collapsedSections);
      } else if (this.searchQuery === "" && prev !== "") {
        this.restoreSnapshot();
      }

      this.updateToolbarState();
      this.renderGrid();
    });

    // Modifier filter
    const filterWrapper = toolbar.createDiv({ cls: "hkc-filter-wrapper" });
    this.filterBtn = filterWrapper.createEl("button", {
      text: t("modal.filter_label"),
      cls: "hkc-filter-btn",
    });
    this.filterDropdown = filterWrapper.createDiv({
      cls: "hkc-filter-dropdown hkc-hidden",
    });

    const modTokens = ["Mod", "Shift", "Alt", "Ctrl"] as const;
    for (const mod of modTokens) {
      const label = this.filterDropdown.createEl("label", {
        cls: "hkc-filter-item",
      });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.dataset.mod = mod;
      label.appendText(" " + filterLabel(mod));
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          this.activeModifiers.add(mod);
        } else {
          this.activeModifiers.delete(mod);
        }
        this.updateFilterBtn();
        this.renderGrid();
      });
    }

    this.filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.filterOpen = !this.filterOpen;
      this.filterDropdown.toggleClass("hkc-hidden", !this.filterOpen);
    });

    this.filterDropdown.addEventListener("click", (e) => e.stopPropagation());

    // Sort control
    this.buildSortControl(toolbar);

    // Collapse / Expand All toggle button — far right
    this.collapseToggleBtn = toolbar.createEl("button", {
      cls: "hkc-icon-btn",
    });
    this.collapseToggleBtn.addEventListener("click", () => {
      const allCollapsed = this.groups.every((g) =>
        this.collapsedSections.has(g.category)
      );
      if (allCollapsed) {
        this.collapsedSections.clear();
      } else {
        for (const group of this.groups) {
          this.collapsedSections.add(group.category);
        }
      }
      this.renderGrid();
    });
    this.updateCollapseToggle();
  }

  private buildSortControl(toolbar: HTMLElement) {
    const sortWrapper = toolbar.createDiv({ cls: "hkc-sort-wrapper" });
    this.sortBtn = sortWrapper.createEl("button", {
      text: t("modal.sort_label"),
      cls: "hkc-sort-btn",
    });
    this.sortDropdown = sortWrapper.createDiv({
      cls: "hkc-sort-dropdown hkc-hidden",
    });

    const modes: { mode: SortMode; labelKey: "modal.sort_category" | "modal.sort_most_used_category" | "modal.sort_most_used_shortcut" }[] = [
      { mode: "category", labelKey: "modal.sort_category" },
      { mode: "most-used-category", labelKey: "modal.sort_most_used_category" },
      { mode: "most-used-shortcut", labelKey: "modal.sort_most_used_shortcut" },
    ];

    this.sortItems = [];
    for (const { mode, labelKey } of modes) {
      const item = this.sortDropdown.createDiv({ cls: "hkc-sort-item" });
      item.setText(t(labelKey));
      item.dataset.mode = mode;

      const usageDependent = mode !== "category";
      if (usageDependent && !this.settings.trackShortcutUsage) {
        item.addClass("hkc-sort-item--disabled");
        item.setAttribute("aria-label", t("modal.sort_disabled_hint"));
      } else {
        item.addEventListener("click", () => {
          this.sortMode = mode;
          this.sortOpen = false;
          this.sortDropdown.addClass("hkc-hidden");
          this.updateSortItems();
          this.updateToolbarState();
          this.renderGrid();
        });
      }
      this.sortItems.push(item);
    }

    this.sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.sortOpen = !this.sortOpen;
      this.sortDropdown.toggleClass("hkc-hidden", !this.sortOpen);
    });

    this.sortDropdown.addEventListener("click", (e) => e.stopPropagation());
    this.updateSortItems();
  }

  private updateSortItems() {
    for (const item of this.sortItems) {
      item.toggleClass("hkc-sort-item--active", item.dataset.mode === this.sortMode);
    }
  }

  // ── Toolbar state helpers ──────────────────────────────────────────────

  private updateToolbarState() {
    const searching = this.searchQuery !== "";
    const flatMode = this.sortMode === "most-used-shortcut";
    const disableCollapse = searching || flatMode;
    this.collapseToggleBtn.disabled = disableCollapse;
    this.collapseToggleBtn.toggleClass("hkc-btn-disabled", disableCollapse);
    this.updateCollapseToggle();
  }

  private updateCollapseToggle() {
    const allCollapsed =
      this.groups.length > 0 &&
      this.groups.every((g) => this.collapsedSections.has(g.category));
    if (allCollapsed) {
      setIcon(this.collapseToggleBtn, "chevrons-up-down");
      this.collapseToggleBtn.setAttribute("aria-label", t("modal.expand_all"));
    } else {
      setIcon(this.collapseToggleBtn, "chevrons-down-up");
      this.collapseToggleBtn.setAttribute("aria-label", t("modal.collapse_all"));
    }
  }

  private restoreSnapshot() {
    if (this.searchSnapshot !== null) {
      this.collapsedSections = this.searchSnapshot;
      this.searchSnapshot = null;
    }
  }

  private clearSearch() {
    this.searchQuery = "";
    this.restoreSnapshot();
    this.updateToolbarState();
    this.renderGrid();
  }

  private updateFilterBtn() {
    const btn = this.filterBtn;
    btn.empty();
    if (this.activeModifiers.size === 0) {
      btn.setText(t("modal.filter_label"));
      btn.removeClass("hkc-filter-btn--active");
    } else {
      for (const mod of ["Mod", "Shift", "Alt", "Ctrl"] as const) {
        if (this.activeModifiers.has(mod)) {
          btn.createEl("kbd", { text: filterLabel(mod), cls: "hkc-filter-chip" });
        }
      }
      btn.createSpan({ text: " ▾" });
      btn.addClass("hkc-filter-btn--active");
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────
  // Export always reflects the raw category/alphabetical structure — never
  // the active sort mode or usage indicators, regardless of tracking state.

  private generateMarkdown(): string {
    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [
      `# ${t("modal.title")}`,
      ``,
      `*${t("modal.export_subtitle", { date: today })}*`,
    ];
    for (const group of this.groups) {
      lines.push(``, `## ${group.category}`, ``);
      lines.push(`| Command | Hotkey |`);
      lines.push(`|---------|--------|`);
      for (const entry of group.entries) {
        const hotkeyStr = entry.hotkeys
          .map((hk) => {
            const parts = [...hk.modifiers.map(modLabel), keyIcon(hk.key)];
            return parts.map((p) => `\`${p}\``).join(" + ");
          })
          .join(" / ");
        lines.push(`| ${entry.name} | ${hotkeyStr} |`);
      }
    }
    return lines.join("\n");
  }

  private async exportNote() {
    const folder = this.app.workspace.getActiveFile()?.parent?.path ?? "/";
    const path = folder === "/" ? EXPORT_FILENAME : `${folder}/${EXPORT_FILENAME}`;
    const existing = this.app.vault.getAbstractFileByPath(path);

    if (existing instanceof TFile && !this.pendingOverwrite) {
      this.pendingOverwrite = true;
      new Notice(t("modal.export_exists", { path }), 5000);
      return;
    }

    const content = this.generateMarkdown();
    try {
      let savedFile: TFile;
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, content);
        savedFile = existing;
      } else {
        savedFile = await this.app.vault.create(path, content);
      }
      this.pendingOverwrite = false;
      super.close();
      await this.app.workspace.getLeaf().openFile(savedFile);
    } catch (err) {
      new Notice(`Export failed: ${String(err)}`);
    }
  }

  private generateHtml(): string {
    const title = t("modal.title");
    const date = new Date().toISOString().slice(0, 10);
    const content = renderHtmlSections(this.groups);
    return fillTemplate(title, date, content);
  }

  private saveHtml(): void {
    const html = this.generateHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_HTML_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Grid Rendering ────────────────────────────────────────────────────────

  private renderGrid() {
    const el = this.gridEl;
    el.empty();

    const query = this.searchQuery.toLowerCase();
    const isSearching = query !== "";
    const showUsage = this.settings.trackShortcutUsage;
    let totalVisible = 0;

    if (this.sortMode === "most-used-shortcut") {
      const flatItems = sortByMostUsedShortcut(
        this.usageResolution.groups,
        this.usageResolution.orphans
      );
      const visibleItems = flatItems.filter((item) =>
        matchesFlatItem(item, query, this.activeModifiers)
      );
      totalVisible = visibleItems.length;
      if (visibleItems.length > 0) {
        this.renderFlatList(el, visibleItems, query, showUsage);
      }
    } else {
      const orderedGroups =
        this.sortMode === "most-used-category"
          ? sortByMostUsedCategory(this.usageResolution.groups)
          : this.usageResolution.groups;

      for (const group of orderedGroups) {
        const visibleEntries = group.entries.filter((entry) =>
          matchesFilters(entry, query, this.activeModifiers)
        );

        if (visibleEntries.length === 0) continue;
        totalVisible += visibleEntries.length;

        // While searching, force-expand all sections
        const isCollapsed =
          !isSearching && this.collapsedSections.has(group.category);

        this.renderCategorySection(
          el,
          group.category,
          group.aggregate,
          visibleEntries,
          query,
          isCollapsed,
          isSearching,
          showUsage
        );
      }
    }

    if (totalVisible === 0) {
      el.createDiv({ text: t("modal.no_results"), cls: "hkc-no-results" });
    }

    this.updateCollapseToggle();
  }

  private renderCategorySection(
    parent: HTMLElement,
    category: string,
    aggregate: number,
    entries: { id: string; name: string; hotkeys: HotkeyBinding[]; count: number }[],
    query: string,
    isCollapsed: boolean,
    isSearching: boolean,
    showUsage: boolean
  ) {
    const section = parent.createDiv({ cls: "hkc-section" });

    const heading = section.createEl("h3", {
      cls: "hkc-category-heading",
    });

    // Arrow indicator
    const arrow = heading.createSpan({ cls: "hkc-collapse-arrow" });
    arrow.textContent = isCollapsed ? "▸" : "▾";
    heading.appendText(" " + category);

    if (showUsage && aggregate > 0) {
      this.renderUsageIndicator(heading, aggregate, this.usageResolution.maxCategoryAggregate, "hkc-usage-category");
    }

    // Click to toggle collapse — disabled while searching
    if (!isSearching) {
      heading.addClass("hkc-heading-interactive");
      heading.addEventListener("click", () => {
        if (this.collapsedSections.has(category)) {
          this.collapsedSections.delete(category);
        } else {
          this.collapsedSections.add(category);
        }
        this.renderGrid();
      });
    }

    if (isCollapsed) return;

    for (const entry of entries) {
      this.renderHotkeyEntryRow(section, entry.name, entry.hotkeys, entry.count, query, showUsage);
    }
  }

  private renderFlatList(
    parent: HTMLElement,
    items: FlatHotkeyItem[],
    query: string,
    showUsage: boolean
  ) {
    const section = parent.createDiv({ cls: "hkc-section hkc-flat-list" });
    for (const item of items) {
      this.renderHotkeyEntryRow(
        section,
        item.isOrphan ? t("modal.no_command") : item.name,
        item.hotkeys,
        item.count,
        query,
        showUsage,
        { muted: item.isOrphan, disableKeyHighlight: item.isOrphan }
      );
    }
  }

  /** Renders one entry row (name + optional usage indicator + hotkey badges). Shared by category and flat rendering. */
  private renderHotkeyEntryRow(
    parent: HTMLElement,
    name: string,
    hotkeys: HotkeyBinding[],
    count: number,
    query: string,
    showUsage: boolean,
    options: { muted?: boolean; disableKeyHighlight?: boolean } = {}
  ) {
    const entryEl = parent.createDiv({ cls: "hkc-entry" });

    // Command name with optional search highlight
    const nameEl = entryEl.createDiv({ cls: "hkc-entry-name" });
    if (options.muted) {
      nameEl.setText(name);
      nameEl.addClass("hkc-entry-name--muted");
    } else if (query && name.toLowerCase().includes(query)) {
      this.renderHighlighted(nameEl, name, query);
    } else {
      nameEl.textContent = name;
    }

    if (showUsage && count > 0) {
      this.renderUsageIndicator(entryEl, count, this.usageResolution.maxEntryCount, "hkc-usage-entry");
    }

    // Hotkey badge rows
    const hotkeysEl = entryEl.createDiv({ cls: "hkc-entry-hotkeys" });
    for (const hk of hotkeys) {
      const keyMatches =
        !options.disableKeyHighlight && query.length > 0 && hk.key.toLowerCase() === query;

      const hkRow = hotkeysEl.createDiv({ cls: "hkc-hk-row" });
      for (const mod of hk.modifiers) {
        hkRow.createEl("kbd", { text: modLabel(mod), cls: "hkc-kbd" });
      }
      const keyEl = hkRow.createEl("kbd", {
        text: keyIcon(hk.key),
        cls: "hkc-kbd",
      });
      if (keyMatches) {
        keyEl.addClass("hkc-kbd-match");
      }
    }
  }

  /** Renders a single glyph+count usage indicator, scaled against `max`. */
  private renderUsageIndicator(parent: HTMLElement, count: number, max: number, extraCls: string) {
    const { glyph } = countToGlyph(count, max);
    const wrap = parent.createSpan({ cls: `hkc-usage ${extraCls}` });
    wrap.createSpan({ text: glyph, cls: "hkc-usage-glyph" });
    wrap.createSpan({ text: ` ${count}`, cls: "hkc-usage-count" });
  }

  /**
   * Render `text` inside `container`, wrapping the first occurrence of `query`
   * in a `<mark>` for highlighting.
   */
  private renderHighlighted(
    container: HTMLElement,
    text: string,
    query: string
  ) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query);
    if (idx === -1) {
      container.textContent = text;
      return;
    }
    if (idx > 0) container.appendText(text.slice(0, idx));
    container.createEl("mark", {
      text: text.slice(idx, idx + query.length),
      cls: "hkc-highlight",
    });
    if (idx + query.length < text.length) {
      container.appendText(text.slice(idx + query.length));
    }
  }
}
