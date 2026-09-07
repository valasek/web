#!/usr/bin/env node
// Validates the generated agent discovery artifacts in public/ without network access.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const publicDir = new URL("../public/", import.meta.url);
const read = (path) => readFileSync(new URL(path, publicDir), "utf8");
const readJson = (path) => JSON.parse(read(path));

const failures = [];
const check = (condition, message) => {
  if (condition) console.log(`ok   ${message}`);
  else {
    failures.push(message);
    console.error(`FAIL ${message}`);
  }
};

const required = [
  "api/site-profile.json",
  "api/sections.json",
  "api/status.json",
  "api/README.md",
  "openapi.json",
  "auth.md",
  ".well-known/api-catalog",
  ".well-known/ai-catalog.json",
  ".well-known/mcp/server-card.json",
  ".well-known/agent-skills/index.json",
  ".well-known/agent-skills/site-navigation/SKILL.md",
  "_headers",
  "robots.txt",
  "llms.txt"
];

for (const path of required) {
  check(existsSync(new URL(path, publicDir)), `published ${path}`);
}

if (failures.length > 0) {
  console.error("\nRun `pnpm run build` before verifying.");
  process.exit(1);
}

const profile = readJson("api/site-profile.json");
const sections = readJson("api/sections.json");
const status = readJson("api/status.json");
const openapi = readJson("openapi.json");
const serverCard = readJson(".well-known/mcp/server-card.json");
const aiCatalog = readJson(".well-known/ai-catalog.json");
const apiCatalog = readJson(".well-known/api-catalog");
const skillIndex = readJson(".well-known/agent-skills/index.json");
const skill = read(".well-known/agent-skills/site-navigation/SKILL.md");

const root = profile.url;
check(/^https?:\/\/[^/]+\/$/.test(root), `site root is an absolute root URL (${root})`);

// Everything must describe this deploy, never a mix of environments.
const absoluteUrls = [
  ...JSON.stringify(sections).matchAll(/"(https?:\/\/[^"]+)"/g),
  ...JSON.stringify(aiCatalog).matchAll(/"(https?:\/\/[^"]+)"/g),
  ...JSON.stringify(apiCatalog).matchAll(/"(https?:\/\/[^"]+)"/g),
  ...JSON.stringify(skillIndex).matchAll(/"(https?:\/\/[^"]+)"/g),
  ...JSON.stringify(profile).matchAll(/"(https?:\/\/[^"]+)"/g)
]
  .map((entry) => entry[1])
  .filter((url) => !url.startsWith("https://schemas.agentskills.io/"));

const foreign = [...new Set(absoluteUrls.filter((url) => !url.startsWith(root)))];
check(foreign.length === 0, `all published URLs share the site root${foreign.length ? `: ${foreign.join(", ")}` : ""}`);

check(status.status === "ok", "status endpoint reports ok");
check(openapi.servers?.[0]?.url === root.replace(/\/$/, ""), "openapi server URL matches the site root");
check(openapi.info?.version === status.version, "openapi and status report the same version");
check(serverCard.transport?.endpoint === `${root}mcp`, "MCP server card points at this deploy");

const digest = `sha256:${createHash("sha256").update(skill).digest("hex")}`;
check(skillIndex.skills?.[0]?.digest === digest, "agent skill digest matches the published skill");
check(skillIndex.skills?.[0]?.url === `${root}.well-known/agent-skills/site-navigation/SKILL.md`, "agent skill URL matches this deploy");

// A route agents are told to use must exist as a real built page.
const toFile = (url) => {
  const relative = decodeURI(url.slice(root.length));
  return relative === "" || relative.endsWith("/") ? `${relative}index.html` : relative;
};

for (const [key, urls] of Object.entries(sections.sections)) {
  for (const [language, url] of Object.entries(urls)) {
    check(existsSync(new URL(toFile(url), publicDir)), `section ${key} (${language}) resolves to a built page`);
  }
}

check(
  sections.languages.every((language) =>
    Object.values(sections.sections).every((urls) => typeof urls[language] === "string")
  ),
  "every section is published in every language"
);

const sectionUrls = new Set(Object.values(sections.sections).flatMap((urls) => Object.values(urls)));
for (const service of profile.services) {
  check(sectionUrls.has(service.url), `service ${service.name} points at a published section`);
}
check(sectionUrls.has(profile.contact), "profile contact points at a published section");

for (const entry of aiCatalog.entries) {
  const path = toFile(entry.url);
  check(existsSync(new URL(path, publicDir)), `ai-catalog entry ${entry.displayName} resolves to a published file`);
}

const catalogLinks = apiCatalog.linkset.flatMap((item) => [
  ...(item["service-desc"] ?? []),
  ...(item["service-doc"] ?? []),
  ...(item.status ?? [])
]);
for (const link of catalogLinks) {
  check(existsSync(new URL(toFile(link.href), publicDir)), `api-catalog link ${link.href} resolves to a published file`);
}

const headers = read("_headers");
for (const path of ["/.well-known/ai-catalog.json", "/.well-known/mcp/server-card.json", "/openapi.json", "/api/sections.json", "Vary: Accept"]) {
  check(headers.includes(path), `_headers declares ${path}`);
}

const robots = read("robots.txt");
check(robots.includes("Content-Signal:"), "robots.txt publishes Content Signals");
check(robots.includes(`Agentmap: ${root}.well-known/ai-catalog.json`), "robots.txt advertises the ARD agentmap");

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll build artifacts verified for ${root}`);
