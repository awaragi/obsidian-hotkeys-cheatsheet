export interface HotkeyBinding {
  modifiers: string[];
  key: string;
}

export interface HotkeyEntry {
  id: string;
  name: string;
  category: string;
  hotkeys: HotkeyBinding[];
  /** True if the effective binding set differs from Obsidian's shipped default (added and/or remapped), or the command has no shipped default at all. */
  isModifiedFromDefault: boolean;
}

export interface CategoryGroup {
  category: string;
  entries: HotkeyEntry[];
}

export type SortMode =
  | "category"
  | "modifier"
  | "key"
  | "most-used-category"
  | "most-used-shortcut";

export interface HotkeysCheatsheetSettings {
  showRibbonIcon: boolean;
  trackShortcutUsage: boolean;
}

export const DEFAULT_SETTINGS: HotkeysCheatsheetSettings = {
  showRibbonIcon: true,
  trackShortcutUsage: false,
};
