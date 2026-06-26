import { App, PluginSettingTab, Setting } from "obsidian";
import type HotkeysCheatsheetPlugin from "./main";
import { t } from "./i18n";
import type { HotkeysCheatsheetSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

export type { HotkeysCheatsheetSettings };
export { DEFAULT_SETTINGS };

export class HotkeysCheatsheetSettingTab extends PluginSettingTab {
  plugin: HotkeysCheatsheetPlugin;

  constructor(app: App, plugin: HotkeysCheatsheetPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName(t("settings.heading")).setHeading();

    new Setting(containerEl)
      .setName(t("settings.ribbon.label"))
      .setDesc(t("settings.ribbon.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showRibbonIcon)
          .onChange(async (value) => {
          this.plugin.settings.showRibbonIcon = value;
          await this.plugin.saveSettings();
        })
      );

    const about = containerEl.createDiv({ cls: "hkc-about" });

    const aboutName = about.createEl("p", { cls: "hkc-about-name" });
    aboutName.createEl("strong", { text: t("settings.about.name") });
    aboutName.appendText(` \u2014 v${this.plugin.manifest.version}`);

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
