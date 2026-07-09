import { App, Modal } from "obsidian";
import type { HotkeysCheatsheetSettings } from "../types";
import { t } from "../i18n/i18n";
import { CheatsheetState } from "./state";
import { Toolbar } from "./toolbar";
import { GridRenderer } from "./grid";
import { exportNoteToVault, saveHtmlDownload } from "./export";
import { jumpToHotkey } from "./jumpToHotkey";

export class CheatsheetModal extends Modal {
  private settings: HotkeysCheatsheetSettings;
  private state = new CheatsheetState();
  private toolbar!: Toolbar;
  private gridRenderer!: GridRenderer;

  constructor(app: App, settings: HotkeysCheatsheetSettings) {
    super(app);
    this.settings = settings;
  }

  /**
   * Override close() so Escape clears an active search before closing.
   * The built-in Obsidian Escape handler calls modal.close().
   */
  close() {
    if (this.state.searchQuery) {
      this.toolbar.applySearchClear();
    } else {
      super.close();
    }
  }

  onOpen() {
    this.modalEl.addClass("hkc-full-modal");
    this.titleEl.setText(t("modal.title"));

    this.state.load(this.app);
    this.buildUI();
    this.toolbar.attach(activeDocument);
  }

  onClose() {
    this.toolbar.detach(activeDocument);
    this.state.clearPendingOverwrite();
    this.contentEl.empty();
  }

  private buildUI() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("hkc-content");

    this.toolbar = new Toolbar(this.settings, this.state, {
      onChange: () => this.gridRenderer.render(),
      onExportNote: () => void this.exportNote(),
      onExportHtml: () => saveHtmlDownload(this.state.groups),
    });
    this.toolbar.build(contentEl);

    const gridEl = contentEl.createDiv({ cls: "hkc-grid" });
    this.gridRenderer = new GridRenderer(gridEl, this.state, this.settings, {
      onRendered: () => this.toolbar.updateCollapseToggle(),
      onJumpToHotkey: (name) => jumpToHotkey(this.app, name),
    });
    this.gridRenderer.render();

    window.setTimeout(() => this.toolbar.focusSearch(), 30);
  }

  private async exportNote() {
    await exportNoteToVault(this.app, this.state.groups, this.state, async (file) => {
      super.close();
      await this.app.workspace.getLeaf().openFile(file);
    });
  }
}
