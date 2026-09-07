import { createMcpHonoApp } from "@modelcontextprotocol/hono";
import {
  McpServer,
  WebStandardStreamableHTTPServerTransport
} from "@modelcontextprotocol/server";
import * as z from "zod/v4";

// Netlify injects these per deploy context; the fallback only serves local runs.
const localUrl = "http://localhost:8888";
const productionUrl = process.env.URL;
const deployUrl = process.env.DEPLOY_PRIME_URL ?? process.env.DEPLOY_URL;
const selfUrl =
  (process.env.CONTEXT === "production" ? productionUrl : deployUrl) ??
  productionUrl ??
  localUrl;

function allowedHostnames() {
  const hostnames = new Set(["localhost", "127.0.0.1"]);

  for (const value of [productionUrl, deployUrl, selfUrl]) {
    if (!value) continue;
    const { hostname } = new URL(value);
    hostnames.add(hostname);
    // Netlify redirects the apex to www; accept both in case that changes.
    hostnames.add(hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`);
  }

  return [...hostnames];
}

interface Profile {
  name: string;
  description: string;
  url: string;
  languages: string[];
  areaServed?: string[];
  services: { name: string; url: string }[];
  contact: string;
}

interface Sections {
  languages: string[];
  sections: Record<string, Record<string, string>>;
}

interface SiteData {
  profile: Profile;
  sections: Sections;
}

let siteData: Promise<SiteData> | undefined;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, selfUrl), {
    headers: { accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function loadSiteData(): Promise<SiteData> {
  siteData ??= Promise.all([
    fetchJson<Profile>("/api/site-profile.json"),
    fetchJson<Sections>("/api/sections.json")
  ])
    .then(([profile, sections]) => ({ profile, sections }))
    .catch((error: unknown) => {
      siteData = undefined;
      throw error;
    });

  return siteData;
}

function createServer(data: SiteData) {
  const server = new McpServer({
    name: "stanislav-valasek-site",
    version: "1.0.0"
  });

  const sectionKeys = Object.keys(data.sections.sections) as [string, ...string[]];
  const languages = data.sections.languages as [string, ...string[]];

  server.registerTool(
    "get_site_profile",
    {
      title: "Get site profile",
      description: `Return public details about ${data.profile.name}'s coaching, mentoring, and training services.`,
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true }
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(data.profile) }],
      structuredContent: data.profile
    })
  );

  server.registerTool(
    "get_section_url",
    {
      title: "Get section URL",
      description: "Return the canonical URL for a public site section in the requested language.",
      inputSchema: z.object({
        section: z.enum(sectionKeys),
        language: z.enum(languages).default(languages[0])
      }),
      annotations: { readOnlyHint: true }
    },
    async ({ section, language }) => {
      const url = data.sections.sections[section][language];

      return {
        content: [{ type: "text", text: url }],
        structuredContent: { section, language, url }
      };
    }
  );

  return server;
}

const app = createMcpHonoApp({
  host: "0.0.0.0",
  allowedHosts: allowedHostnames(),
  allowedOrigins: allowedHostnames()
});

app.all("/mcp", async (context) => {
  const data = await loadSiteData();
  const server = createServer(data);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  await server.connect(transport);
  return transport.handleRequest(context.req.raw);
});

export default (request: Request) => app.fetch(request);

export const config = { path: "/mcp" };