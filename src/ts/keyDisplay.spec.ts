import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("obsidian", () => ({
  Platform: {
    isMacOS: false,
  },
}));

import { modLabel, filterLabel, keyIcon } from "./keyDisplay";
import { Platform } from "obsidian";

const platform = Platform as { isMacOS: boolean };

describe("modLabel", () => {
  beforeEach(() => {
    platform.isMacOS = false;
  });

  it("returns Cmd for Mod on macOS", () => {
    platform.isMacOS = true;
    expect(modLabel("Mod")).toBe("Cmd");
  });

  it("returns Ctrl for Mod on Windows", () => {
    expect(modLabel("Mod")).toBe("Ctrl");
  });

  it("returns Option for Alt on macOS", () => {
    platform.isMacOS = true;
    expect(modLabel("Alt")).toBe("Option");
  });

  it("returns Alt for Alt on Windows", () => {
    expect(modLabel("Alt")).toBe("Alt");
  });

  it("passes through unknown token", () => {
    expect(modLabel("Custom")).toBe("Custom");
  });
});

describe("filterLabel", () => {
  beforeEach(() => {
    platform.isMacOS = false;
  });

  it("returns token unchanged on Windows", () => {
    expect(filterLabel("Mod")).toBe("Mod");
    expect(filterLabel("Shift")).toBe("Shift");
    expect(filterLabel("Alt")).toBe("Alt");
  });

  it("returns Cmd for Mod on macOS", () => {
    platform.isMacOS = true;
    expect(filterLabel("Mod")).toBe("Cmd");
  });

  it("returns Option for Alt on macOS", () => {
    platform.isMacOS = true;
    expect(filterLabel("Alt")).toBe("Option");
  });

  it("passes through Meta on macOS (not a filter token)", () => {
    platform.isMacOS = true;
    expect(filterLabel("Meta")).toBe("Meta");
  });
});

describe("keyIcon", () => {
  it("returns a symbol for a known special key", () => {
    expect(keyIcon("ARROWUP")).toBe("↑");
  });

  it("returns a short label for ESCAPE", () => {
    expect(keyIcon("ESCAPE")).toBe("Esc");
  });

  it("passes through an unknown key unchanged", () => {
    expect(keyIcon("F5")).toBe("F5");
  });
});
