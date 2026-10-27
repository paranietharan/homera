# Architecture Rules

Homera is designed to evolve from a lightweight New Tab wallpaper switcher into a modular, cross-platform browser home-screen customization suite.

## 1. Layered Separation of Concerns
Organize code into four distinct layers with strict one-way dependencies (`UI -> Domain -> Storage -> Browser API Adapter`):

1. **UI Layer (`newtab`, `popup`, `components`)**
   - Renders DOM state, handles user interactions, and dispatches intent to domain services.
   - Must not call `chrome.*` or `localStorage` APIs directly.
2. **Domain / Feature Layer (`wallpaper`, future `clock`, `search`, `widgets`)**
   - Contains pure business logic, preset definitions, schema validation, and sanitization rules (see [`security.md`](./security.md)).
   - Independent of DOM elements and browser-specific globals.
3. **Storage Layer (`storage`, `migrations`)**
   - Exposes a unified async repository interface (`getSettings()`, `saveSettings()`, `saveWallpaperAsset()`, `clearAll()`).
   - Manages schema versioning (`schemaVersion`) and migrations so user settings never break across updates.
4. **Browser Platform Adapter (`platform`)**
   - Wraps `chrome.storage`, `chrome.tabs`, `chrome.permissions`, and web fallbacks (`IndexedDB`, `localStorage`, `window.open`).
   - Enables running Homera as a Chrome Extension, Firefox Add-on, or standalone web app (see [`chrome-extension.md`](./chrome-extension.md)).

## 2. Modular Feature Design
- Each home-screen capability (Wallpaper Studio, Clock/Greeting, Search Bar, Quick Links, Weather/Notes widgets) must be self-contained with its own state slice and configuration contract.
- Features should communicate through well-defined events or observable settings changes rather than reaching into another feature's DOM nodes.

## 3. Stable Settings & Asset Contracts
- Define explicit default configurations and validation schemas for every setting key.
- Decouple **wallpaper metadata** (source type, fit, blur, dim, active preset ID) from **wallpaper binary data** (stored by asset reference/key in `IndexedDB` or `chrome.storage.local`) so users can switch between multiple uploaded images without re-uploading or serializing huge Base64 strings on every setting read.

## 4. Progressive Build & Directory Scalability
- Keep zero-build simplicity while the codebase is small, using native ES Modules (`<script type="module">`).
- As modules grow, structure files under `src/`:
  - `src/platform/` — Browser API adapters
  - `src/storage/` — Settings & asset storage + schema migrations
  - `src/domain/` — Validation, presets, and feature logic
  - `src/ui/` — Shared UI components, New Tab view, and Popup view
