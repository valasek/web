# Agent Discovery Operations

The deploy publishes discovery headers, Markdown negotiation, an API catalog, an ARD manifest, an Agent Skill, WebMCP tools, and public no-auth guidance.

This document is the operational reference for those features. The website is still a Hugo site: most content changes do not require changing this stack.

## Architecture and ownership

`agents` in `config/_default/params.yaml` is the single source of truth: profile, services, languages, navigable sections, and representative queries. `layouts/_partials/hooks/head-end/agent-artifacts.html` renders it once per build, using the baseURL of the current deploy context, and publishes:

- `/api/site-profile.json`, `/api/sections.json`, `/api/status.json`
- `/openapi.json` (schema body from `data/openapi.json`, URLs and version injected)
- `/.well-known/api-catalog`, `/.well-known/ai-catalog.json`
- `/.well-known/mcp/server-card.json`
- `/.well-known/agent-skills/site-navigation/SKILL.md` and its `index.json`, whose SHA-256 digest is computed from the published bytes

Because these follow the active baseURL, deploy previews describe themselves instead of advertising production. Changing the canonical domain is a `baseURL` edit in `config/_default/hugo.yaml`; no artifact contains a hardcoded host.

The rest of the stack:

- `layouts/index.headers` generates Netlify response headers, discovery links, media types, and CORS rules.
- `layouts/robots.txt` publishes Content Signals and the ARD `Agentmap` URL.
- `netlify/edge-functions/markdown.ts` converts successful HTML responses to Markdown when a client sends `Accept: text/markdown`.
- `layouts/_partials/hooks/head-end/webmcp.html` registers browser-local WebMCP tools, with the section and language lists templated from the same params.
- `netlify/functions/mcp.ts` serves `/mcp`. It takes its identity from Netlify's `URL`, `DEPLOY_PRIME_URL`, and `CONTEXT` variables, restricts hosts and origins to those, and loads its tool data from the generated `/api/site-profile.json` and `/api/sections.json`. There is no hardcoded domain or section list.
- `static/auth.md` and `static/api/README.md` stay hand-written; they are prose with no URLs that drift.

The partial deliberately uses `absURL` rather than page objects: reading `site.Home.Permalink` from a `head-end` hook deadlocks the build.

## Menu and content changes

The visible menu stays independent from agent navigation. Menus are presentation and may contain grouping links such as `/services` that have no page; agent routes are a contract. They are therefore not derived from each other, but the build verifies them.

When a public section is added, renamed, or removed:

1. Add, move, or remove its pages under both `content/sk/` and `content/en/`.
2. Update both language menus in `config/_default/languages.yaml`.
3. Update `agents.sections` in `config/_default/params.yaml`.
4. Run `pnpm run build && pnpm run verify:build`.

Everything else - MCP, WebMCP, the Agent Skill, its digest, the catalogs, and the API - regenerates from step 3. Changes to services, profile wording, or representative queries are also made in `agents`. Only the OpenAPI schema body lives elsewhere, in `data/openapi.json`.

Purely presentational menu changes, such as labels, hierarchy, or ordering, need no agent update.

## Build and deployment

The normal local and upgrade procedures are in the repository `README.md`.
For release parity, the important checks are:

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run verify:build
URL=https://www.stanislavvalasek.com \
  pnpm --package=netlify-cli dlx netlify build --offline
```

`verify:build` also runs inside every Netlify deploy context, so an artifact that is missing, inconsistent, or points at a page that does not exist fails the deploy rather than reaching production.

The Netlify build output must list both the `mcp.ts` Function and the `markdown` Edge Function. Deploy previews are now fully verifiable: the MCP function trusts the preview host through `DEPLOY_PRIME_URL`, so `pnpm run verify:site -- <preview-url>` exercises the same checks as production.

## Post-deploy verification

Run this after changing discovery code, dependencies, runtimes, domains, or Netlify configuration:

```bash
pnpm run verify:site                              # production, taken from baseURL
pnpm run verify:site -- https://<preview>.netlify.app
```

`scripts/verify-site.mjs` checks the root `Link` header, Markdown negotiation, every catalog and API document, the skill digest against the served skill, that every advertised section responds `200` in every language, an MCP `initialize` handshake matching the published server card, and the robots directives. It exits non-zero on the first set of failures and prints each one.

Add a check to that script rather than to this document when a new guarantee is introduced, so the guarantee is executable.

## Returning after a long inactivity

Use this order to avoid combining restoration, upgrades, and content changes:

1. Read the README and this document, then inspect recent Git and Netlify deploy history before changing dependencies.
2. Rebuild the Dev Container and run `pnpm install --frozen-lockfile`. Resolve toolchain availability before attempting upgrades.
3. Run `pnpm run check`, `pnpm run build`, and `pnpm run verify:build` on the pinned versions. A passing baseline distinguishes repository drift from upgrade regressions.
4. Run `pnpm run verify:site` against production, then check the Netlify domain settings and the DNS-AID response.
5. Upgrade Hugo, Node, pnpm, Hugo modules, and npm dependencies in separate, reviewable steps; test after each runtime or major-version change.
6. Deploy a small or no-content change first, then run `pnpm run verify:site` against the deploy preview and production.

Do not publish OAuth metadata merely to satisfy a scanner, do not replace signed DNS-AID records with the Netlify wildcard CNAME, and do not hand-edit generated files under `public/`. Artifacts under `/.well-known/`, `/api/` and `/openapi.json` are build output: edit `config/_default/params.yaml` instead.

## DNS-AID

DNS is managed by Websupport, outside this repository. As checked on 2026-09-07, `stanislavvalasek.com` has a valid DNSSEC chain, but `_index._agents.stanislavvalasek.com` falls through to the site's wildcard CNAME at `stanislavvalasek.netlify.app`. That unsigned alias makes validating resolvers return `AD=false` for the discovery answer.

In WebAdmin, add an explicit ServiceMode SVCB record in the signed `stanislavvalasek.com` zone:

```dns
_index._agents.stanislavvalasek.com. 3600 IN SVCB 1 www.stanislavvalasek.com. alpn="h2" port=443 key65400="/.well-known/ai-catalog.json"
_mcp._agents.stanislavvalasek.com.   3600 IN SVCB 1 www.stanislavvalasek.com. alpn="mcp,h2" port=443 key65400="/mcp"
```

`key65400` is from RFC 9460's Private Use range. The current DNS-AID Internet Draft has not assigned a numeric SvcParamKey for `well-known`, so this key must remain non-mandatory and may change as the draft advances. The standard `alpn` and `port` parameters provide the interoperable HTTPS connection data.

If Websupport's editor does not support SVCB/type 64 records, ask Websupport to add the record or delegate the `_agents` subzone to a DNS provider that supports SVCB and DNSSEC. Do not replace the record with a CNAME: the current CNAME into the unsigned `netlify.app` zone is the source of the validation failure.

After DNS propagation, validate through a DNSSEC-validating resolver:

```bash
curl -sS -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.stanislavvalasek.com&type=SVCB'
```

The response should contain the SVCB answer and `"AD":true`.

## Authentication

The published Site Profile API is public and read-only. It has no protected resource, authorization server, token endpoint, or agent registration flow, so OAuth/OIDC discovery and OAuth Protected Resource Metadata are intentionally not published. `/auth.md` makes the no-auth contract explicit. Both browser-local WebMCP tools and the network MCP server expose read-only public information.
