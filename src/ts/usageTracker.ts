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
 * Pure filter + canonicalisation for a raw keydown event. Returns null for
 * modifier-only keys, repeat events, and events that aren't a good shortcut
 * candidate — a bare key (Escape, Enter, arrows, ...) is indistinguishable
 * from normal typing/navigation and would just be noise, so at least one of
 * Ctrl/Meta/Alt must be held. Otherwise returns the canonical signature.
 */
export function canonicaliseKeydown(evt: KeyboardEvent): string | null {
  if (evt.repeat) return null;
  if (MODIFIER_KEYS.has(evt.key)) return null;

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
  await appRef.vault.adapter.write(usageFilePath, JSON.stringify(data));
}

/** Reads the usage data file at startup, tolerating a missing file (→ empty counters). */
export async function loadUsageData(app: App, pluginDir: string): Promise<void> {
  appRef = app;
  usageFilePath = getUsageFilePath(pluginDir);
  flushDebounced = debounce(() => void writeUsageData(), FLUSH_INTERVAL_MS, false);

  counters = {};
  if (await appRef.vault.adapter.exists(usageFilePath)) {
    try {
      const parsed = JSON.parse(await appRef.vault.adapter.read(usageFilePath)) as UsageData;
      counters = { ...parsed.counts };
    } catch {
      counters = {};
    }
  }
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
