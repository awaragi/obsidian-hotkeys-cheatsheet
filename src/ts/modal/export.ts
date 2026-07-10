import { App, Notice, TFile } from "obsidian";
import type { CategoryGroup } from "../types";
import { t, locale, isRtl } from "../i18n/i18n";
import { modLabel, keyIcon } from "../hotkeys/keyDisplay";
import { categoryDisplayLabel } from "../hotkeys/categories";
import { fillTemplate, renderHtmlSections, escapeMarkdownTableCell } from "./htmlExportTemplate";
import type { CheatsheetState } from "./state";

/** Note filename, derived from the translated title so it matches the active locale. */
export function exportNoteFilename(): string {
  return `${t("modal.title")}.md`;
}

/** HTML export filename, derived from the translated title so it matches the active locale. */
export function exportHtmlFilename(): string {
  return `${t("modal.title")}.html`;
}

/** How long an "already exists" overwrite confirmation stays valid — matches the Notice's visible duration. */
export const EXPORT_OVERWRITE_CONFIRM_MS = 5000;

// Export always reflects the raw category/alphabetical structure — never
// the active sort mode or usage indicators, regardless of tracking state.

export function generateMarkdown(groups: CategoryGroup[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    `# ${t("modal.title")}`,
    ``,
    `*${t("modal.export_subtitle", { date: today })}*`,
  ];
  for (const group of groups) {
    lines.push(``, `## ${categoryDisplayLabel(group.category)}`, ``);
    lines.push(`| ${t("modal.export_table_command")} | ${t("modal.export_table_hotkey")} |`);
    lines.push(`|---------|--------|`);
    for (const entry of group.entries) {
      const hotkeyStr = entry.hotkeys
        .map((hk) => {
          const parts = [...hk.modifiers.map(modLabel), keyIcon(hk.key)];
          return parts.map((p) => `\`${p}\``).join(" + ");
        })
        .join(" / ");
      lines.push(`| ${escapeMarkdownTableCell(entry.name)} | ${hotkeyStr} |`);
    }
  }
  return lines.join("\n");
}

/**
 * Writes `groups` to a markdown note in the vault, prompting for overwrite
 * confirmation via `state`'s pending-overwrite window when the file already
 * exists. Calls `onSaved` with the written file once the write succeeds.
 */
export async function exportNoteToVault(
  app: App,
  groups: CategoryGroup[],
  state: CheatsheetState,
  onSaved: (file: TFile) => void | Promise<void>
): Promise<void> {
  const folder = app.workspace.getActiveFile()?.parent?.path ?? "/";
  const filename = exportNoteFilename();
  const path = folder === "/" ? filename : `${folder}/${filename}`;
  const existing = app.vault.getAbstractFileByPath(path);

  const confirmed = state.isOverwriteConfirmed(path);

  if (existing instanceof TFile && !confirmed) {
    state.requestOverwriteConfirm(path, EXPORT_OVERWRITE_CONFIRM_MS);
    new Notice(t("modal.export_exists", { path }), EXPORT_OVERWRITE_CONFIRM_MS);
    return;
  }

  const content = generateMarkdown(groups);
  try {
    let savedFile: TFile;
    if (existing instanceof TFile) {
      await app.vault.modify(existing, content);
      savedFile = existing;
    } else {
      savedFile = await app.vault.create(path, content);
    }
    state.clearPendingOverwrite();
    await onSaved(savedFile);
  } catch (err) {
    new Notice(t("modal.export_failed", { error: String(err) }));
  }
}

export function generateHtml(groups: CategoryGroup[]): string {
  const title = t("modal.title");
  const date = new Date().toISOString().slice(0, 10);
  const content = renderHtmlSections(groups);
  const loc = locale();
  return fillTemplate(title, date, content, loc, isRtl(loc) ? "rtl" : "ltr");
}

/** Triggers a browser download of `groups` rendered as a standalone HTML file. */
export function saveHtmlDownload(groups: CategoryGroup[]): void {
  const html = generateHtml(groups);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = activeDocument.createElement("a");
  a.href = url;
  a.download = exportHtmlFilename();
  a.click();
  URL.revokeObjectURL(url);
}
