import type { HotkeyEntry } from "./types";

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
  if (activeModifiers.size > 0) {
    const modifierMatch = entry.hotkeys.some((hk) =>
      [...activeModifiers].every((m) => hk.modifiers.includes(m))
    );
    if (!modifierMatch) return false;
  }

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
