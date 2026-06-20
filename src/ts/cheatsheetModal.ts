import { App, Modal, setIcon } from "obsidian";
import { collectHotkeys } from "./hotkeyCollector";
import type { CategoryGroup } from "./types";
import { t } from "./i18n";
import { modLabel, filterLabel, keyIcon } from "./keyDisplay";
import { matchesFilters } from "./filterHotkeys";

// ── Modal ─────────────────────────────────────────────────────────────────

export class CheatsheetModal extends Modal {
  private groups: CategoryGroup[] = [];
  private searchQuery = "";
  private activeModifiers: Set<string> = new Set();

  private searchInput!: HTMLInputElement;
  private filterBtn!: HTMLButtonElement;
  private filterDropdown!: HTMLElement;
  private filterOpen = false;
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
  };

  constructor(app: App) {
    super(app);
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

    // Reset collapse state on every open
    this.collapsedSections = new Set();
    this.searchSnapshot = null;

    this.groups = collectHotkeys(this.app);
    this.buildUI();
    activeDocument.addEventListener("click", this.handleOutsideClick);
  }

  onClose() {
    activeDocument.removeEventListener("click", this.handleOutsideClick);
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

  // ── Toolbar state helpers ──────────────────────────────────────────────

  private updateToolbarState() {
    const searching = this.searchQuery !== "";
    this.collapseToggleBtn.disabled = searching;
    this.collapseToggleBtn.toggleClass("hkc-btn-disabled", searching);
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

  // ── Grid Rendering ────────────────────────────────────────────────────────

  private renderGrid() {
    const el = this.gridEl;
    el.empty();

    const query = this.searchQuery.toLowerCase();
    const isSearching = query !== "";
    let totalVisible = 0;

    for (const group of this.groups) {
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
        visibleEntries,
        query,
        isCollapsed,
        isSearching
      );
    }

    if (totalVisible === 0) {
      el.createDiv({ text: t("modal.no_results"), cls: "hkc-no-results" });
    }

    this.updateCollapseToggle();
  }

  private renderCategorySection(
    parent: HTMLElement,
    category: string,
    entries: CategoryGroup["entries"],
    query: string,
    isCollapsed: boolean,
    isSearching: boolean
  ) {
    const section = parent.createDiv({ cls: "hkc-section" });

    const heading = section.createEl("h3", {
      cls: "hkc-category-heading",
    });

    // Arrow indicator
    const arrow = heading.createSpan({ cls: "hkc-collapse-arrow" });
    arrow.textContent = isCollapsed ? "▸" : "▾";
    heading.appendText(" " + category);

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
      const entryEl = section.createDiv({ cls: "hkc-entry" });

      // Command name with optional search highlight
      const nameEl = entryEl.createDiv({ cls: "hkc-entry-name" });
      if (query && entry.name.toLowerCase().includes(query)) {
        this.renderHighlighted(nameEl, entry.name, query);
      } else {
        nameEl.textContent = entry.name;
      }

      // Hotkey badge rows
      const hotkeysEl = entryEl.createDiv({ cls: "hkc-entry-hotkeys" });
      for (const hk of entry.hotkeys) {
        const keyMatches =
          query.length > 0 && hk.key.toLowerCase() === query;

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
