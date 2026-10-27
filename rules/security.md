# Security Rules

Homera handles user-supplied files, external image URLs, and browser extension APIs. Every contributor and agent must enforce these security baselines.

## 1. Untrusted Input Validation & Sanitization
- Treat all user input, uploaded files, asset paths, stored settings, and extension messages as untrusted.
- **Asset & Data URL Validation**: Preset images must be bundled locally under `assets/presets/` and validated against an explicit allowlist (`validateLocalAssetPath`). Local uploads must be validated against the raster `data:image/*` allowlist (`validateDataImageUrl`). Reject external URLs, `javascript:`, `data:text/html`, `data:image/svg+xml`, `file:`, `vbscript:`, and path traversal sequences.
- **CSS Injection Prevention**: Never interpolate raw strings directly into `style.backgroundImage = url("${rawInput}")` or inline style attributes without `toSafeCssUrl()` validation and escaping.
- **File Uploads**: Verify both the MIME type (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`) and file size (`<= 10 MB`) before reading or persisting uploads. Avoid rendering untrusted `image/svg+xml` directly in an execution context.
- **DOM Manipulation**: Use `textContent` and `createElement` instead of `innerHTML`, `outerHTML`, or `insertAdjacentHTML` with dynamic data.

## 2. Content Security Policy (CSP) & Dynamic Execution
- Define an explicit, restrictive `content_security_policy.extension_pages` in `manifest.json` (`default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`).
- Never use `eval()`, `new Function()`, `setTimeout(string)`, `setInterval(string)`, or inline event handlers (`onclick="..."`).
- Bundle all executable scripts locally inside the extension package; never load remote JavaScript or CSS.

## 3. Chrome Extension Permissions
- Follow the least-privilege rules in [`chrome-extension.md`](./chrome-extension.md).
- Do not request `<all_urls>`, `tabs`, `webRequest`, `scripting`, or `cookies` unless strictly required by an approved feature and documented in PR notes.

## 4. Storage Security
- Store only validated schema keys and primitive/serialized values in `chrome.storage` or `IndexedDB` (see [`architecture.md`](./architecture.md)).
- Validate and sanitize data read back from `chrome.storage` or `localStorage` before rendering, as stored state may be corrupted or modified.
- Never store sensitive tokens, plaintext credentials, or personally identifiable information (PII) in unencrypted extension storage (see [`privacy.md`](./privacy.md)).

## 5. Dependency & Supply Chain Safety
- Minimize third-party runtime dependencies; prefer native Web and Extension APIs.
- Pin dependency versions in lockfiles when build tooling is introduced, audit packages (`npm audit`), and verify licenses and maintainer reputation before adding dependencies.

## 6. Secrets Management
- Never hardcode API keys, OAuth client secrets, private URLs, or developer tokens in source files, `manifest.json`, or git history.
- If third-party APIs (e.g., wallpaper catalogs or weather) are added later, route authenticated calls through a rate-limited backend proxy or allow user-supplied keys stored locally with explicit disclosure.

## 7. Reporting Security Concerns
- Do not disclose unpatched vulnerabilities in public issues or commit logs.
- Report security findings privately to the repository maintainers with reproduction steps, affected files, and impact assessment.
