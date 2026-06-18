import { execSync } from "child_process";
import { currentVersion, ROOT } from "./version.mjs";

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

const tag = currentVersion();

const existingTag = execSync("git tag --list " + tag, { cwd: ROOT }).toString().trim();
if (existingTag === tag) {
  console.error(`Error: tag '${tag}' already exists. Run 'npm run release:prepare patch|minor|major' first.`);
  process.exit(1);
}

console.log(`Tagging ${tag}`);
run(`git push`);
run(`git tag ${tag}`);
run(`git push origin ${tag}`);

console.log(`Released ${tag} — run 'npm run release:prepare patch' to start the next cycle`);
