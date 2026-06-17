import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST_DIR = resolve(ROOT, "dist");

function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return {};
  return Object.fromEntries(
    readFileSync(envPath, "utf-8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
      .filter(([k]) => k)
  );
}

const pluginDir = loadEnv().OBSIDIAN_PLUGIN_DIR;

if (!pluginDir) {
  console.error("Error: OBSIDIAN_PLUGIN_DIR is not set in .env");
  process.exit(1);
}

mkdirSync(pluginDir, { recursive: true });

for (const file of ["main.js", "manifest.json", "styles.css"]) {
  copyFileSync(resolve(DIST_DIR, file), resolve(pluginDir, file));
}

console.log(`Deployed to ${pluginDir}`);
