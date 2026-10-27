# AGENTS.md — Contributor & Coding Agent Guidelines

Welcome to **Homera**, a privacy-first browser home-screen and New Tab customization extension (Manifest V3).

---

## 1. Quick Reference & Architecture Map

- **Stack**: Vanilla JavaScript (ES2022+ with JSDoc types), semantic HTML5, modular CSS (`--*` custom properties), Manifest V3 (`manifest.json`), and Node.js built-in test runner (`node --test`) with zero third-party runtime dependencies.
- **Repository Layout**:
  - `manifest.json` — Chrome Extension MV3 configuration, least-privilege permissions (`storage`, `unlimitedStorage`), and strict CSP.
  - `wallpaper.js` — Shared domain & storage module (presets, URL/file/schema validation, CSS escaping, and `chrome.storage.local` / `localStorage` adapter). Exposes `globalThis.Homera` for browser views and `module.exports` for Node tests.
  - `newtab.html`, `newtab.css`, `newtab.js` — Primary New Tab dashboard and Wallpaper Studio settings drawer.
  - `popup.html`, `popup.css`, `popup.js` — Toolbar action popup for quick wallpaper customization.
  - `tests/` — Automated unit and validation tests (`tests/*.test.js`).
  - `rules/` — Detailed engineering, security, privacy, and commit specifications.

---

## 2. Verification Commands (Run Before Completing Work)

Always verify your changes using the built-in scripts (sandbox-friendly, no network required):

```bash
npm test            # Run automated unit tests (node --test)
npm run validate    # Validate manifest.json, HTML/JS syntax, and security invariants
```

---

## 3. Conditional Rule Routing (Read What Applies)

To keep context focused, read the specific files in [`rules/`](./rules/) that apply to your task before making changes:

| Task / Area Touched | Required Rule Files to Read |
| :--- | :--- |
| **URLs, file uploads, DOM rendering, CSP, or `manifest.json`** | [`rules/security.md`](./rules/security.md), [`rules/chrome-extension.md`](./rules/chrome-extension.md) |
| **Storage, presets, settings schema, or network requests** | [`rules/privacy.md`](./rules/privacy.md), [`rules/architecture.md`](./rules/architecture.md) |
| **UI, CSS, accessibility (a11y), error handling, or tests** | [`rules/development.md`](./rules/development.md) |
| **Creating git commits or pull requests** | [`rules/commit-rule.md`](./rules/commit-rule.md) |

---

## 4. Core Directives (Non-Negotiable Invariants)

1. **Enforce Least Privilege**: Keep `manifest.json` permissions restricted to `storage` and `unlimitedStorage`. Never add broad host permissions (`<all_urls>`, `*://*/*`) or new permissions without an explicit product need and documented justification.
2. **Validate All Untrusted Input**:
   - External URLs must be parsed with `new URL()` and restricted to `https:`.
   - Uploaded files must match the explicit MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif` — never `image/svg+xml`) and size cap (`10 MB`).
   - Never interpolate raw user strings into `style.backgroundImage` without `toSafeCssUrl()` sanitization, and never use `innerHTML` with dynamic data.
3. **Preserve Privacy by Default**: Store all user data locally (`chrome.storage.local` / `localStorage` fallback). Never introduce telemetry, analytics, or unrequested external calls. Clearly distinguish bundled CSS presets (`source: 'local'`) from remote image presets (`source: 'remote'`).
4. **Resilient Storage & Fallbacks**: Always check `chrome.runtime.lastError`, wrap storage and `JSON.parse` calls in `try/catch`, handle quota errors (`QUOTA_BYTES` / `QuotaExceededError`) with user-visible feedback, and fall back to the default CSS gradient if a wallpaper is invalid.
5. **Protect Secrets & Repository Hygiene**: Never commit secrets, API keys, tokens, personal data, or temporary build artifacts.
6. **Keep Changes Focused & Tested**: Add or update tests in `tests/` whenever validation, storage, or domain logic changes.
7. **Keep Rules & Docs Updated**: Update `Readme.md` and relevant files in `rules/` whenever permissions, storage schemas, or user-facing capabilities change.
8. **Summarize Changes & Follow-Ups**: Conclude every task by summarizing every file added or changed and noting any assumptions, risks, or follow-up recommendations.
