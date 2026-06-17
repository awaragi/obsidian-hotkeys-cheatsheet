import { App, PluginSettingTab } from "obsidian";
import type HotkeysCheatsheetPlugin from "./main";
import { t } from "./i18n";

export interface HotkeysCheatsheetSettings {
  // No user-configurable settings in v1
}

export const DEFAULT_SETTINGS: HotkeysCheatsheetSettings = {};

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

    const about = containerEl.createDiv({ cls: "hkc-about" });

    about.createEl("p", { cls: "hkc-about-name" }).innerHTML =
      `<strong>${t("settings.about.name")}</strong> &mdash; v${this.plugin.manifest.version}`;

    about.createEl("p", {
      text: t("settings.about.description"),
      cls: "hkc-about-desc",
    });

    about.createEl("p", {
      text: t("settings.about.author"),
      cls: "hkc-about-author",
    });
  }
}
