import type { CategoryGroup, HotkeyEntry } from "./types";
import { buildSignature, parseSignature } from "./usageTracker";

export interface ResolvedHotkeyEntry extends HotkeyEntry {
  count: number;
}

export interface ResolvedCategoryGroup {
  category: string;
  entries: ResolvedHotkeyEntry[];
  aggregate: number;
}

export interface OrphanSignature {
  signature: string;
  modifiers: string[];
  key: string;
  count: number;
}

export interface UsageResolution {
  groups: ResolvedCategoryGroup[];
  orphans: OrphanSignature[];
  maxEntryCount: number;
  maxCategoryAggregate: number;
}

/**
 * Joins hotkey entries against captured usage counts, always freshly — never
 * cached. Resolves each entry's count, each category's aggregate, and the
 * list of captured signatures with no currently-bound entry (orphans).
 */
export function resolveUsage(
  groups: CategoryGroup[],
  counts: Record<string, number>
): UsageResolution {
  const matchedSignatures = new Set<string>();
  let maxEntryCount = 0;
  let maxCategoryAggregate = 0;

  const resolvedGroups: ResolvedCategoryGroup[] = groups.map((group) => {
    let aggregate = 0;
    const entries: ResolvedHotkeyEntry[] = group.entries.map((entry) => {
      let count = 0;
      for (const hk of entry.hotkeys) {
        const signature = buildSignature(hk.modifiers, hk.key);
        if (signature in counts) {
          count += counts[signature];
          matchedSignatures.add(signature);
        }
      }
      aggregate += count;
      if (count > maxEntryCount) maxEntryCount = count;
      return { ...entry, count };
    });
    if (aggregate > maxCategoryAggregate) maxCategoryAggregate = aggregate;
    return { category: group.category, entries, aggregate };
  });

  const orphans: OrphanSignature[] = Object.entries(counts)
    .filter(([signature]) => !matchedSignatures.has(signature))
    .map(([signature, count]) => {
      const { modifiers, key } = parseSignature(signature);
      return { signature, modifiers, key, count };
    });

  return { groups: resolvedGroups, orphans, maxEntryCount, maxCategoryAggregate };
}
