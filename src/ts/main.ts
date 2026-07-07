import { Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  HotkeysCheatsheetSettings,
  HotkeysCheatsheetSettingTab,
} from "./settingsTab";
import { t } from "./i18n/i18n";
import { CheatsheetModal } from "./modal/cheatsheet";
import { loadUsageData, startCapture, stopCapture, flushUsageData } from "./usage/usageTracker";

export default class HotkeysCheatsheetPlugin extends Plugin {
  settings!: HotkeysCheatsheetSettings;

  async onload() {
    await this.loadSettings();

    const persistenceAvailable = await loadUsageData(this.app, this.manifest.dir);
    if (this.settings.trackShortcutUsage) {
      if (persistenceAvailable) {
        startCapture(this.app);
      } else {
        console.warn(
          "[Hotkeys Cheatsheet] Usage tracking is enabled but the plugin directory is unavailable — capture was not started."
        );
      }
    }

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

  onunload() {
    stopCapture();
    void flushUsageData();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<HotkeysCheatsheetSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private openCheatsheet() {
    new CheatsheetModal(this.app, this.settings).open();
  }
}
