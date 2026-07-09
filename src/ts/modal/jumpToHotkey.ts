import type { App } from "obsidian";

const HOTKEYS_TAB_ID = "hotkeys";
const HOTKEYS_SEARCH_INPUT_SELECTOR = ".vertical-tab-content-container input[type='search']";
/** Settings modal construction spans multiple nested Component.onload() calls; a fixed delay is simpler and just as reliable as polling for this fail-soft, low-stakes convenience. */
const SETTINGS_MOUNT_DELAY_MS = 50;

interface AppWithSetting extends App {
  setting?: {
    open: () => void;
    openTabById: (id: string) => unknown;
  };
}

interface JumpToHotkeyDeps {
  doc: Document;
  /** Runs `fn` once the Settings modal is expected to have finished mounting. */
  scheduleAfterMount: (fn: () => void) => void;
}

const defaultDeps: JumpToHotkeyDeps = {
  get doc() {
    return activeDocument;
  },
  scheduleAfterMount: (fn) => window.setTimeout(fn, SETTINGS_MOUNT_DELAY_MS),
};

/**
 * Opens Obsidian's native Settings → Hotkeys tab and attempts to filter it
 * down to `commandName` by simulating input into its search box.
 *
 * `app.setting`, `openTabById`, and the Hotkeys tab's search input are all
 * undocumented Obsidian internals with no public typing (see this change's
 * design.md for the tradeoffs). Every step fails soft and independently: if
 * a given internal isn't present or shaped as expected, execution stops at
 * that step — this never throws, and worst case the user lands on a plain,
 * unfiltered Hotkeys tab.
 */
export function jumpToHotkey(app: App, commandName: string, deps: JumpToHotkeyDeps = defaultDeps): void {
  const setting = (app as AppWithSetting).setting;
  if (!setting) return;

  setting.open();
  setting.openTabById(HOTKEYS_TAB_ID);

  deps.scheduleAfterMount(() => {
    const input = deps.doc.querySelector<HTMLInputElement>(HOTKEYS_SEARCH_INPUT_SELECTOR);
    if (!input) return;

    input.value = commandName;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
