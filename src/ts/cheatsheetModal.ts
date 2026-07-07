import { App, Modal, Notice, setIcon, TFile } from "obsidian";
import { collectHotkeys } from "./hotkeyCollector";
import type { CategoryGroup, HotkeyBinding, HotkeysCheatsheetSettings, SortMode } from "./types";
import { t } from "./i18n";
import { modLabel, filterLabel, keyIcon } from "./keyDisplay";
import { matchesFilters, matchesFlatItem } from "./filterHotkeys";
import { fillTemplate, renderHtmlSections, escapeMarkdownTableCell } from "./htmlExportTemplate";
import { getUsageCounts } from "./usageTracker";
import { resolveUsage, type UsageResolution } from "./usageResolver";
import { countToGlyph } from "./usageGlyph";
import {
  sortByMostUsedCategory,
  sortByMostUsedShortcut,
  sortByKeyFlat,
  groupByModifier,
  type FlatHotkeyItem,
} from "./sortHotkeys";

const EXPORT_FILENAME = "Hotkeys Cheatsheet.md";
const EXPORT_HTML_FILENAME = "Hotkeys Cheatsheet.html";
/** How long an "already exists" overwrite confirmation stays valid — matches the Notice's visible duration. */
const EXPORT_OVERWRITE_CONFIRM_MS = 5000;

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
  private pendingOverwrite: { path: string; expiresAt: number } | null = null;
  private gridEl!: HTMLElement;

  private collapseToggleBtn!: HTMLButtonElement;

  // Collapse state: group labels (category names, or key/modifier group labels
  // depending on sort mode) in this set are collapsed.
  // Empty on every modal open (all expanded by default), and on every sort-mode change.
  private collapsedSections = new Set<string>();

  // Labels of the groups rendered in the current sort mode ([] while a flat
  // mode is active). Drives the collapse/expand-all toggle so it reflects
  // whichever grouping is currently on screen, not always the raw categories.
  private currentGroupLabels: string[] = [];

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
    this.pendingOverwrite = null;
    this.sortMode = "category";

    this.groups = collectHotkeys(this.app);
    this.usageResolution = resolveUsage(this.groups, getUsageCounts());
    this.currentGroupLabels = this.groups.map((g) => g.category);
    this.buildUI();
    activeDocument.addEventListener("click", this.handleOutsideClick);
  }

  onClose() {
    activeDocument.removeEventListener("click", this.handleOutsideClick);
    this.pendingOverwrite = null;
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
      const allCollapsed = this.currentGroupLabels.every((label) =>
        this.collapsedSections.has(label)
      );
      if (allCollapsed) {
        this.collapsedSections.clear();
      } else {
        for (const label of this.currentGroupLabels) {
          this.collapsedSections.add(label);
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

    type SortLabelKey =
      | "modal.sort_category"
      | "modal.sort_modifier"
      | "modal.sort_key"
      | "modal.sort_most_used_category"
      | "modal.sort_most_used_shortcut";

    const modes: { mode: SortMode; labelKey: SortLabelKey }[] = [
      { mode: "category", labelKey: "modal.sort_category" },
      { mode: "modifier", labelKey: "modal.sort_modifier" },
      { mode: "key", labelKey: "modal.sort_key" },
      { mode: "most-used-category", labelKey: "modal.sort_most_used_category" },
      { mode: "most-used-shortcut", labelKey: "modal.sort_most_used_shortcut" },
    ];

    const usageDependentModes: SortMode[] = ["most-used-category", "most-used-shortcut"];

    this.sortItems = [];
    for (const { mode, labelKey } of modes) {
      const item = this.sortDropdown.createDiv({ cls: "hkc-sort-item" });
      item.setText(t(labelKey));
      item.dataset.mode = mode;

      const usageDependent = usageDependentModes.includes(mode);
      if (usageDependent && !this.settings.trackShortcutUsage) {
        item.addClass("hkc-sort-item--disabled");
        item.setAttribute("aria-label", t("modal.sort_disabled_hint"));
      } else {
        item.addEventListener("click", () => {
          this.sortMode = mode;
          this.sortOpen = false;
          this.sortDropdown.addClass("hkc-hidden");
          this.collapsedSections.clear();
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
    const flatMode = this.sortMode === "most-used-shortcut" || this.sortMode === "key";
    const disableCollapse = searching || flatMode;
    this.collapseToggleBtn.disabled = disableCollapse;
    this.collapseToggleBtn.toggleClass("hkc-btn-disabled", disableCollapse);
    this.updateCollapseToggle();
  }

  private updateCollapseToggle() {
    const allCollapsed =
      this.currentGroupLabels.length > 0 &&
      this.currentGroupLabels.every((label) => this.collapsedSections.has(label));
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
        lines.push(`| ${escapeMarkdownTableCell(entry.name)} | ${hotkeyStr} |`);
      }
    }
    return lines.join("\n");
  }

  private async exportNote() {
    const folder = this.app.workspace.getActiveFile()?.parent?.path ?? "/";
    const path = folder === "/" ? EXPORT_FILENAME : `${folder}/${EXPORT_FILENAME}`;
    const existing = this.app.vault.getAbstractFileByPath(path);

    const confirmed =
      this.pendingOverwrite !== null &&
      this.pendingOverwrite.path === path &&
      Date.now() < this.pendingOverwrite.expiresAt;

    if (existing instanceof TFile && !confirmed) {
      this.pendingOverwrite = { path, expiresAt: Date.now() + EXPORT_OVERWRITE_CONFIRM_MS };
      new Notice(t("modal.export_exists", { path }), EXPORT_OVERWRITE_CONFIRM_MS);
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
      this.pendingOverwrite = null;
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

    if (this.sortMode === "most-used-shortcut" || this.sortMode === "key") {
      const flatItems =
        this.sortMode === "most-used-shortcut"
          ? sortByMostUsedShortcut(this.usageResolution.groups, this.usageResolution.orphans)
          : sortByKeyFlat(this.usageResolution.groups);
      const visibleItems = flatItems.filter((item) =>
        matchesFlatItem(item, query, this.activeModifiers)
      );
      totalVisible = visibleItems.length;
      this.currentGroupLabels = [];
      if (visibleItems.length > 0) {
        this.renderFlatList(el, visibleItems, query, showUsage);
      }
    } else {
      const orderedGroups =
        this.sortMode === "most-used-category"
          ? sortByMostUsedCategory(this.usageResolution.groups)
          : this.sortMode === "modifier"
            ? groupByModifier(this.usageResolution.groups)
            : this.usageResolution.groups;

      this.currentGroupLabels = orderedGroups.map((g) => g.category);

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
          this.groupHeadingLabel(group.category),
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

  /**
   * Translates a group's raw `category` label into display text. For "By
   * Category"/"By Most-Used Category" the label already is the category name.
   * For "By Modifier" it's the canonical combo string (e.g. "Mod+Shift", or ""
   * for no modifiers), shown as joined platform-aware modifier labels.
   */
  private groupHeadingLabel(category: string): string {
    if (this.sortMode === "modifier") {
      if (category === "") return t("modal.sort_no_modifier");
      return category.split("+").map(modLabel).join(" + ");
    }
    return category;
  }

  private renderCategorySection(
    parent: HTMLElement,
    category: string,
    headingLabel: string,
    aggregate: number,
    entries: { id: string; name: string; hotkeys: HotkeyBinding[]; bindingCounts: number[] }[],
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
    heading.appendText(" " + headingLabel);

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
      this.renderHotkeyEntryRow(section, entry.name, entry.hotkeys, entry.bindingCounts, query, showUsage);
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
        item.bindingCounts,
        query,
        showUsage,
        { muted: item.isOrphan, disableKeyHighlight: item.isOrphan }
      );
    }
  }

  /**
   * Renders one entry row (name + hotkey badges, each with its own usage
   * indicator). Shared by category and flat rendering. `bindingCounts` is
   * parallel to `hotkeys` — each binding shows its own usage count, not a
   * single aggregate shared across every badge (a command bound to two
   * hotkeys used 11 and 5 times shows 11 next to one and 5 next to the
   * other, not 16 next to both).
   */
  private renderHotkeyEntryRow(
    parent: HTMLElement,
    name: string,
    hotkeys: HotkeyBinding[],
    bindingCounts: number[],
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

    // Hotkey badge rows, each with its own usage indicator
    const hotkeysEl = entryEl.createDiv({ cls: "hkc-entry-hotkeys" });
    hotkeys.forEach((hk, index) => {
      const keyMatches =
        !options.disableKeyHighlight && query.length > 0 && hk.key.toLowerCase() === query;

      const hkRow = hotkeysEl.createDiv({ cls: "hkc-hk-row" });

      // Usage indicator comes first (left) so the kbd badges after it stay
      // flush against the row's right edge regardless of the indicator's
      // width — every row's key combo lines up in the same column.
      const count = bindingCounts[index];
      if (showUsage && count > 0) {
        this.renderUsageIndicator(hkRow, count, this.usageResolution.maxEntryCount, "hkc-usage-entry");
      }

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
    });
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
