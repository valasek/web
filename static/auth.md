# Stanislav Valasek auth.md

This site's public pages, Site Profile API, Agent Skill, and browser tools are
available to agents without authentication or registration.

## Agent Access

- No API key, OAuth token, account, or agent identity is required.
- Only public, read-only resources are exposed.
- There is no credential provisioning, claim, or revocation endpoint.
- Agents may use `/api/site-profile.json`, `/openapi.json`, `/llms.txt`, and the
  resources under `/.well-known/` directly.

The contact form and published contact details are intended for ordinary human
enquiries; they are not agent registration endpoints.