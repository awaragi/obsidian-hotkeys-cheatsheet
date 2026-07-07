import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type HotkeysCheatsheetPlugin from "./main";
import { t } from "./i18n/i18n";
import type { HotkeysCheatsheetSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { startCapture, stopCapture, resetUsageData } from "./usage/usageTracker";

export type { HotkeysCheatsheetSettings };
export { DEFAULT_SETTINGS };

const RESET_CONFIRM_TIMEOUT_MS = 5000;

export class HotkeysCheatsheetSettingTab extends PluginSettingTab {
  plugin: HotkeysCheatsheetPlugin;
  private resetPending = false;

  constructor(app: App, plugin: HotkeysCheatsheetPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    this.resetPending = false;
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

    new Setting(containerEl)
      .setName(t("settings.usage_tracking.label"))
      .setDesc(t("settings.usage_tracking.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.trackShortcutUsage)
          .onChange(async (value) => {
            this.plugin.settings.trackShortcutUsage = value;
            await this.plugin.saveSettings();
            if (value) {
              startCapture(this.plugin.app);
            } else {
              stopCapture();
            }
          })
      );

    new Setting(containerEl)
      .setName(t("settings.usage_tracking.reset_label"))
      .setDesc(t("settings.usage_tracking.reset_desc"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.usage_tracking.reset_label"))
          .setDestructive()
          .onClick(async () => {
            if (!this.resetPending) {
              this.resetPending = true;
              new Notice(t("settings.usage_tracking.reset_confirm"), RESET_CONFIRM_TIMEOUT_MS);
              window.setTimeout(() => {
                this.resetPending = false;
              }, RESET_CONFIRM_TIMEOUT_MS);
              return;
            }
            this.resetPending = false;
            await resetUsageData();
            new Notice(t("settings.usage_tracking.reset_success"));
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
