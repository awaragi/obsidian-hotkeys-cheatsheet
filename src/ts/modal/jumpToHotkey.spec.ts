import { describe, it, expect, vi } from "vitest";
import type { App } from "obsidian";

vi.mock("obsidian", () => ({}));

import { jumpToHotkey } from "./jumpToHotkey";

function makeDeps(input: HTMLInputElement | null) {
  return {
    doc: { querySelector: vi.fn().mockReturnValue(input) } as unknown as Document,
    scheduleAfterMount: (fn: () => void) => fn(),
  };
}

function makeApp(setting?: { open: ReturnType<typeof vi.fn>; openTabById: ReturnType<typeof vi.fn> }) {
  return { setting } as unknown as App;
}

describe("jumpToHotkey", () => {
  it("does nothing when app.setting is unavailable", () => {
    const deps = makeDeps(null);
    expect(() => jumpToHotkey(makeApp(undefined), "Toggle bold", deps)).not.toThrow();
    expect(deps.doc.querySelector).not.toHaveBeenCalled();
  });

  it("opens Settings to the Hotkeys tab and fills the search input when found", () => {
    const open = vi.fn();
    const openTabById = vi.fn();
    const input = {
      value: "",
      dispatchEvent: vi.fn(),
    } as unknown as HTMLInputElement;
    const deps = makeDeps(input);

    jumpToHotkey(makeApp({ open, openTabById }), "Toggle bold", deps);

    expect(open).toHaveBeenCalledTimes(1);
    expect(openTabById).toHaveBeenCalledWith("hotkeys");
    expect(input.value).toBe("Toggle bold");
    expect(input.dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatchedEvent = (input.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls[0][0] as Event;
    expect(dispatchedEvent.type).toBe("input");
    expect(dispatchedEvent.bubbles).toBe(true);
  });

  it("leaves the tab open, unfiltered, when the search input cannot be found", () => {
    const open = vi.fn();
    const openTabById = vi.fn();
    const deps = makeDeps(null);

    expect(() => jumpToHotkey(makeApp({ open, openTabById }), "Toggle bold", deps)).not.toThrow();
    expect(open).toHaveBeenCalledTimes(1);
    expect(openTabById).toHaveBeenCalledWith("hotkeys");
  });
});
