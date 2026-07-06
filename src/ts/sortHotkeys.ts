import type { HotkeyBinding } from "./types";
import type { ResolvedCategoryGroup, OrphanSignature } from "./usageResolver";

/** A single row in the flat "most-used shortcut" list — a bound entry or an orphan pseudo-entry. */
export interface FlatHotkeyItem {
  id: string;
  name: string;
  hotkeys: HotkeyBinding[];
  count: number;
  isOrphan: boolean;
}

/** Existing default order — curated category order, entries alphabetical within each. Unchanged. */
export function sortByCategory(groups: ResolvedCategoryGroup[]): ResolvedCategoryGroup[] {
  return groups;
}

/** Categories ranked by aggregate usage descending; entries within each ranked by count descending. */
export function sortByMostUsedCategory(groups: ResolvedCategoryGroup[]): ResolvedCategoryGroup[] {
  return [...groups]
    .sort((a, b) => b.aggregate - a.aggregate)
    .map((group) => ({
      ...group,
      entries: [...group.entries].sort((a, b) => b.count - a.count),
    }));
}

/**
 * Flattens all entries across all categories into one list ranked by usage
 * count descending, including orphaned signatures as pseudo-entries.
 */
export function sortByMostUsedShortcut(
  groups: ResolvedCategoryGroup[],
  orphans: OrphanSignature[]
): FlatHotkeyItem[] {
  const entryItems: FlatHotkeyItem[] = groups.flatMap((group) =>
    group.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      hotkeys: entry.hotkeys,
      count: entry.count,
      isOrphan: false,
    }))
  );

  const orphanItems: FlatHotkeyItem[] = orphans.map((orphan) => ({
    id: orphan.signature,
    name: "",
    hotkeys: [{ modifiers: orphan.modifiers, key: orphan.key }],
    count: orphan.count,
    isOrphan: true,
  }));

  return [...entryItems, ...orphanItems].sort((a, b) => b.count - a.count);
}
