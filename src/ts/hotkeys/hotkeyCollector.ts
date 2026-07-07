import { App } from "obsidian";
import { CORE_PREFIX_MAP, CATEGORY_ORDER } from "./categories";
import type { HotkeyBinding, HotkeyEntry, CategoryGroup } from "../types";

export type { HotkeyBinding, HotkeyEntry, CategoryGroup };

/** Convert a hyphen/underscore/space-separated string to Title Case. */
export function toTitleCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/**
 * Determine the display category for a command.
 *
 * Rules (in order):
 * 1. Known core prefix → curated category.
 * 2. Unknown prefix (anything before first `:`) → title-cased plugin name.
 * 3. No colon → try parsing display name for "PluginName: …" pattern.
 * 4. Fallback → "Other".
 */
export function categorise(id: string, displayName: string): string {
  const colonIdx = id.indexOf(":");
  if (colonIdx !== -1) {
    const prefix = id.slice(0, colonIdx);
    if (prefix in CORE_PREFIX_MAP) {
      return CORE_PREFIX_MAP[prefix];
    }
    return toTitleCase(prefix);
  }

  // No colon — try display name "PluginName: command" pattern
  const separatorIdx = displayName.indexOf(": ");
  if (separatorIdx !== -1) {
    return displayName.slice(0, separatorIdx);
  }

  return "Other";
}

/** Strip "Category: " prefix from a command display name if present. */
export function stripCategoryPrefix(name: string, category: string): string {
  const prefix = category + ": ";
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

/**
 * Pure function: merge, normalize, categorize, group, and sort hotkey data
 * into an ordered list of category groups.
 *
 * @param defaultKeys  - Map of command id → default hotkey bindings.
 * @param customKeys   - Map of command id → user-customised bindings (wins over default).
 * @param commands     - Map of command id → { id, name } command descriptor.
 */
export function buildHotkeyGroups(
  defaultKeys: Record<string, HotkeyBinding[]>,
  customKeys: Record<string, HotkeyBinding[]>,
  commands: Record<string, { id: string; name: string }>
): CategoryGroup[] {
  const allIds = new Set([...Object.keys(defaultKeys), ...Object.keys(customKeys)]);

  const entries: HotkeyEntry[] = [];

  for (const id of allIds) {
    // Merge rule: customKeys wins; if present (even []), don't fall back
    const hotkeys: HotkeyBinding[] =
      id in customKeys ? customKeys[id] : (defaultKeys[id] ?? []);

    // Skip unassigned (user cleared the default, or entry has no hotkeys)
    if (hotkeys.length === 0) continue;

    const cmd = commands[id];
    const rawName = cmd?.name ?? id;
    const category = categorise(id, rawName);
    const name = stripCategoryPrefix(rawName, category);

    // Normalise key strings to uppercase
    const normalisedHotkeys: HotkeyBinding[] = hotkeys.map((hk) => ({
      modifiers: hk.modifiers,
      key: hk.key.toUpperCase(),
    }));

    entries.push({
      id,
      name,
      category,
      hotkeys: normalisedHotkeys,
    });
  }

  // Group by category
  const groupMap = new Map<string, HotkeyEntry[]>();
  for (const entry of entries) {
    const bucket = groupMap.get(entry.category);
    if (bucket) {
      bucket.push(entry);
    } else {
      groupMap.set(entry.category, [entry]);
    }
  }

  // Sort entries alphabetically within each group
  for (const bucket of groupMap.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Output order: core categories in defined order, then plugins alphabetically
  const coreCategories = CATEGORY_ORDER.filter((cat) => groupMap.has(cat));
  const pluginCategories = [...groupMap.keys()]
    .filter((cat) => !CATEGORY_ORDER.includes(cat))
    .sort((a, b) => a.localeCompare(b));

  return [...coreCategories, ...pluginCategories].map((category) => ({
    category,
    entries: groupMap.get(category)!,
  }));
}

interface ObsidianHotkeyManager {
  defaultKeys: Record<string, HotkeyBinding[]>;
  customKeys: Record<string, HotkeyBinding[]>;
}

interface AppWithInternals extends App {
  hotkeyManager?: ObsidianHotkeyManager;
  commands?: { commands: Record<string, { id: string; name: string }> };
}

/**
 * Collect all assigned hotkeys from the Obsidian runtime, categorise them,
 * sort them, and return an ordered list of category groups.
 *
 * Accesses `app.hotkeyManager.defaultKeys` and `app.hotkeyManager.customKeys`,
 * which are undocumented internal properties. A runtime guard protects against
 * future API changes.
 */
export function collectHotkeys(app: App): CategoryGroup[] {
  const hm = (app as AppWithInternals).hotkeyManager;

  if (!hm?.defaultKeys || !hm?.customKeys) {
    console.warn(
      "[Hotkeys Cheatsheet] hotkeyManager.defaultKeys / customKeys unavailable — hotkey display is empty."
    );
    return [];
  }

  const commands = (app as AppWithInternals).commands?.commands;

  if (!commands) {
    console.warn("[Hotkeys Cheatsheet] app.commands.commands unavailable.");
    return [];
  }

  return buildHotkeyGroups(hm.defaultKeys, hm.customKeys, commands);
}
