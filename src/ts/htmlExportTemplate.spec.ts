import { describe, it, expect, vi } from "vitest";

vi.mock("obsidian", () => ({
  Platform: { isMacOS: false },
}));

import { escapeMarkdownTableCell } from "./htmlExportTemplate";

describe("escapeMarkdownTableCell", () => {
  it("escapes a pipe character so it cannot be read as a column separator", () => {
    expect(escapeMarkdownTableCell("Toggle A | B")).toBe("Toggle A \\| B");
  });

  it("escapes multiple pipe characters", () => {
    expect(escapeMarkdownTableCell("A|B|C")).toBe("A\\|B\\|C");
  });

  it("leaves text without pipes unchanged", () => {
    expect(escapeMarkdownTableCell("Toggle Sidebar")).toBe("Toggle Sidebar");
  });
});
