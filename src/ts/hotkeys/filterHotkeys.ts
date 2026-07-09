import type { HotkeyBinding, HotkeyEntry } from "../types";
import type { FlatHotkeyItem } from "./sortHotkeys";

/** True if at least one hotkey contains ALL active modifiers (AND logic). */
export function hotkeysMatchModifiers(
  hotkeys: HotkeyBinding[],
  activeModifiers: Set<string>
): boolean {
  if (activeModifiers.size === 0) return true;
  return hotkeys.some((hk) =>
    [...activeModifiers].every((m) => hk.modifiers.includes(m))
  );
}

const EMPTY_IDS: Set<string> = new Set();

/** The "Conflicts only" / "Modified only" toolbar checkboxes — AND-combined with modifiers and search. Omit to leave both inactive. */
export interface EntryFilterFlags {
  conflictsOnly?: boolean;
  modifiedOnly?: boolean;
  conflictingIds?: Set<string>;
}

/**
 * Returns true if the entry should be visible given the current search query,
 * active modifier filters, and the conflict/modified checkboxes.
 *
 * Filter rules (all AND-combined):
 * - Modifier filter: entry must have at least one hotkey containing ALL
 *   active modifiers.
 * - Conflicts only: entry's id (or `commandId`, for per-binding composite
 *   rows produced by `groupByModifier`) must be in `conflictingIds`.
 * - Modified only: `entry.isModifiedFromDefault` must be true.
 * - Text query: entry name must contain the query as a substring (case-
 *   insensitive) OR at least one hotkey key must exactly equal the query
 *   (case-insensitive).
 */
export function matchesFilters(
  entry: HotkeyEntry & { commandId?: string },
  query: string,
  activeModifiers: Set<string>,
  flags: EntryFilterFlags = {}
): boolean {
  if (!hotkeysMatchModifiers(entry.hotkeys, activeModifiers)) return false;

  const { conflictsOnly = false, modifiedOnly = false, conflictingIds = EMPTY_IDS } = flags;
  if (conflictsOnly && !conflictingIds.has(entry.commandId ?? entry.id)) return false;
  if (modifiedOnly && !entry.isModifiedFromDefault) return false;

  if (query) {
    const lowerQuery = query.toLowerCase();
    const nameMatch = entry.name.toLowerCase().includes(lowerQuery);
    const keyMatch = entry.hotkeys.some(
      (hk) => hk.key.toLowerCase() === lowerQuery
    );
    if (!nameMatch && !keyMatch) return false;
  }

  return true;
}

/**
 * Filter rules for the flat "most-used shortcut" list: orphan pseudo-entries
 * respect the modifier filter but are excluded entirely whenever a text
 * search query is active (they have no command name to search against), and
 * are naturally excluded by "Conflicts only"/"Modified only" since an orphan
 * has no real command id and is never flagged as modified.
 */
export function matchesFlatItem(
  item: FlatHotkeyItem,
  query: string,
  activeModifiers: Set<string>,
  flags: EntryFilterFlags = {}
): boolean {
  if (!hotkeysMatchModifiers(item.hotkeys, activeModifiers)) return false;

  const { conflictsOnly = false, modifiedOnly = false, conflictingIds = EMPTY_IDS } = flags;
  if (conflictsOnly && !conflictingIds.has(item.commandId)) return false;
  if (modifiedOnly && !item.isModifiedFromDefault) return false;

  if (item.isOrphan) return query === "";

  if (query) {
    const lowerQuery = query.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(lowerQuery);
    const keyMatch = item.hotkeys.some((hk) => hk.key.toLowerCase() === lowerQuery);
    if (!nameMatch && !keyMatch) return false;
  }

  return true;
}
