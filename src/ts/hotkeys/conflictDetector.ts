import type { CategoryGroup } from "../types";
import { buildSignature } from "../usage/usageTracker";

/**
 * Pure, whole-dataset pass over the already-merged `CategoryGroup[]`: finds
 * every canonical modifier+key signature bound to more than one distinct
 * command, and returns the ids of every entry that owns at least one such
 * binding. Entry-level, not per-binding — an entry with one conflicting and
 * one non-conflicting binding is flagged as a whole. Never cached; recompute
 * on every call, same as `resolveUsage`.
 */
export function resolveConflicts(groups: CategoryGroup[]): Set<string> {
  const idsBySignature = new Map<string, Set<string>>();

  for (const group of groups) {
    for (const entry of group.entries) {
      for (const hk of entry.hotkeys) {
        const signature = buildSignature(hk.modifiers, hk.key);
        const ids = idsBySignature.get(signature);
        if (ids) {
          ids.add(entry.id);
        } else {
          idsBySignature.set(signature, new Set([entry.id]));
        }
      }
    }
  }

  const conflictingIds = new Set<string>();
  for (const ids of idsBySignature.values()) {
    if (ids.size > 1) {
      for (const id of ids) conflictingIds.add(id);
    }
  }
  return conflictingIds;
}
