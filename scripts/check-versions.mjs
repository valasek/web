#!/usr/bin/env node
// Fails when the toolchain versions pinned in several files drift apart.
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function match(path, pattern, label) {
  const found = read(path).match(pattern);
  if (!found) throw new Error(`Could not read ${label} from ${path}`);
  return found[1];
}

const pins = [
  {
    label: "Hugo",
    values: {
      ".devcontainer/devcontainer.json": match(
        ".devcontainer/devcontainer.json",
        /"ghcr\.io\/devcontainers\/features\/hugo:1"\s*:\s*\{[^}]*"version"\s*:\s*"([^"]+)"/s,
        "Hugo version"
      ),
      "netlify.toml": match("netlify.toml", /HUGO_VERSION\s*=\s*"([^"]+)"/, "HUGO_VERSION"),
      "hugoblox.yaml": match("hugoblox.yaml", /hugo_version:\s*'?"?([^'"\s]+)'?"?/, "hugo_version")
    }
  },
  {
    label: "Node",
    values: {
      ".devcontainer/devcontainer.json": match(
        ".devcontainer/devcontainer.json",
        /"ghcr\.io\/devcontainers\/features\/node:1"\s*:\s*\{[^}]*"version"\s*:\s*"([^"]+)"/s,
        "Node version"
      ),
      "netlify.toml": match("netlify.toml", /NODE_VERSION\s*=\s*"([^"]+)"/, "NODE_VERSION")
    }
  }
];

let failed = false;

for (const { label, values } of pins) {
  const unique = [...new Set(Object.values(values))];

  if (unique.length === 1) {
    console.log(`ok   ${label} ${unique[0]} (${Object.keys(values).length} files agree)`);
    continue;
  }

  failed = true;
  console.error(`FAIL ${label} pins disagree:`);
  for (const [file, value] of Object.entries(values)) console.error(`       ${value}\t${file}`);
}

if (failed) {
  console.error("\nUpdate the files above so each toolchain is pinned to one version.");
  process.exit(1);
}
