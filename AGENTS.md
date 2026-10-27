# AGENTS.md — Contributor & Coding Agent Guidelines

Welcome to **Homera**, a privacy-first browser home-screen and New Tab customization extension.

Every human contributor and AI coding agent working in this repository **must** follow these 10 core directives:

1. **Read Project Rules First**: Read all applicable files in [`rules/`](./rules/) before planning or making any changes:
   - [`rules/security.md`](./rules/security.md) — Input validation, CSP, permissions, and secrets.
   - [`rules/privacy.md`](./rules/privacy.md) — Privacy by default, local-first storage, and zero unauthorized telemetry.
   - [`rules/development.md`](./rules/development.md) — Code quality, accessibility, error handling, and testing.
   - [`rules/chrome-extension.md`](./rules/chrome-extension.md) — Manifest V3, least-privilege permissions, and cross-browser compatibility.
   - [`rules/architecture.md`](./rules/architecture.md) — Layered separation of UI, domain logic, storage, and browser APIs.
   - [`rules/commit-rule.md`](./rules/commit-rule.md) — Conventional Commits 1.0.0 formatting.
2. **Follow Project Conventions**: Adhere to existing project conventions and coding styles unless a rule in `rules/` explicitly requires a change to improve security, privacy, or maintainability.
3. **Enforce Least Privilege**: Use least privilege for browser permissions in `manifest.json`. Never add broad host permissions (`<all_urls>`, `*://*/*`) or new extension permissions without an explicit product need and documented justification.
4. **Validate All Untrusted Input**: Treat all external data, user input, uploaded files, extension messages, URLs, and stored settings as untrusted until validated and sanitized.
5. **Protect Secrets & Repository Hygiene**: Never commit secrets, API keys, tokens, personal data, or generated build/temporary artifacts unless the repository explicitly requires them.
6. **Keep Changes Focused & Tested**: Keep changes small, modular, and focused on a single concern; add or update tests and verification steps whenever behavior changes.
7. **Preserve Privacy by Default**: Store user data locally by default and clearly document any data collection, analytics, or external network requests before introducing them.
8. **Keep Rules & Docs Updated**: Update relevant files in `rules/` and project documentation (`Readme.md`) whenever introducing a significant new capability, integration, permission, or data flow.
9. **Verify Before Completion**: Run and verify all available formatting, linting, tests, and build/extension validation steps before completing work.
10. **Summarize Changes & Follow-Ups**: Conclude every task by summarizing every file added or changed and noting any assumptions, risks, or follow-up recommendations.
