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
