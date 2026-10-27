# Homera

Homera is a **privacy-first Chrome Extension (Manifest V3)** that transforms your browser's New Tab page into a customizable, distraction-free home screen. Personalize your wallpaper using local image uploads, custom HTTPS URLs, or curated presets—complete with adjustable dim, blur, and image fit controls.

---

## Features

- **Local Image Uploads**: Drag-and-drop or browse for local images (`JPG`, `PNG`, `WebP`, `GIF`, `AVIF` up to `10 MB`), stored strictly on your device.
- **Custom HTTPS Image URLs**: Set any validated `https://` image URL as your wallpaper.
- **Curated Presets**:
  - **Local CSS Gradients (Offline, Zero Network Requests)**: *Aurora Night*, *Sunset Dunes*, *Emerald Mist*.
  - **Remote HTTPS Presets (Unsplash)**: *Alpine Peaks*, *Starry Sky*, *Coastal Calm*.
- **Appearance Controls**: Real-time sliders for background dim (`0–80%`), backdrop blur (`0–24px`), and image fit (`cover` / `contain`).
- **One-Click Data Purge**: "Reset to Default" clears custom wallpapers and settings from local storage.

---

## Privacy & Security Guarantees

- **Local-First Storage**: All preferences and uploaded wallpapers are stored locally in `chrome.storage.local` (with `localStorage` fallback for standalone web previews).
- **Zero Telemetry**: Homera contains no analytics, tracking scripts, or third-party SDKs.
- **Network Transparency**:
  - Homera makes **zero network requests** when using default or local CSS gradient presets or locally uploaded images.
  - Selecting a remote preset (*Alpine Peaks*, *Starry Sky*, *Coastal Calm*) or a custom HTTPS image URL causes your browser to fetch that image directly from the image host (`images.unsplash.com` or your specified domain).
  - The New Tab search bar submits directly to `https://www.google.com/search` via standard HTML form navigation without intercepting or logging queries.
- **Hardened Input & CSP**: Enforces a strict Manifest V3 Content Security Policy (`default-src 'self'`), disallows `image/svg+xml` uploads to prevent script injection, validates URLs via `new URL()`, and escapes all CSS `url(...)` values.

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
# Run unit tests (URL/file validation, CSS escaping, schema sanitization, storage adapter)
npm test

# Validate manifest.json, CSP invariants, and JavaScript syntax
npm run validate
```

Before contributing, review [`AGENTS.md`](./AGENTS.md) and the engineering standards in [`rules/`](./rules/).
