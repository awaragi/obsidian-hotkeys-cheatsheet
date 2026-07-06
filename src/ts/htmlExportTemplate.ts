import type { CategoryGroup } from "./types";
import { modLabel, keyIcon } from "./keyDisplay";

export const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} — {{DATE}}</title>
  <style>
    /* ── Palette ─────────────────────────────────────────────────────────── */
    :root {
      --bg:         #ffffff;
      --bg-2:       #f4f4f5;
      --border:     #e4e4e7;
      --text:       #18181b;
      --text-muted: #71717a;
      --accent:     #7c3aed;
      --kbd-bg:     #e4e4e7;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg:         #1e1e2e;
        --bg-2:       #2a2a3c;
        --border:     #3f3f52;
        --text:       #cdd6f4;
        --text-muted: #9399b2;
        --accent:     #cba6f7;
        --kbd-bg:     #313244;
      }
    }

    /* ── Reset / Base ────────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 32px 48px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    /* ── Header ──────────────────────────────────────────────────────────── */
    .hkc-header {
      margin-bottom: 28px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--border);
    }
    .hkc-header h1 {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
    }
    .hkc-header p {
      margin: 0;
      font-size: 13px;
      color: var(--text-muted);
    }

    /* ── Grid ────────────────────────────────────────────────────────────── */
    .hkc-grid {
      columns: 300px;
      column-gap: 20px;
      column-fill: balance;
    }

    /* ── Section ─────────────────────────────────────────────────────────── */
    .hkc-section {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 20px;
      break-inside: avoid-column;
    }
    .hkc-category-heading {
      margin: 0 0 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border);
      break-after: avoid;
    }

    /* ── Entry ───────────────────────────────────────────────────────────── */
    .hkc-entry {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 0;
    }
    .hkc-entry-name {
      flex: 1;
      font-size: 13px;
      color: var(--text);
      line-height: 1.4;
      min-width: 0;
      word-break: break-word;
    }
    .hkc-entry-hotkeys {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      flex-shrink: 0;
    }
    .hkc-hk-row {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .hkc-hk-separator {
      font-size: 11px;
      color: var(--text-muted);
      padding: 0 3px;
    }

    /* ── Kbd ─────────────────────────────────────────────────────────────── */
    .hkc-kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--kbd-bg);
      border: 1px solid var(--border);
      border-bottom-width: 2px;
      border-radius: 4px;
      color: var(--text-muted);
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 11px;
      font-weight: 500;
      line-height: 1;
      min-width: 22px;
      padding: 2px 5px;
      white-space: nowrap;
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 600px) {
      body { padding: 16px; }
      .hkc-grid { columns: 1; }
    }
  </style>
</head>
<body>
  <header class="hkc-header">
    <h1>{{TITLE}}</h1>
    <p>{{DATE}}</p>
  </header>
  <div class="hkc-grid">
    {{CONTENT}}
  </div>
</body>
</html>`;

export function fillTemplate(title: string, date: string, content: string): string {
  return HTML_TEMPLATE
    .replaceAll("{{TITLE}}", title)
    .replaceAll("{{DATE}}", date)
    .replaceAll("{{CONTENT}}", content);
}

/** Escapes `|` so a command name can't be misread as a Markdown table column separator. */
export function escapeMarkdownTableCell(str: string): string {
  return str.replace(/\|/g, "\\|");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHtmlSections(groups: CategoryGroup[]): string {
  const parts: string[] = [];

  for (const group of groups) {
    const entries = group.entries.map((entry) => {
      const hotkeysHtml = entry.hotkeys
        .map((hk) => {
          const badges = [...hk.modifiers.map(modLabel), keyIcon(hk.key)]
            .map((p) => `<kbd class="hkc-kbd">${escapeHtml(p)}</kbd>`)
            .join("");
          return `<div class="hkc-hk-row">${badges}</div>`;
        })
        .join(`<div class="hkc-hk-row"><span class="hkc-hk-separator">/</span></div>`);

      return `
      <div class="hkc-entry">
        <span class="hkc-entry-name">${escapeHtml(entry.name)}</span>
        <div class="hkc-entry-hotkeys">${hotkeysHtml}</div>
      </div>`;
    });

    parts.push(`
    <div class="hkc-section">
      <h2 class="hkc-category-heading">${escapeHtml(group.category)}</h2>
      ${entries.join("")}
    </div>`);
  }

  return parts.join("\n");
}
