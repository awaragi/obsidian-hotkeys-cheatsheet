import { App, Modal, Platform } from "obsidian";
import { collectHotkeys, CategoryGroup } from "./hotkeyCollector";
import { t } from "./i18n";

// ── Modifier display labels ───────────────────────────────────────────────

/** Human-readable modifier badge labels on macOS. */
const MOD_LABEL_MAC: Record<string, string> = {
  Mod: "Cmd",
  Meta: "Cmd",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Option",
};

/** Human-readable modifier badge labels on Windows / Linux. */
const MOD_LABEL_WIN: Record<string, string> = {
  Mod: "Ctrl",
  Meta: "Win",
  Ctrl: "Ctrl",
  Shift: "Shift",
  Alt: "Alt",
};

function modLabel(token: string): string {
  return Platform.isMacOS
    ? (MOD_LABEL_MAC[token] ?? token)
    : (MOD_LABEL_WIN[token] ?? token);
}

/**
 * Filter dropdown label for a modifier token.
 * On macOS we show OS names (Cmd, Option…). On Windows we keep the abstract
 * token name to avoid showing "Ctrl" twice (Mod and Ctrl both map to Ctrl).
 */
function filterLabel(token: string): string {
  if (!Platform.isMacOS) return token;
  const map: Record<string, string> = {
    Mod: "Cmd",
    Shift: "Shift",
    Alt: "Option",
    Ctrl: "Ctrl",
  };
  return map[token] ?? token;
}

// ── Special key icons ─────────────────────────────────────────────────────

const KEY_ICONS: Record<string, string> = {
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
function keyIcon(key: string): string {
  return KEY_ICONS[key] ?? key;
}

// ── Modal ─────────────────────────────────────────────────────────────────

export class CheatsheetModal extends Modal {
  private groups: CategoryGroup[] = [];
  private searchQuery = "";
  private activeModifiers: Set<string> = new Set();

  private searchInput!: HTMLInputElement;
  private filterDropdown!: HTMLElement;
  private filterOpen = false;
  private gridEl!: HTMLElement;

  private readonly handleOutsideClick = (e: MouseEvent) => {
    if (this.filterOpen && !this.filterDropdown.contains(e.target as Node)) {
      this.filterOpen = false;
      this.filterDropdown.addClass("hkc-hidden");
    }
  };

  constructor(app: App) {
    super(app);
  }

  /**
   * Override close() so Escape clears an active search before closing.
   * The built-in Obsidian Escape handler calls modal.close().
   */
  close() {
    if (this.searchQuery) {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.renderGrid();
    } else {
      super.close();
    }
  }

  onOpen() {
    // Make the modal fill most of the window
    this.modalEl.addClass("hkc-full-modal");

    // Use Obsidian's native title bar instead of a custom header row
    this.titleEl.setText(t("modal.title"));

    this.groups = collectHotkeys(this.app);
    this.buildUI();
    document.addEventListener("click", this.handleOutsideClick);
  }

  onClose() {
    document.removeEventListener("click", this.handleOutsideClick);
    this.contentEl.empty();
  }

  // ── UI Construction ───────────────────────────────────────────────────────

  private buildUI() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("hkc-content");

    this.buildToolbar(contentEl);

    this.gridEl = contentEl.createDiv({ cls: "hkc-grid" });
    this.renderGrid();

    setTimeout(() => this.searchInput?.focus(), 30);
  }

  private buildToolbar(parent: HTMLElement) {
    const toolbar = parent.createDiv({ cls: "hkc-toolbar" });

    // Search input
    this.searchInput = toolbar.createEl("input", {
      type: "text",
      placeholder: t("modal.search_placeholder"),
      cls: "hkc-search",
    });
    this.searchInput.addEventListener("input", () => {
      this.searchQuery = this.searchInput.value;
      this.renderGrid();
    });

    // Modifier filter
    const filterWrapper = toolbar.createDiv({ cls: "hkc-filter-wrapper" });
    const filterBtn = filterWrapper.createEl("button", {
      text: t("modal.filter_label"),
      cls: "hkc-filter-btn",
    });
    this.filterDropdown = filterWrapper.createDiv({
      cls: "hkc-filter-dropdown hkc-hidden",
    });

    const modTokens = ["Mod", "Shift", "Alt", "Ctrl"] as const;
    for (const mod of modTokens) {
      const label = this.filterDropdown.createEl("label", {
        cls: "hkc-filter-item",
      });
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.dataset.mod = mod;
      label.appendText(" " + filterLabel(mod));
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          this.activeModifiers.add(mod);
        } else {
          this.activeModifiers.delete(mod);
        }
        this.renderGrid();
      });
    }

    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.filterOpen = !this.filterOpen;
      this.filterDropdown.toggleClass("hkc-hidden", !this.filterOpen);
    });

    this.filterDropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  // ── Grid Rendering ────────────────────────────────────────────────────────

  private renderGrid() {
    const el = this.gridEl;
    el.empty();

    const query = this.searchQuery.toLowerCase();
    const hasModFilter = this.activeModifiers.size > 0;
    let totalVisible = 0;

    for (const group of this.groups) {
      const visibleEntries = group.entries.filter((entry) => {
        if (hasModFilter) {
          const matches = entry.hotkeys.some((hk) =>
            [...this.activeModifiers].every((m) => hk.modifiers.includes(m))
          );
          if (!matches) return false;
        }

        if (query) {
          const nameMatch = entry.name.toLowerCase().includes(query);
          const keyMatch = entry.hotkeys.some(
            (hk) => hk.key.toLowerCase() === query
          );
          if (!nameMatch && !keyMatch) return false;
        }

        return true;
      });

      if (visibleEntries.length === 0) continue;
      totalVisible += visibleEntries.length;

      this.renderCategorySection(el, group.category, visibleEntries, query);
    }

    if (totalVisible === 0) {
      el.createDiv({ text: t("modal.no_results"), cls: "hkc-no-results" });
    }
  }

  private renderCategorySection(
    parent: HTMLElement,
    category: string,
    entries: CategoryGroup["entries"],
    query: string
  ) {
    const section = parent.createDiv({ cls: "hkc-section" });
    section.createEl("h3", { text: category, cls: "hkc-category-heading" });

    for (const entry of entries) {
      const entryEl = section.createDiv({ cls: "hkc-entry" });

      // Command name with optional search highlight
      const nameEl = entryEl.createDiv({ cls: "hkc-entry-name" });
      if (query && entry.name.toLowerCase().includes(query)) {
        this.renderHighlighted(nameEl, entry.name, query);
      } else {
        nameEl.textContent = entry.name;
      }

      // Hotkey badge rows
      const hotkeysEl = entryEl.createDiv({ cls: "hkc-entry-hotkeys" });
      for (const hk of entry.hotkeys) {
        // Does this binding's key match the search query?
        const keyMatches =
          query.length > 0 && hk.key.toLowerCase() === query;

        const hkRow = hotkeysEl.createDiv({ cls: "hkc-hk-row" });
        for (const mod of hk.modifiers) {
          hkRow.createEl("kbd", { text: modLabel(mod), cls: "hkc-kbd" });
        }
        const keyEl = hkRow.createEl("kbd", {
          text: keyIcon(hk.key),
          cls: "hkc-kbd",
        });
        if (keyMatches) {
          keyEl.addClass("hkc-kbd-match");
        }
      }
    }
  }

  /**
   * Render `text` inside `container`, wrapping the first occurrence of `query`
   * in a `<mark>` for highlighting.
   */
  private renderHighlighted(
    container: HTMLElement,
    text: string,
    query: string
  ) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query);
    if (idx === -1) {
      container.textContent = text;
      return;
    }
    if (idx > 0) container.appendText(text.slice(0, idx));
    container.createEl("mark", {
      text: text.slice(idx, idx + query.length),
      cls: "hkc-highlight",
    });
    if (idx + query.length < text.length) {
      container.appendText(text.slice(idx + query.length));
    }
  }
}
