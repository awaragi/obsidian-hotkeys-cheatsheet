/** Unicode "eighths block" characters, lowest to highest. */
const GLYPHS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export interface UsageGlyph {
  glyph: string;
  level: number;
}

/**
 * Maps a count to one of the 8 glyph levels, scaled against `max` using
 * sqrt compression so a single outlier doesn't flatten the rest of the scale.
 */
export function countToGlyph(count: number, max: number): UsageGlyph {
  if (max <= 0) {
    return { glyph: GLYPHS[0], level: 0 };
  }
  const ratio = Math.sqrt(count) / Math.sqrt(max);
  const level = Math.min(GLYPHS.length - 1, Math.max(0, Math.round(ratio * GLYPHS.length)));
  return { glyph: GLYPHS[level], level };
}
