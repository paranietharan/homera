# Chrome Extension Rules

Homera targets **Manifest V3 (MV3)** and must remain compliant with Chrome Web Store policies and cross-browser WebExtensions standards.

## 1. Manifest & Least-Privilege Permissions
- Declare only the minimum permissions required for current functionality in `manifest.json`.
- **Required Permissions**: Keep baseline permissions limited to `storage` (and `unlimitedStorage` only if storing high-resolution local wallpapers directly in extension storage).
- **Optional Permissions**: If future features need access to `topSites`, `bookmarks`, or `geolocation`, request them at runtime via `chrome.permissions.request()` (`optional_permissions`) only when the user enables that specific widget.
- Never add `host_permissions` (`*://*/*` or `<all_urls>`) unless an approved feature requires cross-origin fetches and cannot be satisfied by standard `<img>` loading or CORS-enabled endpoints.

## 2. Secure Message Passing
- When communicating between `popup`, `newtab`, `options`, or a background `service_worker`:
  - Validate `sender.id === chrome.runtime.id` and verify `sender.url` / `sender.origin` before acting on any message.
  - Validate the message payload shape and action type against an explicit allowlist (see [`security.md`](./security.md)).
  - Prefer storage state synchronization (`chrome.storage.onChanged`) over complex message passing for simple UI preference updates.
  - Never use `window.postMessage` with a wildcard targetOrigin (`"*"`) for sensitive extension state.

## 3. Extension Storage Guidance
- Separate lightweight configuration metadata (`presetId`, `dimLevel`, `blurLevel`, `fitMode`) from large binary image blobs.
- Avoid storing multi-megabyte Base64 data URLs in `chrome.storage.sync` (which has strict 100 KB total / 8 KB per-item limits). Use `chrome.storage.local` or `IndexedDB` (storing native `Blob` objects) for user-uploaded images.
- Check `chrome.runtime.lastError` on all storage operations and handle quota errors gracefully.

## 4. Service Worker & Lifecycle Best Practices
- Only register a `background.service_worker` in `manifest.json` when background event handling (e.g., scheduled wallpaper rotation via `chrome.alarms`) is actually needed.
- Never rely on persistent in-memory globals in MV3 service workers; persist state in storage.

## 5. Cross-Browser Compatibility
- Isolate `chrome.*` API calls behind the browser adapter layer defined in [`architecture.md`](./architecture.md).
- Support the standard Promise-based `browser.*` / `chrome.*` namespace or fallback cleanly to web standards (`IndexedDB` / `localStorage`) so Homera can run in Firefox, Edge, Brave, and standalone web previews.
