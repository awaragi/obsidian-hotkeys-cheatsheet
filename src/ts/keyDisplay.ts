import { Platform } from "obsidian";

/** Human-readable modifier badge labels on macOS. */
export const MOD_LABEL_MAC: Record<string, string> = {
  Mod: "Cmd",
  Meta: "Cmd",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Option",
};

/** Human-readable modifier badge labels on Windows / Linux. */
export const MOD_LABEL_WIN: Record<string, string> = {
  Mod: "Ctrl",
  Meta: "Win",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Alt",
};

/**
 * Filter dropdown label for a modifier token on macOS.
 * Consolidated from the inline map previously in filterLabel() and MOD_LABEL_MAC.
 * On macOS we show OS names (Cmd, Option…). Meta is intentionally omitted from
 * the filter UI (not a user-facing filter token).
 */
export const FILTER_LABEL_MAC: Record<string, string> = {
  Mod: "Cmd",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Option",
};

/** Returns the human-readable modifier badge label for the current platform. */
export function modLabel(token: string): string {
  return Platform.isMacOS
    ? (MOD_LABEL_MAC[token] ?? token)
    : (MOD_LABEL_WIN[token] ?? token);
}

/**
 * Filter dropdown label for a modifier token.
 * On macOS we show OS names (Cmd, Option…). On Windows we keep the abstract
 * token name to avoid showing "Ctrl" twice (Mod and Ctrl both map to Ctrl).
 */
export function filterLabel(token: string): string {
  if (!Platform.isMacOS) return token;
  return FILTER_LABEL_MAC[token] ?? token;
}

/** Maps uppercased key names to display symbols. */
export const KEY_ICONS: Record<string, string> = {
  ARROWUP: "↑",
  ARROWDOWN: "↓",
  ARROWLEFT: "←",
  ARROWRIGHT: "→",
  ENTER: "↵",
  BACKSPACE: "⌫",
  DELETE: "⌦",
  TAB: "⇥",
  PAGEUP: "PgUp",
  PAGEDOWN: "PgDn",
  HOME: "Home",
  END: "End",
  ESCAPE: "Esc",
};

/** Returns a display string for a (already-uppercased) key value. */
export function keyIcon(key: string): string {
  return KEY_ICONS[key] ?? key;
}
