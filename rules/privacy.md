# Privacy Rules

Homera is built on **privacy by default** and **local-first** ownership of user customization data.

## 1. Privacy by Default & Local-First Storage
- Keep user wallpapers, layout preferences, clock settings, and dashboard configurations on the user's device using local browser storage (`chrome.storage.local` or `IndexedDB`).
- Homera must function offline out of the box using bundled assets and locally stored images without requiring an account or cloud sync.

## 2. Data Minimization
- Collect and persist only the minimum settings required to render and restore the user's home screen.
- Never access, read, or transmit browsing history, bookmarks, open tabs, search queries, cookies, or form inputs unless a dedicated opt-in widget explicitly requires it (see [`chrome-extension.md`](./chrome-extension.md)).
- Search forms on the New Tab page must submit directly to the user's chosen search engine without intercepting, logging, or proxying queries.

## 3. External Network Requests
- Document every external network request in project documentation.
- Avoid loading remote fonts, remote wallpaper URLs, tracking pixels, or unrequested third-party CDNs on New Tab open. Bundle all preset wallpapers locally (`assets/presets/`) so the extension makes zero background network requests and works 100% offline even if external image hosts go down.

## 4. Prohibition on Unauthorized Data Collection
- Never collect, sell, or transmit personal data, uploaded images, or usage telemetry to external servers without:
  1. A clear, documented product need.
  2. Prominent, plain-language disclosure in the UI and privacy policy.
  3. Explicit, affirmative user opt-in consent.

## 5. Transparency & Analytics
- Telemetry and analytics must be disabled by default (opt-in only).
- If opt-in diagnostics are introduced in the future, strip all PII, full URLs, file names, and search terms before transmission, and provide a one-click toggle to disable and purge collected state.

## 6. User Data Control
- Provide a clear "Reset to Default" / "Clear Data" action in the UI that purges custom images and stored settings from `chrome.storage` and `localStorage` (see [`development.md`](./development.md)).
