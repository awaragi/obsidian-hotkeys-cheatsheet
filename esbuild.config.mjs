import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { copyFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.argv[2] === "production";
const DIST_DIR = resolve(__dirname, "dist");

mkdirSync(DIST_DIR, { recursive: true });

await esbuild.build({
  entryPoints: ["src/ts/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: resolve(DIST_DIR, "main.js"),
}).catch(() => process.exit(1));

copyFileSync(resolve(__dirname, "manifest.json"), resolve(DIST_DIR, "manifest.json"));
copyFileSync(resolve(__dirname, "src/css/styles.css"), resolve(DIST_DIR, "styles.css"));
