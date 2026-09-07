[![Netlify Status](https://api.netlify.com/api/v1/badges/690590fb-b596-413b-8916-a249de10db01/deploy-status)](https://app.netlify.com/sites/stanislavvalasek/deploys)

# www.stanislavvalasek.com

Personal website of [Stanislav Valasek](https://www.stanislavvalasek.com).

## Standing on the shoulders of giants

Static page generator [Hugo](https://gohugo.io/) using [**HugoBlox**](https://hugoblox.com/) - resume theme, hosted on [Netlify](https://www.netlify.com/).

## AI site discovery support

Based on: [Is Your Site Agent-Ready?](https://isitagentready.com/www.stanislavvalasek.com)

Agent discovery endpoints and the required external DNS-AID record are documented in [docs/agent-discovery.md](docs/agent-discovery.md).

## Local development

Use the VS Code Dev Container. It installs the configured toolchain and dependencies, then starts Hugo on <http://localhost:1313> automatically.

For a fresh checkout:

1. Open the repository in VS Code and select **Reopen in Container**.
2. Wait for `postCreateCommand` and `postStartCommand` to finish.
3. Open the forwarded port `1313`.

If the automatic setup or server start needs to be repeated, run:

```bash
corepack enable
pnpm install --frozen-lockfile
hugo mod get ./...
hugo server --bind 0.0.0.0 --disableFastRender
```

This project uses **pnpm**. Do not run `npm install`; it creates a competing `package-lock.json`. The generated `public/` and `resources/` directories are ignored and must not be committed.

Before pushing a change, run:

```bash
pnpm run check         # toolchain pins agree, Netlify functions type-check
pnpm run build
pnpm run verify:build   # generated agent artifacts are correct and complete
```

For a full local simulation of Netlify packaging:

```bash
URL=https://www.stanislavvalasek.com \
  pnpm --package=netlify-cli dlx netlify build --offline
```

The first invocation may need network access to download Netlify CLI.

## Content and navigation

Page content is maintained in both `content/sk/` and `content/en/`. Navigation for both languages is defined in `config/_default/languages.yaml`.

When adding, renaming, moving, or removing a menu item:

1. Update the corresponding content in both language directories.
2. Update both menus in `config/_default/languages.yaml`.
3. If agents should be able to navigate to the section, add or remove it in `agents.sections` in `config/_default/params.yaml`. Everything machine-readable is generated from there, so no other file needs editing.
4. Run `pnpm run build && pnpm run verify:build`. The verifier fails when an advertised section has no built page in either language, which is why menu entries are not reused: the menu also contains grouping links such as `/services` that have no page.

## Upgrades

Make upgrades in a clean branch and keep each upgrade reviewable. Start with compatible dependency updates:

```bash
pnpm outdated
pnpm update
hugo mod get -u ./...
hugo mod tidy
pnpm run check
pnpm run build
pnpm run verify:build
```

Use `pnpm up --latest` only when intentionally reviewing major-version changes. Commit changes to `pnpm-lock.yaml`, `go.mod`, `go.sum` when present, and `deno.lock` when the Netlify Edge Function dependency graph changes.

The Hugo version is pinned in three files, and Node in two. `pnpm run check:versions` fails when they disagree, so change them together and rebuild the Dev Container:

- `.devcontainer/devcontainer.json` (`features.hugo.version`, `features.node.version`)
- `netlify.toml` (`HUGO_VERSION`, `NODE_VERSION`)
- `hugoblox.yaml` (`build.hugo_version`)

Also review the pnpm version in `package.json`. After runtime or major dependency upgrades, run the full Netlify build above because the deployment also bundles an Edge Function and an MCP Function.

## Deployment

Netlify builds the connected production branch using `netlify.toml`. Push a reviewed commit, watch the deploy log, and confirm that it packages both `markdown` under **Edge Functions** and `mcp.ts` under **Functions**. Every deploy context also runs `pnpm run verify:build`, so a broken or incomplete discovery artifact fails the build instead of reaching production. No repository secrets are required by these public, read-only services.

After the deploy finishes, check the live site:

```bash
pnpm run verify:site                              # production, from baseURL
pnpm run verify:site -- https://<preview>.netlify.app
```

Netlify can restore a previous successful deploy for an urgent rollback; follow that by reverting the source commit so the next deploy remains consistent. Details are in [docs/agent-discovery.md](docs/agent-discovery.md#post-deploy-verification).

## Useful commands

```bash
hugo mod clean
hugo mod get -u ./...
hugo server
hugo server --disableFastRender
```

Custom CSS styles are stored in [`assets/css`](assets/css).

## Docs

[HugoBlox Documentation](https://docs.ownable.dev/hugoblox/)

[New Blox docs](https://github.com/HugoBlox/kit/tree/main/modules/blox/blox)

[HugoBlox template source code](https://github.com/HugoBlox/kit/tree/main/templates/resume)

## ToDo

Doplnit testimoials podla awards / https://github.com/HugoBlox/hugo-blox-builder/blob/4f621dfa3a5ab798bea17ad2760bd61815c76f25/modules/blox-tailwind/layouts/partials/blox/resume-awards.html#L37

## License

Copyright 2020-present [Stanislav Valasek](https://www.stanislavvalasek.com)
