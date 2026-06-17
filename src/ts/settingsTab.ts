import { App, PluginSettingTab, Setting } from "obsidian";
import type HotkeysCheatsheetPlugin from "./main";
import { t } from "./i18n";

export interface HotkeysCheatsheetSettings {
  // TODO: add plugin settings here
}

export const DEFAULT_SETTINGS: HotkeysCheatsheetSettings = {
  // TODO: add default values here
};

export class HotkeysCheatsheetSettingTab extends PluginSettingTab {
  plugin: HotkeysCheatsheetPlugin;

  constructor(app: App, plugin: HotkeysCheatsheetPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: t("settings.heading") });

    // TODO: add settings here
    new Setting(containerEl)
      .setName(t("settings.placeholder.name"))
      .setDesc(t("settings.placeholder.desc"));
  }
}
