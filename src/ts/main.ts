import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  HotkeysCheatsheetSettings,
  HotkeysCheatsheetSettingTab,
} from "./settingsTab";
import { t } from "./i18n";
import { CheatsheetModal } from "./cheatsheetModal";

export default class HotkeysCheatsheetPlugin extends Plugin {
  settings: HotkeysCheatsheetSettings;
  private ribbonEl: HTMLElement;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new HotkeysCheatsheetSettingTab(this.app, this));

    this.ribbonEl = this.addRibbonIcon("keyboard", t("ribbon.tooltip"), () => {
      this.openCheatsheet();
    });

    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.showRibbonIcon) {
        this.ribbonEl.hide();
      }
    });

    this.addCommand({
      id: "open-hotkeys-cheatsheet",
      name: t("command.name"),
      callback: () => this.openCheatsheet(),
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async setRibbonVisible(visible: boolean) {
    this.settings.showRibbonIcon = visible;
    await this.saveSettings();
    visible ? this.ribbonEl.show() : this.ribbonEl.hide();
  }

  private openCheatsheet() {
    new CheatsheetModal(this.app).open();
  }
}
