import type { TranslationKey } from "../i18n/i18n";

/**
 * Canonical signatures (in the same `Mod+Ctrl+Meta+Shift+Alt+KEY` format as
 * `buildSignature`) for OS/Electron-reserved shortcuts, mapped to the i18n
 * key describing what each one does on macOS. `Mod` normalizes Cmd (macOS)
 * and Ctrl (Windows/Linux) into one token, so most of these signatures are
 * reserved on every platform — but several do something different depending
 * on platform (see `OTHER_LABEL_KEYS` below), and the `Alt+ArrowLeft/Right`
 * and `Shift+Alt+ArrowLeft/Right` entries (word jump / word selection via
 * Option on macOS) aren't recognized on Windows/Linux at all, since Alt's
 * meaning there isn't consistent/confirmed enough to flag — the Windows/
 * Linux equivalents (`Mod+Arrow`, `Mod+Shift+Arrow`) are already covered.
 */
const MAC_LABEL_KEYS: Record<string, TranslationKey> = {
  "Mod+C": "modal.system_shortcut_copy",
  "Mod+X": "modal.system_shortcut_cut",
  "Mod+V": "modal.system_shortcut_paste",
  "Mod+A": "modal.system_shortcut_select_all",
  "Mod+Z": "modal.system_shortcut_undo",
  "Mod+Shift+Z": "modal.system_shortcut_redo",
  "Mod+ARROWLEFT": "modal.system_shortcut_line_start",
  "Mod+ARROWRIGHT": "modal.system_shortcut_line_end",
  "Mod+ARROWUP": "modal.system_shortcut_doc_start",
  "Mod+ARROWDOWN": "modal.system_shortcut_doc_end",
  "Mod+BACKSPACE": "modal.system_shortcut_delete_line_start",
  "Mod+Shift+ARROWLEFT": "modal.system_shortcut_select_line_start",
  "Mod+Shift+ARROWRIGHT": "modal.system_shortcut_select_line_end",
  "Alt+ARROWLEFT": "modal.system_shortcut_word_left",
  "Alt+ARROWRIGHT": "modal.system_shortcut_word_right",
  // Option+Shift+Arrow extends the selection by one word — same concept as
  // Windows/Linux's Ctrl+Shift+Arrow below, so it reuses those label keys.
  "Shift+Alt+ARROWLEFT": "modal.system_shortcut_select_word_left",
  "Shift+Alt+ARROWRIGHT": "modal.system_shortcut_select_word_right",
};

/**
 * Windows/Linux labels. Several diverge from the macOS meaning because
 * `Ctrl` (which `Mod` normalizes to on these platforms) is conventionally
 * the *word/paragraph*-wise navigation modifier, where macOS uses it for
 * *line/document*-wise navigation (that role is `Option`/`Alt` on macOS
 * instead — `Ctrl+Arrow` is already "word jump" here, so there's no
 * separate `Alt+Arrow` entry on this platform).
 */
const OTHER_LABEL_KEYS: Record<string, TranslationKey> = {
  "Mod+C": "modal.system_shortcut_copy",
  "Mod+X": "modal.system_shortcut_cut",
  "Mod+V": "modal.system_shortcut_paste",
  "Mod+A": "modal.system_shortcut_select_all",
  "Mod+Z": "modal.system_shortcut_undo",
  "Mod+Shift+Z": "modal.system_shortcut_redo",
  "Mod+ARROWLEFT": "modal.system_shortcut_word_left",
  "Mod+ARROWRIGHT": "modal.system_shortcut_word_right",
  "Mod+ARROWUP": "modal.system_shortcut_paragraph_up",
  "Mod+ARROWDOWN": "modal.system_shortcut_paragraph_down",
  "Mod+BACKSPACE": "modal.system_shortcut_delete_word",
  "Mod+Shift+ARROWLEFT": "modal.system_shortcut_select_word_left",
  "Mod+Shift+ARROWRIGHT": "modal.system_shortcut_select_word_right",
};

/** The i18n key describing what `signature` does on the given platform, or `undefined` if it isn't a recognized system shortcut on that platform. */
export function systemShortcutLabelKey(signature: string, isMac: boolean): TranslationKey | undefined {
  return (isMac ? MAC_LABEL_KEYS : OTHER_LABEL_KEYS)[signature];
}

/** True if `signature` matches a known OS-reserved shortcut, on the given platform, that can never be bound to an Obsidian command. */
export function isSuspectedSystemShortcut(signature: string, isMac: boolean): boolean {
  return systemShortcutLabelKey(signature, isMac) !== undefined;
}
