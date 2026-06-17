import { App } from "obsidian";
import { CORE_PREFIX_MAP, CATEGORY_ORDER } from "./categories";

export interface HotkeyBinding {
  modifiers: string[];
  key: string;
}

export interface HotkeyEntry {
  id: string;
  name: string;
  category: string;
  hotkeys: HotkeyBinding[];
}

export interface CategoryGroup {
  category: string;
  entries: HotkeyEntry[];
}

/** Convert a hyphen/underscore/space-separated string to Title Case. */
function toTitleCase(str: string): string {
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
function categorise(id: string, displayName: string): string {
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

/**
 * Collect all assigned hotkeys from the Obsidian runtime, categorise them,
 * sort them, and return an ordered list of category groups.
 *
 * Accesses `app.hotkeyManager.defaultKeys` and `app.hotkeyManager.customKeys`,
 * which are undocumented internal properties. A runtime guard protects against
 * future API changes.
 */
export function collectHotkeys(app: App): CategoryGroup[] {
  // Runtime guard — these are undocumented internal properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hm = (app as any).hotkeyManager as
    | {
        defaultKeys: Record<string, HotkeyBinding[]>;
        customKeys: Record<string, HotkeyBinding[]>;
      }
    | undefined;

  if (!hm?.defaultKeys || !hm?.customKeys) {
    console.warn(
      "[Hotkeys Cheatsheet] hotkeyManager.defaultKeys / customKeys unavailable — hotkey display is empty."
    );
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commands = (app as any).commands?.commands as
    | Record<string, { id: string; name: string }>
    | undefined;

  if (!commands) {
    console.warn("[Hotkeys Cheatsheet] app.commands.commands unavailable.");
    return [];
  }

  const { defaultKeys, customKeys } = hm;

  // All IDs that have any record in either store
  const allIds = new Set([...Object.keys(defaultKeys), ...Object.keys(customKeys)]);

  const entries: HotkeyEntry[] = [];

  for (const id of allIds) {
    // Merge rule: customKeys wins; if present (even []), don't fall back
    const hotkeys: HotkeyBinding[] =
      id in customKeys ? customKeys[id] : (defaultKeys[id] ?? []);

    // Skip unassigned (user cleared the default, or entry has no hotkeys)
    if (hotkeys.length === 0) continue;

    const cmd = commands[id];
    const name = cmd?.name ?? id;

    // Normalise key strings to uppercase (task 1.5)
    const normalisedHotkeys: HotkeyBinding[] = hotkeys.map((hk) => ({
      modifiers: hk.modifiers,
      key: hk.key.toUpperCase(),
    }));

    entries.push({
      id,
      name,
      category: categorise(id, name),
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
