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

export interface HotkeysCheatsheetSettings {
  showRibbonIcon: boolean;
}

export const DEFAULT_SETTINGS: HotkeysCheatsheetSettings = {
  showRibbonIcon: true,
};
