# Homera

Homera is a **privacy-first, 100% offline Chrome Extension (Manifest V3)** that transforms your browser's New Tab page into a customizable, distraction-free home screen. Personalize your wallpaper using local image uploads or bundled presets—complete with adjustable dim, blur, and image fit controls.

---

## Features

- **Local Image Uploads**: Drag-and-drop or browse for local images (`JPG`, `PNG`, `WebP`, `GIF`, `AVIF` up to `10 MB`), stored strictly on your device.
- **Bundled Offline Presets**:
  - **CSS Gradients**: *Aurora Night*, *Sunset Dunes*, *Emerald Mist*.
  - **Bundled High-Resolution Photos (`assets/presets/`)**: *Alpine Peaks*, *Starry Sky*, *Coastal Calm* — packaged directly inside the extension so wallpapers load instantly offline and never break if an external image host is unavailable.
- **Appearance Controls**: Real-time sliders for background dim (`0–80%`), backdrop blur (`0–24px`), and image fit (`cover` / `contain`).
- **One-Click Data Purge**: "Reset to Default" clears custom wallpapers and settings from local storage.

---

## Privacy & Security Guarantees

- **100% Local & Offline**: All preset images are bundled inside the extension package (`assets/presets/*.jpg`), and all user preferences and uploaded wallpapers are stored locally in `chrome.storage.local` (with `localStorage` fallback for standalone web previews).
- **Zero Background Network Requests & Zero Telemetry**: Opening a New Tab makes **zero external network requests** and contains no analytics, tracking scripts, or third-party SDKs.
- **Direct Search Navigation**: The New Tab search bar submits directly to `https://www.google.com/search` via standard HTML form navigation when you submit a query, without intercepting or logging searches.
- **Hardened Input & CSP**: Enforces a strict Manifest V3 Content Security Policy (`default-src 'self'; img-src 'self' data: blob:`), disallows `image/svg+xml` uploads to prevent script injection, validates preset asset paths against an explicit allowlist, and escapes all CSS `url(...)` values.

---

## Local Installation (Chrome / Brave / Edge)

1. Clone or download this repository.
2. Open `chrome://extensions` in your Chromium browser.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select this repository's root directory.
5. Open a new tab (`Cmd+T` / `Ctrl+T`) or click the Homera icon in the browser toolbar.

---

## Development & Verification

Homera uses zero third-party runtime dependencies and runs automated unit and manifest validation tests using Node.js (`>=18`):

```bash
# Run unit tests (local asset/file validation, CSS escaping, schema sanitization, storage adapter)
npm test

# Validate manifest.json, CSP invariants, bundled preset assets, and JavaScript syntax
npm run validate
```

Before contributing, review [`AGENTS.md`](./AGENTS.md) and the engineering standards in [`rules/`](./rules/).
