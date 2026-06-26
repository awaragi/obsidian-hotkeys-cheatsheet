import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  HotkeysCheatsheetSettings,
  HotkeysCheatsheetSettingTab,
} from "./settingsTab";
import { t } from "./i18n";
import { CheatsheetModal } from "./cheatsheetModal";

export default class HotkeysCheatsheetPlugin extends Plugin {
  settings!: HotkeysCheatsheetSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HotkeysCheatsheetSettingTab(this.app, this));

    if (this.settings.showRibbonIcon) {
      this.addRibbonIcon("keyboard", t("ribbon.tooltip"), () => {
        this.openCheatsheet();
      });
    }

    this.addCommand({
      id: "open",
      name: t("command.name"),
      callback: () => this.openCheatsheet(),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<HotkeysCheatsheetSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openCheatsheet() {
    new CheatsheetModal(this.app).open();
  }
}
