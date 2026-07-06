import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("obsidian", () => {
  const Platform = { isMacOS: false };
  return {
    Platform,
    Keymap: {
      // Mirrors real Obsidian behaviour: "Mod" aliases the platform's native
      // primary modifier key (Meta/Cmd on macOS, Ctrl elsewhere), so the same
      // physical keypress reports true for BOTH "Mod" and its literal alias.
      isModifier: (evt: Record<string, boolean>, modifier: string) => {
        switch (modifier) {
          case "Mod":
            return Platform.isMacOS ? !!evt.metaKey : !!evt.ctrlKey;
          case "Ctrl":
            return !!evt.ctrlKey;
          case "Meta":
            return !!evt.metaKey;
          case "Shift":
            return !!evt.shiftKey;
          case "Alt":
            return !!evt.altKey;
          default:
            return false;
        }
      },
    },
    debounce: (cb: (...args: unknown[]) => unknown, timeout = 0, resetTimer = true) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const wrapped = ((...args: unknown[]) => {
        if (timer && resetTimer) {
          clearTimeout(timer);
          timer = null;
        }
        if (!timer) {
          timer = setTimeout(() => {
            timer = null;
            cb(...args);
          }, timeout);
        }
        return wrapped;
      }) as unknown as { (...a: unknown[]): unknown; cancel: () => void };
      wrapped.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
      };
      return wrapped;
    },
    normalizePath: (p: string) => p,
  };
});

import {
  buildSignature,
  parseSignature,
  canonicaliseKeydown,
  loadUsageData,
  getUsageCounts,
  increment,
  resetUsageData,
} from "./usageTracker";
import type { App, DataAdapter } from "obsidian";
import { Platform } from "obsidian";

const platform = Platform as unknown as { isMacOS: boolean };

function makeEvent(overrides: Partial<{
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}>): KeyboardEvent {
  return {
    key: "a",
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  } as unknown as KeyboardEvent;
}

interface MockAdapter {
  exists: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
}

function makeAdapter(overrides: Partial<MockAdapter> = {}): MockAdapter {
  return {
    exists: vi.fn().mockResolvedValue(false),
    read: vi.fn().mockResolvedValue(""),
    write: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeApp(adapter: MockAdapter): App {
  return { vault: { adapter: adapter as unknown as DataAdapter } } as unknown as App;
}

describe("buildSignature / parseSignature", () => {
  it("orders modifiers in the fixed order and uppercases the key", () => {
    expect(buildSignature(["Shift", "Mod"], "b")).toBe("Mod+Shift+B");
  });

  it("omits modifiers that are not present", () => {
    expect(buildSignature([], "escape")).toBe("ESCAPE");
  });

  it("round-trips through parseSignature", () => {
    const signature = buildSignature(["Alt", "Shift"], "k");
    expect(parseSignature(signature)).toEqual({ modifiers: ["Shift", "Alt"], key: "K" });
  });
});

describe("canonicaliseKeydown", () => {
  beforeEach(() => {
    platform.isMacOS = false;
  });

  it("captures a modifier combo", () => {
    const evt = makeEvent({ ctrlKey: true, shiftKey: true, key: "b" });
    expect(canonicaliseKeydown(evt)).toBe("Mod+Shift+B");
  });

  it("does not double-count Mod and its platform alias for the same physical key (Windows/Linux Ctrl)", () => {
    const evt = makeEvent({ ctrlKey: true, key: "p" });
    expect(canonicaliseKeydown(evt)).toBe("Mod+P");
  });

  it("does not double-count Mod and its platform alias for the same physical key (macOS Cmd)", () => {
    platform.isMacOS = true;
    const evt = makeEvent({ metaKey: true, key: "p" });
    expect(canonicaliseKeydown(evt)).toBe("Mod+P");
  });

  it("still captures a literal Ctrl combo distinct from Mod on macOS", () => {
    platform.isMacOS = true;
    const evt = makeEvent({ ctrlKey: true, key: "tab" });
    expect(canonicaliseKeydown(evt)).toBe("Ctrl+TAB");
  });

  it("does not capture plain typing", () => {
    const evt = makeEvent({ key: "b" });
    expect(canonicaliseKeydown(evt)).toBeNull();
  });

  it("does not capture a bare Escape (indistinguishable from normal UI dismissal, not a shortcut candidate)", () => {
    const evt = makeEvent({ key: "Escape" });
    expect(canonicaliseKeydown(evt)).toBeNull();
  });

  it("does not capture a bare Enter/arrow/function key — a modifier is always required", () => {
    expect(canonicaliseKeydown(makeEvent({ key: "Enter" }))).toBeNull();
    expect(canonicaliseKeydown(makeEvent({ key: "ArrowDown" }))).toBeNull();
    expect(canonicaliseKeydown(makeEvent({ key: "F5" }))).toBeNull();
  });

  it("ignores a bare modifier press", () => {
    const evt = makeEvent({ key: "Shift", shiftKey: true });
    expect(canonicaliseKeydown(evt)).toBeNull();
  });

  it("ignores repeat events", () => {
    const evt = makeEvent({ ctrlKey: true, key: "b", repeat: true });
    expect(canonicaliseKeydown(evt)).toBeNull();
  });

  it("produces a consistent signature for repeated identical presses", () => {
    const evt = makeEvent({ ctrlKey: true, key: "b" });
    expect(canonicaliseKeydown(evt)).toBe(canonicaliseKeydown(evt));
  });
});

describe("loadUsageData", () => {
  it("resolves to empty counters when the file is missing", async () => {
    const adapter = makeAdapter({ exists: vi.fn().mockResolvedValue(false) });
    await loadUsageData(makeApp(adapter), "plugins/hotkeys-cheatsheet");
    expect(getUsageCounts()).toEqual({});
  });

  it("loads existing counts from the file", async () => {
    const stored = JSON.stringify({ version: 1, counts: { "Mod+B": 3 } });
    const adapter = makeAdapter({
      exists: vi.fn().mockResolvedValue(true),
      read: vi.fn().mockResolvedValue(stored),
    });
    await loadUsageData(makeApp(adapter), "plugins/hotkeys-cheatsheet");
    expect(getUsageCounts()).toEqual({ "Mod+B": 3 });
  });
});

describe("increment + debounced flush", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not write to disk immediately on increment", async () => {
    const adapter = makeAdapter();
    await loadUsageData(makeApp(adapter), "plugins/hotkeys-cheatsheet");

    increment("Mod+B");
    expect(adapter.write).not.toHaveBeenCalled();
  });

  it("flushes counts to disk once after the throttle interval", async () => {
    const adapter = makeAdapter();
    await loadUsageData(makeApp(adapter), "plugins/hotkeys-cheatsheet");

    increment("Mod+B");
    increment("Mod+B");
    await vi.advanceTimersByTimeAsync(5000);

    expect(adapter.write).toHaveBeenCalledTimes(1);
    const [, payload] = adapter.write.mock.calls[0];
    expect(JSON.parse(payload)).toEqual({ version: 1, counts: { "Mod+B": 2 } });
  });
});

describe("resetUsageData", () => {
  it("clears counters and writes the empty state immediately", async () => {
    const adapter = makeAdapter();
    await loadUsageData(makeApp(adapter), "plugins/hotkeys-cheatsheet");
    increment("Mod+B");

    await resetUsageData();

    expect(getUsageCounts()).toEqual({});
    expect(adapter.write).toHaveBeenCalledTimes(1);
    const [, payload] = adapter.write.mock.calls[0];
    expect(JSON.parse(payload)).toEqual({ version: 1, counts: {} });
  });
});
