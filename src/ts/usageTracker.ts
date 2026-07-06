import { App, Keymap, Modifier, Platform, debounce, normalizePath } from "obsidian";
import type { Debouncer } from "obsidian";

export interface UsageData {
  version: 1;
  counts: Record<string, number>;
}

const USAGE_DATA_FILENAME = "usage-data.json";
const FLUSH_INTERVAL_MS = 2000;

/** Fixed modifier ordering used by every signature, matching keyDisplay's display order. */
export const MODIFIER_ORDER: Modifier[] = ["Mod", "Ctrl", "Meta", "Shift", "Alt"];

const MODIFIER_KEYS = new Set<string>(["Control", "Shift", "Alt", "Meta"]);

/**
 * `Keymap.isModifier` reports both "Mod" and its platform-native literal alias
 * (Meta on macOS, Ctrl elsewhere) as true for the exact same physical keypress
 * — there's only one key, not two. Obsidian's own stored hotkey bindings never
 * carry both at once for a cross-platform binding (just `["Mod"]`), so capturing
 * both here would make the signature permanently unmatchable against real
 * bindings. Drop the redundant literal alias whenever "Mod" is present.
 */
function dedupeModAlias(modifiers: Modifier[]): Modifier[] {
  if (!modifiers.includes("Mod")) return modifiers;
  const alias: Modifier = Platform.isMacOS ? "Meta" : "Ctrl";
  return modifiers.filter((mod) => mod !== alias);
}

/**
 * Build the canonical `Mod+Ctrl+Meta+Shift+Alt+KEY` signature (only held/present
 * modifiers included, in fixed order) from an already-known modifier list + key.
 * Shared by capture (from a live KeyboardEvent) and display (from a stored
 * HotkeyBinding) so both sides always agree on the same string for the same
 * physical combination.
 */
export function buildSignature(modifiers: string[], key: string): string {
  const held = new Set(modifiers);
  const ordered = MODIFIER_ORDER.filter((mod) => held.has(mod));
  return [...ordered, key.toUpperCase()].join("+");
}

/** Inverse of buildSignature: splits a signature back into modifiers + key. */
export function parseSignature(signature: string): { modifiers: string[]; key: string } {
  const parts = signature.split("+");
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  return { modifiers, key };
}

/**
 * True if `key` is a single ASCII letter or digit — the only single-character
 * `evt.key` values a real shortcut press should ever produce; anything else
 * single-character is either punctuation or a composed/accented character.
 */
function isAsciiAlnum(key: string): boolean {
  if (key.length !== 1) return false;
  const code = key.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * On macOS, Option (Alt) doubles as the compose modifier for accented/special
 * characters on many non-US layouts — e.g. on a Canadian CSA layout, Option+S
 * produces "ß" and Option+A produces "æ" directly, with no intermediate "Dead"
 * state. macOS only composes this way when Option is held without Cmd/Ctrl
 * (those combinations are treated as app shortcuts, not text input), so this
 * only applies when Alt is the sole non-Shift qualifying modifier. Any
 * resulting single character outside plain ASCII letters/digits is ordinary
 * composed text, not a shortcut — trading off the rare genuine Alt+letter
 * hotkey invocation that happens to compose on a given layout, in exchange for
 * not polluting usage counts with everyday accented-character typing.
 */
function isComposedAltCharacter(evt: KeyboardEvent): boolean {
  if (!evt.altKey || evt.ctrlKey || evt.metaKey) return false;
  return evt.key.length === 1 && !isAsciiAlnum(evt.key);
}

/**
 * Pure filter + canonicalisation for a raw keydown event. Returns null for
 * modifier-only keys, repeat events, and events that aren't a good shortcut
 * candidate — a bare key (Escape, Enter, arrows, ...) is indistinguishable
 * from normal typing/navigation and would just be noise, so at least one of
 * Ctrl/Meta/Alt must be held. Otherwise returns the canonical signature.
 */
export function canonicaliseKeydown(evt: KeyboardEvent): string | null {
  if (evt.repeat) return null;
  if (MODIFIER_KEYS.has(evt.key)) return null;
  // "Dead" is an intermediate composition state (e.g. Option/Alt used to type an
  // accented character on international layouts), not a shortcut candidate.
  if (evt.key === "Dead") return null;
  if (isComposedAltCharacter(evt)) return null;

  const hasModifier = evt.ctrlKey || evt.metaKey || evt.altKey;
  if (!hasModifier) return null;

  const heldModifiers = MODIFIER_ORDER.filter((mod) => Keymap.isModifier(evt, mod));
  return buildSignature(dedupeModAlias(heldModifiers), evt.key);
}

// ── In-memory counters & persistence ────────────────────────────────────────

let counters: Record<string, number> = {};
let appRef: App | null = null;
let usageFilePath: string | null = null;
let flushDebounced: Debouncer<[], void> | null = null;
let keydownListener: ((evt: KeyboardEvent) => void) | null = null;

function getUsageFilePath(pluginDir: string): string {
  return normalizePath(`${pluginDir}/${USAGE_DATA_FILENAME}`);
}

async function writeUsageData(): Promise<void> {
  if (!appRef || !usageFilePath) return;
  const data: UsageData = { version: 1, counts: { ...counters } };
  try {
    await appRef.vault.adapter.write(usageFilePath, JSON.stringify(data));
  } catch (err) {
    console.error("[Hotkeys Cheatsheet] Failed to write usage data:", err);
  }
}

/**
 * Reads the usage data file at startup, tolerating a missing file (→ empty counters).
 * Returns whether persistence is available (i.e. `pluginDir` was provided) — when
 * `false`, `writeUsageData` will always no-op, so capture should not be started.
 */
export async function loadUsageData(app: App, pluginDir: string | undefined): Promise<boolean> {
  appRef = app;
  counters = {};

  if (!pluginDir) {
    usageFilePath = null;
    flushDebounced = null;
    return false;
  }

  usageFilePath = getUsageFilePath(pluginDir);
  flushDebounced = debounce(() => void writeUsageData(), FLUSH_INTERVAL_MS, false);

  if (await appRef.vault.adapter.exists(usageFilePath)) {
    try {
      const parsed = JSON.parse(await appRef.vault.adapter.read(usageFilePath)) as UsageData;
      counters = { ...parsed.counts };
    } catch {
      counters = {};
    }
  }
  return true;
}

/** Returns a snapshot of the current in-memory usage counts. */
export function getUsageCounts(): Record<string, number> {
  return { ...counters };
}

/** Increments the in-memory count for a signature and schedules a throttled flush. */
export function increment(signature: string): void {
  counters[signature] = (counters[signature] ?? 0) + 1;
  flushDebounced?.();
}

/** Clears all counters and writes the empty state to disk immediately. */
export async function resetUsageData(): Promise<void> {
  counters = {};
  flushDebounced?.cancel();
  await writeUsageData();
}

/** Best-effort immediate write of the current in-memory counts (e.g. on unload). */
export async function flushUsageData(): Promise<void> {
  flushDebounced?.cancel();
  await writeUsageData();
}

// ── Capture listener lifecycle ──────────────────────────────────────────────

function handleKeydown(evt: KeyboardEvent): void {
  const signature = canonicaliseKeydown(evt);
  if (signature) increment(signature);
}

/** Registers the capture-phase keydown listener. No-op if already capturing. */
export function startCapture(app: App): void {
  appRef = app;
  if (keydownListener) return;
  keydownListener = handleKeydown;
  window.addEventListener("keydown", keydownListener, { capture: true });
}

/** Removes the capture-phase keydown listener. No-op if not currently capturing. */
export function stopCapture(): void {
  if (!keydownListener) return;
  window.removeEventListener("keydown", keydownListener, { capture: true });
  keydownListener = null;
}
