import { describe, it, expect } from "vitest";
import { isSuspectedSystemShortcut, systemShortcutLabelKey } from "./systemShortcuts";

/** Recognized on every platform. */
const COMMON_SIGNATURES = [
  "Mod+C",
  "Mod+X",
  "Mod+V",
  "Mod+A",
  "Mod+Z",
  "Mod+Shift+Z",
  "Mod+ARROWLEFT",
  "Mod+ARROWRIGHT",
  "Mod+ARROWUP",
  "Mod+ARROWDOWN",
  "Mod+BACKSPACE",
  "Mod+Shift+ARROWLEFT",
  "Mod+Shift+ARROWRIGHT",
];

/** Recognized on macOS only — Option/Alt-based word navigation and selection. */
const MAC_ONLY_SIGNATURES = ["Alt+ARROWLEFT", "Alt+ARROWRIGHT", "Shift+Alt+ARROWLEFT", "Shift+Alt+ARROWRIGHT"];

describe("isSuspectedSystemShortcut", () => {
  it.each(COMMON_SIGNATURES)("recognizes %s as a system shortcut on both platforms", (signature) => {
    expect(isSuspectedSystemShortcut(signature, true)).toBe(true);
    expect(isSuspectedSystemShortcut(signature, false)).toBe(true);
  });

  it.each(MAC_ONLY_SIGNATURES)("recognizes %s as a system shortcut on macOS only", (signature) => {
    expect(isSuspectedSystemShortcut(signature, true)).toBe(true);
    expect(isSuspectedSystemShortcut(signature, false)).toBe(false);
  });

  it("does not recognize an unrelated signature", () => {
    expect(isSuspectedSystemShortcut("Mod+K", true)).toBe(false);
    expect(isSuspectedSystemShortcut("Mod+K", false)).toBe(false);
  });

  it("does not recognize a recognized key with an extra modifier", () => {
    expect(isSuspectedSystemShortcut("Mod+Shift+V", true)).toBe(false);
  });
});

describe("systemShortcutLabelKey", () => {
  it.each([
    ["Mod+C", "modal.system_shortcut_copy"],
    ["Mod+X", "modal.system_shortcut_cut"],
    ["Mod+V", "modal.system_shortcut_paste"],
    ["Mod+A", "modal.system_shortcut_select_all"],
    ["Mod+Z", "modal.system_shortcut_undo"],
    ["Mod+Shift+Z", "modal.system_shortcut_redo"],
    ["Mod+ARROWLEFT", "modal.system_shortcut_line_start"],
    ["Mod+ARROWRIGHT", "modal.system_shortcut_line_end"],
    ["Mod+ARROWUP", "modal.system_shortcut_doc_start"],
    ["Mod+ARROWDOWN", "modal.system_shortcut_doc_end"],
    ["Mod+BACKSPACE", "modal.system_shortcut_delete_line_start"],
    ["Mod+Shift+ARROWLEFT", "modal.system_shortcut_select_line_start"],
    ["Mod+Shift+ARROWRIGHT", "modal.system_shortcut_select_line_end"],
    ["Alt+ARROWLEFT", "modal.system_shortcut_word_left"],
    ["Alt+ARROWRIGHT", "modal.system_shortcut_word_right"],
    ["Shift+Alt+ARROWLEFT", "modal.system_shortcut_select_word_left"],
    ["Shift+Alt+ARROWRIGHT", "modal.system_shortcut_select_word_right"],
  ])("maps %s to %s on macOS", (signature, expectedKey) => {
    expect(systemShortcutLabelKey(signature, true)).toBe(expectedKey);
  });

  it.each([
    ["Mod+C", "modal.system_shortcut_copy"],
    ["Mod+Z", "modal.system_shortcut_undo"],
    ["Mod+Shift+Z", "modal.system_shortcut_redo"],
    ["Mod+ARROWLEFT", "modal.system_shortcut_word_left"],
    ["Mod+ARROWRIGHT", "modal.system_shortcut_word_right"],
    ["Mod+ARROWUP", "modal.system_shortcut_paragraph_up"],
    ["Mod+ARROWDOWN", "modal.system_shortcut_paragraph_down"],
    ["Mod+BACKSPACE", "modal.system_shortcut_delete_word"],
    ["Mod+Shift+ARROWLEFT", "modal.system_shortcut_select_word_left"],
    ["Mod+Shift+ARROWRIGHT", "modal.system_shortcut_select_word_right"],
  ])("maps %s to %s on Windows/Linux", (signature, expectedKey) => {
    expect(systemShortcutLabelKey(signature, false)).toBe(expectedKey);
  });

  it.each(MAC_ONLY_SIGNATURES)("has no Windows/Linux label for macOS-only signature %s", (signature) => {
    expect(systemShortcutLabelKey(signature, false)).toBeUndefined();
  });

  it("returns undefined for a signature with no known label, on either platform", () => {
    expect(systemShortcutLabelKey("Mod+K", true)).toBeUndefined();
    expect(systemShortcutLabelKey("Mod+K", false)).toBeUndefined();
  });

  it("resolves every common signature on both platforms", () => {
    for (const signature of COMMON_SIGNATURES) {
      expect(systemShortcutLabelKey(signature, true)).toBeDefined();
      expect(systemShortcutLabelKey(signature, false)).toBeDefined();
    }
  });
});
