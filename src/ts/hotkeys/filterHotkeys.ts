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

/**
 * Returns true if the entry should be visible given the current search query
 * and active modifier filters.
 *
 * Filter rules:
 * - Modifier filter (AND): entry must have at least one hotkey containing ALL
 *   active modifiers.
 * - Text query: entry name must contain the query as a substring (case-
 *   insensitive) OR at least one hotkey key must exactly equal the query
 *   (case-insensitive).
 * - Both filters are applied together (AND between the two conditions).
 */
export function matchesFilters(
  entry: HotkeyEntry,
  query: string,
  activeModifiers: Set<string>
): boolean {
  if (!hotkeysMatchModifiers(entry.hotkeys, activeModifiers)) return false;

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
 * search query is active (they have no command name to search against).
 */
export function matchesFlatItem(
  item: FlatHotkeyItem,
  query: string,
  activeModifiers: Set<string>
): boolean {
  if (!hotkeysMatchModifiers(item.hotkeys, activeModifiers)) return false;

  if (item.isOrphan) return query === "";

  if (query) {
    const lowerQuery = query.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(lowerQuery);
    const keyMatch = item.hotkeys.some((hk) => hk.key.toLowerCase() === lowerQuery);
    if (!nameMatch && !keyMatch) return false;
  }

  return true;
}
