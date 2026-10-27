# Development Rules

These standards govern code quality, UI accessibility, testing, and documentation across Homera.

## 1. Language & Code Conventions
- **Current Stack**: Modern vanilla JavaScript (ES2022+), semantic HTML5, and modular CSS using custom properties (`--*`).
- **TypeScript Readiness**: Write JSDoc type annotations or clean, strictly typed interfaces so modules can migrate smoothly to TypeScript without structural rewrites.
- Use `const` by default, `let` only when reassignment is required, and never `var`.
- Prefer `async`/`await` over raw Promise chains and callbacks.
- Keep functions small, pure where possible, and focused on a single responsibility (see [`architecture.md`](./architecture.md)).

## 2. Modularity & State Management
- Avoid polluting `window` or the global scope with loose variables and helper functions. Use ES modules (`type="module"`) or well-scoped namespaces.
- Centralize default settings, schema validation, and storage access in dedicated storage modules rather than scattering keys across UI scripts.

## 3. Error Handling & Resilience
- Wrap all file reads (`FileReader`), URL parsing, and storage operations (`chrome.storage`, `IndexedDB`, `localStorage`) in `try/catch` blocks and inspect `chrome.runtime.lastError` where callbacks are used.
- Handle storage quota exhaustion (`QUOTA_BYTES` errors) gracefully with clear, user-friendly feedback in the UI instead of silent failures.
- Always provide a safe fallback wallpaper (bundled CSS gradient) if a remote URL fails to load or a stored image is corrupted.

## 4. Accessibility (a11y) & UI Quality
- Maintain keyboard navigability (`Tab`, `Enter`, `Escape` to close drawers/modals) and visible `:focus-visible` outlines on all interactive controls.
- Use semantic elements (`<main>`, `<aside>`, `<header>`, `<button>`, `<label>`) and keep `aria-hidden`, `aria-expanded`, and `aria-label` attributes synchronized with UI state.
- Ensure readable contrast over dynamic wallpapers using configurable dim overlays and text shadows.
- Respect `prefers-reduced-motion: reduce` for transitions and blur animations.

## 5. Testing Expectations
- Any change to settings validation, URL sanitization, migration logic, or storage adapters must include automated unit tests (or reproducible verification scripts until a test runner is configured).
- Manually verify both **New Tab (`newtab.html`)** and **Toolbar Popup (`popup.html`)** flows in Chrome before completing work.

## 6. Documentation & Commit Standards
- Follow Conventional Commits as defined in [`commit-rule.md`](./commit-rule.md).
- Update `Readme.md` and applicable files in `rules/` whenever permissions, storage schemas, or user-facing features change.
