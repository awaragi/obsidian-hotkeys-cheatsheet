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

type SortLabelKey =
  | "modal.sort_modifier"
  | "modal.sort_key"
  | "modal.sort_most_used_category"
  | "modal.sort_most_used_shortcut";

type SortChipKey =
  | "modal.sort_chip_modifier"
  | "modal.sort_chip_key"
  | "modal.sort_chip_most_used_category"
  | "modal.sort_chip_most_used_shortcut";

/** Short chip label for a non-default sort mode — "By Category" (the default) has no chip, mirroring the filter button's "no active filters" state. */
const SORT_CHIP_KEYS: Partial<Record<SortMode, SortChipKey>> = {
  modifier: "modal.sort_chip_modifier",
  key: "modal.sort_chip_key",
  "most-used-category": "modal.sort_chip_most_used_category",
  "most-used-shortcut": "modal.sort_chip_most_used_shortcut",
};

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
  private sortCheckboxes: HTMLInputElement[] = [];
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

  /**
   * Closes every dropdown. Each toggle button's own click handler stops
   * propagation (so a click inside the dropdown doesn't immediately trigger
   * `handleOutsideClick` and close it right back), which also means that
   * handler never runs for clicks on a *different* toggle button — so each
   * button must close its siblings itself before opening its own dropdown.
   */
  private closeDropdowns(): void {
    this.filterOpen = false;
    this.filterDropdown.addClass("hkc-hidden");
    this.exportOpen = false;
    this.exportDropdown.addClass("hkc-hidden");
    this.sortOpen = false;
    this.sortDropdown.addClass("hkc-hidden");
  }

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
      const opening = !this.exportOpen;
      this.closeDropdowns();
      this.exportOpen = opening;
      this.exportDropdown.toggleClass("hkc-hidden", !this.exportOpen);
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
    this.filterBtn = filterWrapper.createEl("button", { cls: "hkc-filter-btn" });
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

    this.filterDropdown.createDiv({ cls: "hkc-dropdown-divider" });

    const specialKeysLabel = this.filterDropdown.createEl("label", {
      cls: "hkc-filter-item",
    });
    const specialKeysCheckbox = specialKeysLabel.createEl("input", { type: "checkbox" });
    specialKeysLabel.appendText(" " + t("modal.filter_special_keys_only"));
    specialKeysCheckbox.addEventListener("change", () => {
      this.state.setSpecialKeysOnly(specialKeysCheckbox.checked);
      this.updateFilterBtn();
      this.callbacks.onChange();
    });

    this.filterDropdown.createDiv({ cls: "hkc-dropdown-divider" });

    const conflictsLabel = this.filterDropdown.createEl("label", {
      cls: "hkc-filter-item",
    });
    const conflictsCheckbox = conflictsLabel.createEl("input", { type: "checkbox" });
    conflictsLabel.appendText(" " + t("modal.filter_conflicts_only"));
    conflictsCheckbox.addEventListener("change", () => {
      this.state.setConflictsOnly(conflictsCheckbox.checked);
      this.updateFilterBtn();
      this.callbacks.onChange();
    });

    const modifiedLabel = this.filterDropdown.createEl("label", {
      cls: "hkc-filter-item",
    });
    const modifiedCheckbox = modifiedLabel.createEl("input", { type: "checkbox" });
    modifiedLabel.appendText(" " + t("modal.filter_modified_only"));
    modifiedCheckbox.addEventListener("change", () => {
      this.state.setModifiedOnly(modifiedCheckbox.checked);
      this.updateFilterBtn();
      this.callbacks.onChange();
    });

    this.filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = !this.filterOpen;
      this.closeDropdowns();
      this.filterOpen = opening;
      this.filterDropdown.toggleClass("hkc-hidden", !this.filterOpen);
    });

    this.filterDropdown.addEventListener("click", (e) => e.stopPropagation());
    this.updateFilterBtn();

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
    this.sortBtn = sortWrapper.createEl("button", { cls: "hkc-sort-btn" });
    this.sortDropdown = sortWrapper.createDiv({
      cls: "hkc-sort-dropdown hkc-hidden",
    });

    const regularModes: { mode: SortMode; labelKey: SortLabelKey }[] = [
      { mode: "modifier", labelKey: "modal.sort_modifier" },
      { mode: "key", labelKey: "modal.sort_key" },
    ];

    const usageModes: { mode: SortMode; labelKey: SortLabelKey }[] = [
      { mode: "most-used-category", labelKey: "modal.sort_most_used_category" },
      { mode: "most-used-shortcut", labelKey: "modal.sort_most_used_shortcut" },
    ];

    this.sortCheckboxes = [];
    for (const { mode, labelKey } of regularModes) {
      this.buildSortItem(mode, labelKey, false);
    }

    this.sortDropdown.createDiv({ cls: "hkc-dropdown-divider" });

    for (const { mode, labelKey } of usageModes) {
      this.buildSortItem(mode, labelKey, true);
    }

    this.sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = !this.sortOpen;
      this.closeDropdowns();
      this.sortOpen = opening;
      this.sortDropdown.toggleClass("hkc-hidden", !this.sortOpen);
    });

    this.sortDropdown.addEventListener("click", (e) => e.stopPropagation());
    this.updateSortCheckboxes();
    this.updateSortBtn();
  }

  /**
   * Sort modes are mutually exclusive but — unlike modifiers/conflicts/modified —
   * never "off": exactly one is always in effect. "By Category" is the default
   * and has no checkbox of its own; it's the implicit state when every checkbox
   * here is unchecked (checking one unchecks the rest; unchecking the active
   * one reverts to it), mirroring the modifier filter's own checkbox pattern.
   */
  private buildSortItem(mode: SortMode, labelKey: SortLabelKey, usageDependent: boolean) {
    const disabled = usageDependent && !this.settings.trackShortcutUsage;

    const label = this.sortDropdown.createEl("label", {
      cls: disabled ? "hkc-filter-item hkc-filter-item--disabled" : "hkc-filter-item",
    });
    const checkbox = label.createEl("input", { type: "checkbox" });
    checkbox.dataset.mode = mode;
    checkbox.disabled = disabled;
    label.appendText(" " + t(labelKey));

    if (disabled) {
      label.setAttribute("aria-label", t("modal.sort_disabled_hint"));
    } else {
      checkbox.addEventListener("change", () => {
        this.state.setSortMode(checkbox.checked ? mode : "category");
        this.updateSortCheckboxes();
        this.updateToolbarState();
        this.updateSortBtn();
        this.callbacks.onChange();
      });
    }
    this.sortCheckboxes.push(checkbox);
  }

  private updateSortCheckboxes() {
    for (const checkbox of this.sortCheckboxes) {
      checkbox.checked = checkbox.dataset.mode === this.state.sortMode;
    }
  }

  /** Mirrors `updateFilterBtn`: icon always shown; "By Category" (the default) has no chip, any other mode shows one. */
  private updateSortBtn() {
    const btn = this.sortBtn;
    const chipKey = SORT_CHIP_KEYS[this.state.sortMode];

    btn.empty();
    setIcon(btn, "arrow-up-down");
    btn.setAttribute("aria-label", t("modal.sort_label"));

    if (!chipKey) {
      btn.removeClass("hkc-sort-btn--active");
      return;
    }

    btn.createSpan({ text: t(chipKey), cls: "hkc-filter-chip hkc-filter-chip--tag" });
    btn.addClass("hkc-sort-btn--active");
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
    setIcon(btn, "filter");
    btn.setAttribute("aria-label", t("modal.filter_label"));

    const hasModifierChips = this.state.activeModifiers.size > 0;
    const hasOtherActiveFilter =
      this.state.conflictsOnly || this.state.modifiedOnly || this.state.specialKeysOnly;

    if (!hasModifierChips && !hasOtherActiveFilter) {
      btn.removeClass("hkc-filter-btn--active");
      return;
    }

    for (const mod of ["Mod", "Shift", "Alt", "Ctrl"] as const) {
      if (this.state.activeModifiers.has(mod)) {
        btn.createEl("kbd", { text: filterLabel(mod), cls: "hkc-filter-chip" });
      }
    }
    if (this.state.specialKeysOnly) {
      btn.createSpan({ text: t("modal.filter_special_keys_chip"), cls: "hkc-filter-chip hkc-filter-chip--tag" });
    }
    if (this.state.conflictsOnly) {
      btn.createSpan({ text: t("modal.filter_conflicts_chip"), cls: "hkc-filter-chip hkc-filter-chip--tag" });
    }
    if (this.state.modifiedOnly) {
      btn.createSpan({ text: t("modal.filter_modified_chip"), cls: "hkc-filter-chip hkc-filter-chip--tag" });
    }
    btn.addClass("hkc-filter-btn--active");
  }
}
