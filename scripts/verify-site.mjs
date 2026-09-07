#!/usr/bin/env node
// Post-deploy checks against a live URL: pnpm run verify:site -- https://example.com
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const configured = readFileSync(new URL("../config/_default/hugo.yaml", import.meta.url), "utf8")
  .match(/^baseURL:\s*'?"?([^'"\s#]+)/m)?.[1];

const base = (process.argv[2] ?? process.env.SITE_URL ?? configured ?? "").replace(/\/$/, "");
if (!base) {
  console.error("No target URL. Pass one: pnpm run verify:site -- https://example.com");
  process.exit(1);
}

const failures = [];
const check = (condition, message) => {
  if (condition) console.log(`ok   ${message}`);
  else {
    failures.push(message);
    console.error(`FAIL ${message}`);
  }
};

async function get(path, init) {
  const response = await fetch(`${base}${path}`, init);
  return { response, body: await response.text() };
}

async function getJson(path) {
  const { response, body } = await get(path, { headers: { accept: "application/json" } });
  check(response.ok, `GET ${path} responds ${response.status}`);
  try {
    return JSON.parse(body);
  } catch {
    check(false, `GET ${path} returns valid JSON`);
    return undefined;
  }
}

console.log(`Verifying ${base}\n`);

const { response: home } = await get("/");
check(home.ok, `GET / responds ${home.status}`);
const link = home.headers.get("link") ?? "";
for (const rel of ['rel="api-catalog"', 'rel="service-desc"', 'rel="service-doc"', 'rel="describedby"']) {
  check(link.includes(rel), `root Link header advertises ${rel}`);
}

const { response: markdown, body: markdownBody } = await get("/about/", {
  headers: { accept: "text/markdown" }
});
check(
  (markdown.headers.get("content-type") ?? "").includes("text/markdown"),
  "Accept: text/markdown returns Markdown"
);
check(!markdownBody.trimStart().startsWith("<"), "negotiated Markdown is not raw HTML");

const profile = await getJson("/api/site-profile.json");
const sections = await getJson("/api/sections.json");
const status = await getJson("/api/status.json");
const openapi = await getJson("/openapi.json");
const aiCatalog = await getJson("/.well-known/ai-catalog.json");
const apiCatalog = await getJson("/.well-known/api-catalog");
const serverCard = await getJson("/.well-known/mcp/server-card.json");
const skillIndex = await getJson("/.well-known/agent-skills/index.json");

check(status?.status === "ok", "status endpoint reports ok");
check(Array.isArray(aiCatalog?.entries) && aiCatalog.entries.length > 0, "ai-catalog lists entries");
check(Array.isArray(apiCatalog?.linkset) && apiCatalog.linkset.length > 0, "api-catalog lists a linkset");
check(openapi?.servers?.[0]?.url === base, "openapi server URL matches this deployment");
check(profile?.url === `${base}/`, "site profile URL matches this deployment");
check(serverCard?.transport?.endpoint === `${base}/mcp`, "MCP server card matches this deployment");

const { response: skillResponse, body: skill } = await get(
  "/.well-known/agent-skills/site-navigation/SKILL.md"
);
check(skillResponse.ok, `GET skill responds ${skillResponse.status}`);
check(
  skillIndex?.skills?.[0]?.digest === `sha256:${createHash("sha256").update(skill).digest("hex")}`,
  "published skill matches its advertised digest"
);

for (const [key, urls] of Object.entries(sections?.sections ?? {})) {
  for (const [language, url] of Object.entries(urls)) {
    const response = await fetch(url, { method: "HEAD" });
    check(response.ok, `section ${key} (${language}) responds ${response.status}`);
  }
}

const { response: mcp, body: mcpBody } = await get("/mcp", {
  method: "POST",
  headers: {
    accept: "application/json, text/event-stream",
    "content-type": "application/json"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "verify-site", version: "1.0.0" }
    }
  })
});
check(mcp.ok, `POST /mcp responds ${mcp.status}`);
let mcpResult;
try {
  mcpResult = JSON.parse(mcpBody);
} catch {
  check(false, "POST /mcp returns valid JSON");
}
check(
  mcpResult?.result?.serverInfo?.name === serverCard?.serverInfo?.name,
  "MCP server identifies itself as advertised in the server card"
);

const { body: robots } = await get("/robots.txt");
check(robots.includes("Content-Signal:"), "robots.txt publishes Content Signals");
check(robots.includes("Agentmap:"), "robots.txt advertises the ARD agentmap");

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed for ${base}.`);
  process.exit(1);
}

console.log(`\nAll checks passed for ${base}`);
