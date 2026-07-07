import { setIcon } from "obsidian";
import type { HotkeysCheatsheetSettings, SortMode } from "../types";
import { t } from "../i18n/i18n";
import { filterLabel } from "../hotkeys/keyDisplay";
import type { CheatsheetState } from "./state";

export interface ToolbarCallbacks {
  /** Search/filter/sort/collapse selection changed — caller should re-render the grid. */
  onChange(): void;
  onExportNote(): void;
  onExportHtml(): void;
}

/**
 * Builds and owns the modal's toolbar: export dropdown, search box, modifier
 * filter, sort dropdown, and the collapse/expand-all toggle. Holds the
 * dropdown open/closed flags itself since they're pure view state 1:1 with
 * a specific widget, not shared business state.
 */
export class Toolbar {
  private searchInput!: HTMLInputElement;
  private filterBtn!: HTMLButtonElement;
  private filterDropdown!: HTMLElement;
  private filterOpen = false;
  private exportDropdown!: HTMLElement;
  private exportOpen = false;
  private sortBtn!: HTMLButtonElement;
  private sortDropdown!: HTMLElement;
  private sortItems: HTMLElement[] = [];
  private sortOpen = false;
  private collapseToggleBtn!: HTMLButtonElement;

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

  constructor(
    private readonly settings: HotkeysCheatsheetSettings,
    private readonly state: CheatsheetState,
    private readonly callbacks: ToolbarCallbacks
  ) {}

  attach(doc: Document): void {
    doc.addEventListener("click", this.handleOutsideClick);
  }

  detach(doc: Document): void {
    doc.removeEventListener("click", this.handleOutsideClick);
  }

  focusSearch(): void {
    this.searchInput?.focus();
  }

  /** Escape-triggered clear (no focus, no clear-button DOM update — matches the original close() path). */
  applySearchClear(): void {
    this.searchInput.value = "";
    this.state.clearSearch();
    this.updateToolbarState();
    this.callbacks.onChange();
  }

  build(parent: HTMLElement): HTMLElement {
    const toolbar = parent.createDiv({ cls: "hkc-toolbar" });

    // Export dropdown — leftmost
    const exportWrapper = toolbar.createDiv({ cls: "hkc-export-wrapper" });
    const exportBtn = exportWrapper.createEl("button", { cls: "hkc-export-btn" });
    setIcon(exportBtn, "download");
    exportBtn.setAttribute("aria-label", t("modal.export_label"));
    this.exportDropdown = exportWrapper.createDiv({
      cls: "hkc-export-dropdown hkc-hidden",
    });

    const saveNoteItem = this.exportDropdown.createDiv({ cls: "hkc-export-item" });
    saveNoteItem.setText(t("modal.export_save_note"));
    saveNoteItem.addEventListener("click", () => {
      this.exportOpen = false;
      this.exportDropdown.addClass("hkc-hidden");
      this.callbacks.onExportNote();
    });

    const saveHtmlItem = this.exportDropdown.createDiv({ cls: "hkc-export-item" });
    saveHtmlItem.setText(t("modal.export_save_html"));
    saveHtmlItem.addEventListener("click", () => {
      this.exportOpen = false;
      this.exportDropdown.addClass("hkc-hidden");
      this.callbacks.onExportHtml();
    });

    exportBtn.addEventListener("click", (e) => {
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
      this.state.clearSearch();
      this.updateToolbarState();
      this.callbacks.onChange();
    });

    this.searchInput.addEventListener("input", () => {
      this.state.setSearchQuery(this.searchInput.value);

      clearBtn.toggleClass("hkc-hidden", this.state.searchQuery === "");
      this.searchInput.classList.toggle("hkc-search--active", this.state.searchQuery !== "");

      this.updateToolbarState();
      this.callbacks.onChange();
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
        this.state.setModifierActive(mod, checkbox.checked);
        this.updateFilterBtn();
        this.callbacks.onChange();
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
      this.state.toggleCollapseAll();
      this.callbacks.onChange();
    });
    this.updateCollapseToggle();

    return toolbar;
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
          this.state.setSortMode(mode);
          this.sortOpen = false;
          this.sortDropdown.addClass("hkc-hidden");
          this.updateSortItems();
          this.updateToolbarState();
          this.callbacks.onChange();
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
      item.toggleClass("hkc-sort-item--active", item.dataset.mode === this.state.sortMode);
    }
  }

  private updateToolbarState() {
    const flatMode = this.state.sortMode === "most-used-shortcut" || this.state.sortMode === "key";
    const disableCollapse = this.state.isSearching || flatMode;
    this.collapseToggleBtn.disabled = disableCollapse;
    this.collapseToggleBtn.toggleClass("hkc-btn-disabled", disableCollapse);
    this.updateCollapseToggle();
  }

  /** Refreshes the collapse/expand-all icon — call after the grid re-renders, since that's when `currentGroupLabels` changes. */
  updateCollapseToggle(): void {
    if (this.state.areAllSectionsCollapsed()) {
      setIcon(this.collapseToggleBtn, "chevrons-up-down");
      this.collapseToggleBtn.setAttribute("aria-label", t("modal.expand_all"));
    } else {
      setIcon(this.collapseToggleBtn, "chevrons-down-up");
      this.collapseToggleBtn.setAttribute("aria-label", t("modal.collapse_all"));
    }
  }

  private updateFilterBtn() {
    const btn = this.filterBtn;
    btn.empty();
    if (this.state.activeModifiers.size === 0) {
      btn.setText(t("modal.filter_label"));
      btn.removeClass("hkc-filter-btn--active");
    } else {
      for (const mod of ["Mod", "Shift", "Alt", "Ctrl"] as const) {
        if (this.state.activeModifiers.has(mod)) {
          btn.createEl("kbd", { text: filterLabel(mod), cls: "hkc-filter-chip" });
        }
      }
      btn.createSpan({ text: " ▾" });
      btn.addClass("hkc-filter-btn--active");
    }
  }
}
