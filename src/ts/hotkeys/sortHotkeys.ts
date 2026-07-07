import type { HotkeyBinding } from "../types";
import type { ResolvedCategoryGroup, OrphanSignature } from "../usage/usageResolver";
import { MODIFIER_ORDER } from "../usage/usageTracker";
import { compareKeys } from "./keyDisplay";

/** A single row in the flat "most-used shortcut" list — a bound entry or an orphan pseudo-entry. */
export interface FlatHotkeyItem {
  id: string;
  name: string;
  hotkeys: HotkeyBinding[];
  count: number;
  /** Usage count for each binding in `hotkeys`, same order/length — used to render a per-badge count instead of one shared aggregate. */
  bindingCounts: number[];
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
      bindingCounts: entry.bindingCounts,
      isOrphan: false,
    }))
  );

  const orphanItems: FlatHotkeyItem[] = orphans.map((orphan) => ({
    id: orphan.signature,
    name: "",
    hotkeys: [{ modifiers: orphan.modifiers, key: orphan.key }],
    count: orphan.count,
    bindingCounts: [orphan.count],
    isOrphan: true,
  }));

  return [...entryItems, ...orphanItems].sort((a, b) => b.count - a.count);
}

/** One exploded row per hotkey binding — a multi-bound entry produces one row per binding. */
interface ExplodedBinding {
  id: string;
  name: string;
  hotkey: HotkeyBinding;
  count: number;
}

/**
 * Splits every entry's `hotkeys` array into one row per binding, so each
 * binding can be sorted/grouped independently. Each row's `count` is that
 * binding's own usage count (`bindingCounts[index]`), not the entry's
 * aggregate across all its bindings — otherwise a command with two bindings
 * used 11 and 5 times would show 16 on both duplicated rows.
 */
function explodeEntryBindings(groups: ResolvedCategoryGroup[]): ExplodedBinding[] {
  return groups.flatMap((group) =>
    group.entries.flatMap((entry) =>
      entry.hotkeys.map((hotkey, index) => ({
        id: `${entry.id}::${index}`,
        name: entry.name,
        hotkey,
        count: entry.bindingCounts[index],
      }))
    )
  );
}

/** Canonical `Mod+Shift`-style key for a modifier set, ordered per `MODIFIER_ORDER`. Empty string for no modifiers. */
function modifierComboKey(modifiers: string[]): string {
  return MODIFIER_ORDER.filter((mod) => modifiers.includes(mod)).join("+");
}

/** Orders modifier sets by count ascending, then by `MODIFIER_ORDER` position for ties. */
function compareModifiers(a: string[], b: string[]): number {
  const aOrdered = MODIFIER_ORDER.filter((mod) => a.includes(mod));
  const bOrdered = MODIFIER_ORDER.filter((mod) => b.includes(mod));
  if (aOrdered.length !== bOrdered.length) return aOrdered.length - bOrdered.length;
  for (let i = 0; i < aOrdered.length; i++) {
    const diff = MODIFIER_ORDER.indexOf(aOrdered[i]) - MODIFIER_ORDER.indexOf(bOrdered[i]);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Flat list of every hotkey binding (one row per binding — multi-bound entries
 * duplicate), ordered by raw key string ascending (special/non-printable keys
 * like arrows, Enter, and Escape float to the top, per `compareKeys`), then
 * modifier combination in canonical order, then command name. Orphans are
 * excluded, matching every mode other than "By Most-Used Shortcut".
 */
export function sortByKeyFlat(groups: ResolvedCategoryGroup[]): FlatHotkeyItem[] {
  return explodeEntryBindings(groups)
    .sort((a, b) => {
      const keyDiff = compareKeys(a.hotkey.key, b.hotkey.key);
      if (keyDiff !== 0) return keyDiff;
      const modDiff = compareModifiers(a.hotkey.modifiers, b.hotkey.modifiers);
      if (modDiff !== 0) return modDiff;
      return a.name.localeCompare(b.name);
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      hotkeys: [row.hotkey],
      count: row.count,
      bindingCounts: [row.count],
      isOrphan: false,
    }));
}

/**
 * Groups every hotkey binding by its modifier combination (one row per
 * binding — multi-bound entries duplicate across groups). Groups are ordered
 * by modifier count ascending, then canonical modifier order for ties; within
 * a group, bindings are ordered by raw key string (special keys float to the
 * top, per `compareKeys`), then command name. The group `category` label is
 * the canonical combo string (e.g. `"Mod+Shift"`, or `""` for no modifiers) —
 * display formatting is the renderer's job.
 */
export function groupByModifier(groups: ResolvedCategoryGroup[]): ResolvedCategoryGroup[] {
  const byCombo = new Map<string, { modifiers: string[]; rows: ExplodedBinding[] }>();
  for (const row of explodeEntryBindings(groups)) {
    const combo = modifierComboKey(row.hotkey.modifiers);
    const bucket = byCombo.get(combo);
    if (bucket) {
      bucket.rows.push(row);
    } else {
      byCombo.set(combo, { modifiers: row.hotkey.modifiers, rows: [row] });
    }
  }

  return [...byCombo.entries()]
    .sort(([, a], [, b]) => compareModifiers(a.modifiers, b.modifiers))
    .map(([combo, { rows }]) => {
      rows.sort((a, b) => {
        const keyDiff = compareKeys(a.hotkey.key, b.hotkey.key);
        if (keyDiff !== 0) return keyDiff;
        return a.name.localeCompare(b.name);
      });
      const entries = rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: combo,
        hotkeys: [row.hotkey],
        count: row.count,
        bindingCounts: [row.count],
      }));
      return { category: combo, entries, aggregate: sumCounts(entries) };
    });
}

function sumCounts(entries: { count: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.count, 0);
}
