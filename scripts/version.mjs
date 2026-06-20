import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..");

const PKG_PATH = resolve(ROOT, "package.json");
const MANIFEST_PATH = resolve(ROOT, "manifest.json");

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function bump(version, type) {
  let [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") { major++; minor = 0; patch = 0; }
  else if (type === "minor") { minor++; patch = 0; }
  else if (type === "patch") { patch++; }
  else throw new Error(`Unknown release type "${type}". Use major, minor, or patch.`);
  return `${major}.${minor}.${patch}`;
}

export function currentVersion() {
  return JSON.parse(readFileSync(PKG_PATH, "utf-8")).version;
}

export function bumpVersion(type, { commit = false } = {}) {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));

  const next = bump(pkg.version, type);
  pkg.version = next;
  manifest.version = next;

  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  if (commit) {
    run(`git add package.json manifest.json`);
    run(`git commit -m "chore: bump version to ${next}"`);
  }

  return next;
}

// Run as standalone script: node scripts/version.mjs <major|minor|patch> [--commit]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const type = args.find((a) => !a.startsWith("--"));
  const commit = args.includes("--commit");
  if (!type) {
    console.error("Usage: node scripts/version.mjs <major|minor|patch> [--commit]");
    process.exit(1);
  }
  const next = bumpVersion(type, { commit });
  console.log(`Bumped to ${next}${commit ? " (committed)" : ""}`);
}
