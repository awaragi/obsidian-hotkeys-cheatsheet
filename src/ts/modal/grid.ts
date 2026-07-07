import type { HotkeyBinding, HotkeysCheatsheetSettings } from "../types";
import { t } from "../i18n/i18n";
import { modLabel, keyIcon } from "../hotkeys/keyDisplay";
import { matchesFilters, matchesFlatItem } from "../hotkeys/filterHotkeys";
import { countToGlyph } from "../usage/usageGlyph";
import {
  sortByMostUsedCategory,
  sortByMostUsedShortcut,
  sortByKeyFlat,
  groupByModifier,
  type FlatHotkeyItem,
} from "../hotkeys/sortHotkeys";
import type { CheatsheetState } from "./state";

export interface GridRendererCallbacks {
  /** Called after every render — including ones triggered internally by a section-heading click. */
  onRendered(): void;
}

/**
 * Renders the hotkey grid (category sections, flat lists, entry rows, usage
 * indicators, search highlighting) into a fixed container element. Reads
 * everything it needs from the shared `CheatsheetState` and re-renders itself
 * in place — e.g. clicking a section heading toggles that section's collapsed
 * state and re-invokes `render()` directly, rather than routing back through
 * a caller-owned refresh method.
 */
export class GridRenderer {
  constructor(
    private readonly container: HTMLElement,
    private readonly state: CheatsheetState,
    private readonly settings: HotkeysCheatsheetSettings,
    private readonly callbacks: GridRendererCallbacks
  ) {}

  render(): void {
    const el = this.container;
    el.empty();

    const query = this.state.searchQuery.toLowerCase();
    const isSearching = this.state.isSearching;
    const showUsage = this.settings.trackShortcutUsage;
    let totalVisible = 0;

    if (this.state.sortMode === "most-used-shortcut" || this.state.sortMode === "key") {
      const flatItems =
        this.state.sortMode === "most-used-shortcut"
          ? sortByMostUsedShortcut(this.state.usageResolution.groups, this.state.usageResolution.orphans)
          : sortByKeyFlat(this.state.usageResolution.groups);
      const visibleItems = flatItems.filter((item) =>
        matchesFlatItem(item, query, this.state.activeModifiers)
      );
      totalVisible = visibleItems.length;
      this.state.setCurrentGroupLabels([]);
      if (visibleItems.length > 0) {
        this.renderFlatList(el, visibleItems, query, showUsage);
      }
    } else {
      const orderedGroups =
        this.state.sortMode === "most-used-category"
          ? sortByMostUsedCategory(this.state.usageResolution.groups)
          : this.state.sortMode === "modifier"
            ? groupByModifier(this.state.usageResolution.groups)
            : this.state.usageResolution.groups;

      this.state.setCurrentGroupLabels(orderedGroups.map((g) => g.category));

      for (const group of orderedGroups) {
        const visibleEntries = group.entries.filter((entry) =>
          matchesFilters(entry, query, this.state.activeModifiers)
        );

        if (visibleEntries.length === 0) continue;
        totalVisible += visibleEntries.length;

        // While searching, force-expand all sections
        const isCollapsed = !isSearching && this.state.isSectionCollapsed(group.category);

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

    this.callbacks.onRendered();
  }

  /**
   * Translates a group's raw `category` label into display text. For "By
   * Category"/"By Most-Used Category" the label already is the category name.
   * For "By Modifier" it's the canonical combo string (e.g. "Mod+Shift", or ""
   * for no modifiers), shown as joined platform-aware modifier labels.
   */
  private groupHeadingLabel(category: string): string {
    if (this.state.sortMode === "modifier") {
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
      this.renderUsageIndicator(heading, aggregate, this.state.usageResolution.maxCategoryAggregate, "hkc-usage-category");
    }

    // Click to toggle collapse — disabled while searching
    if (!isSearching) {
      heading.addClass("hkc-heading-interactive");
      heading.addEventListener("click", () => {
        this.state.toggleSection(category);
        this.render();
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
        this.renderUsageIndicator(hkRow, count, this.state.usageResolution.maxEntryCount, "hkc-usage-entry");
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
  private renderHighlighted(container: HTMLElement, text: string, query: string) {
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
