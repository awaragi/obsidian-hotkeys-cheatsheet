import { describe, it, expect, vi } from "vitest";

vi.mock("obsidian", () => ({
  Platform: { isMacOS: false },
}));

import { escapeMarkdownTableCell, fillTemplate } from "./htmlExportTemplate";

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

describe("fillTemplate", () => {
  it("sets lang and dir on the <html> element", () => {
    const html = fillTemplate("Title", "2026-07-09", "<div></div>", "ar", "rtl");
    expect(html).toContain('<html lang="ar" dir="rtl">');
  });

  it("defaults to ltr direction for an LTR locale", () => {
    const html = fillTemplate("Title", "2026-07-09", "<div></div>", "en", "ltr");
    expect(html).toContain('<html lang="en" dir="ltr">');
  });

  it("interpolates title, date, and content", () => {
    const html = fillTemplate("My Title", "2026-07-09", "<div>content</div>", "en", "ltr");
    expect(html).toContain("<title>My Title — 2026-07-09</title>");
    expect(html).toContain("<h1>My Title</h1>");
    expect(html).toContain("<div>content</div>");
  });
});
