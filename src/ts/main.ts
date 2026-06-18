import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  HotkeysCheatsheetSettings,
  HotkeysCheatsheetSettingTab,
} from "./settingsTab";
import { CheatsheetModal } from "./cheatsheetModal";

export default class HotkeysCheatsheetPlugin extends Plugin {
  settings!: HotkeysCheatsheetSettings;
  private ribbonEl!: HTMLElement;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HotkeysCheatsheetSettingTab(this.app, this));

    this.ribbonEl = this.addRibbonIcon("keyboard", "Open Hotkeys Cheatsheet", () => {
      this.openCheatsheet();
    });

    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.showRibbonIcon) {
        this.ribbonEl.hide();
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<HotkeysCheatsheetSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async setRibbonVisible(visible: boolean) {
    this.settings.showRibbonIcon = visible;
    await this.saveSettings();
    if (visible) {
      this.ribbonEl.show();
    } else {
      this.ribbonEl.hide();
    }
  }

  private openCheatsheet() {
    new CheatsheetModal(this.app).open();
  }
}
