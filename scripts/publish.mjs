import { execSync } from "child_process";
import { currentVersion, bumpVersion, ROOT } from "./version.mjs";

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

const tag = `v${currentVersion()}`;

console.log(`Tagging ${tag}`);
run(`git tag ${tag}`);

const next = bumpVersion("patch");
console.log(`Bumped to ${next}`);

run(`git push`);
run(`git push origin ${tag}`);

console.log(`Released ${tag} — next version is ${next}`);
