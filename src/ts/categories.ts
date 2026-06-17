/** Curated map: Obsidian core command prefix → workflow category name. */
export const CORE_PREFIX_MAP: Record<string, string> = {
  editor: "Editing",
  markdown: "Editing",
  properties: "Editing",
  backlink: "Navigation",
  bookmarks: "Navigation",
  "command-palette": "Navigation",
  graph: "Navigation",
  navigate: "Navigation",
  outline: "Navigation",
  starred: "Navigation",
  switcher: "Navigation",
  "tag-pane": "Navigation",
  "global-search": "Search",
  search: "Search",
  "file-explorer": "Files & Vault",
  "file-recovery": "Files & Vault",
  file: "Files & Vault",
  app: "Workspace",
  canvas: "Workspace",
  theme: "Workspace",
  window: "Workspace",
  workspace: "Workspace",
};

/** Core categories rendered in this order before plugin groups. */
export const CATEGORY_ORDER: string[] = [
  "Editing",
  "Navigation",
  "Search",
  "Files & Vault",
  "Workspace",
];
