import type { App } from "obsidian";
import type { CategoryGroup, SortMode } from "../types";
import type { UsageResolution } from "../usage/usageResolver";
import { collectHotkeys } from "../hotkeys/hotkeyCollector";
import { resolveUsage } from "../usage/usageResolver";
import { getUsageCounts } from "../usage/usageTracker";
import { resolveConflicts } from "../hotkeys/conflictDetector";

export interface PendingOverwrite {
  path: string;
  expiresAt: number;
}

const EMPTY_USAGE_RESOLUTION: UsageResolution = {
  groups: [],
  orphans: [],
  maxEntryCount: 0,
  maxCategoryAggregate: 0,
};

/**
 * Centralizes the cheatsheet modal's non-DOM state: loaded hotkey/usage data,
 * search/filter/sort selections, section collapse state, and the
 * export-overwrite confirmation window. Also owns the invariants around that
 * state that are easy to get wrong when scattered across event handlers —
 * restoring collapse state at the search boundary, and collapse/expand-all.
 */
export class CheatsheetState {
  groups: CategoryGroup[] = [];
  usageResolution: UsageResolution = EMPTY_USAGE_RESOLUTION;
  conflictingIds: Set<string> = new Set();
  searchQuery = "";
  activeModifiers: Set<string> = new Set();
  conflictsOnly = false;
  modifiedOnly = false;
  sortMode: SortMode = "category";
  collapsedSections = new Set<string>();
  currentGroupLabels: string[] = [];
  pendingOverwrite: PendingOverwrite | null = null;

  // Snapshot of collapsedSections taken when search becomes active,
  // restored when search is cleared.
  private searchSnapshot: Set<string> | null = null;

  get isSearching(): boolean {
    return this.searchQuery !== "";
  }

  /** Loads fresh hotkey/usage data and resets per-open state. Call from onOpen. */
  load(app: App): void {
    this.collapsedSections = new Set();
    this.searchSnapshot = null;
    this.pendingOverwrite = null;
    this.sortMode = "category";
    this.groups = collectHotkeys(app);
    this.usageResolution = resolveUsage(this.groups, getUsageCounts());
    this.conflictingIds = resolveConflicts(this.groups);
    this.currentGroupLabels = this.groups.map((g) => g.category);
  }

  /** Updates the search query, snapshotting/restoring collapse state at the search boundary. */
  setSearchQuery(query: string): void {
    const prev = this.searchQuery;
    this.searchQuery = query;
    if (prev === "" && query !== "") {
      this.searchSnapshot = new Set(this.collapsedSections);
    } else if (query === "" && prev !== "") {
      this.restoreSnapshot();
    }
  }

  clearSearch(): void {
    this.setSearchQuery("");
  }

  private restoreSnapshot(): void {
    if (this.searchSnapshot !== null) {
      this.collapsedSections = this.searchSnapshot;
      this.searchSnapshot = null;
    }
  }

  setModifierActive(mod: string, active: boolean): void {
    if (active) {
      this.activeModifiers.add(mod);
    } else {
      this.activeModifiers.delete(mod);
    }
  }

  setConflictsOnly(active: boolean): void {
    this.conflictsOnly = active;
  }

  setModifiedOnly(active: boolean): void {
    this.modifiedOnly = active;
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    this.collapsedSections.clear();
  }

  setCurrentGroupLabels(labels: string[]): void {
    this.currentGroupLabels = labels;
  }

  isSectionCollapsed(category: string): boolean {
    return this.collapsedSections.has(category);
  }

  toggleSection(category: string): void {
    if (this.collapsedSections.has(category)) {
      this.collapsedSections.delete(category);
    } else {
      this.collapsedSections.add(category);
    }
  }

  /** Whether every currently-rendered group is collapsed — drives the expand-all icon. */
  areAllSectionsCollapsed(): boolean {
    return (
      this.currentGroupLabels.length > 0 &&
      this.currentGroupLabels.every((label) => this.collapsedSections.has(label))
    );
  }

  toggleCollapseAll(): void {
    const allCollapsed = this.currentGroupLabels.every((label) =>
      this.collapsedSections.has(label)
    );
    if (allCollapsed) {
      this.collapsedSections.clear();
    } else {
      for (const label of this.currentGroupLabels) {
        this.collapsedSections.add(label);
      }
    }
  }

  /** True if `path` currently has a live overwrite confirmation window open. */
  isOverwriteConfirmed(path: string): boolean {
    return (
      this.pendingOverwrite !== null &&
      this.pendingOverwrite.path === path &&
      Date.now() < this.pendingOverwrite.expiresAt
    );
  }

  requestOverwriteConfirm(path: string, windowMs: number): void {
    this.pendingOverwrite = { path, expiresAt: Date.now() + windowMs };
  }

  clearPendingOverwrite(): void {
    this.pendingOverwrite = null;
  }
}
