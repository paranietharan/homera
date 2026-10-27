const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PRESETS,
  DEFAULT_SETTINGS,
  MAX_UPLOAD_BYTES,
  validateLocalAssetPath,
  validateDataImageUrl,
  validateImageFile,
  toSafeCssUrl,
  sanitizeSettings,
  getSettings,
  saveSettings,
  resetSettings
} = require('../wallpaper.js');

const ROOT = path.resolve(__dirname, '..');

test('all image presets reference bundled local files that exist on disk', () => {
  const imagePresets = PRESETS.filter((p) => p.type === 'image');
  assert.ok(imagePresets.length >= 3);
  for (const preset of imagePresets) {
    assert.equal(preset.source, 'local');
    assert.equal(validateLocalAssetPath(preset.value).valid, true);
    assert.ok(
      fs.existsSync(path.join(ROOT, preset.value)),
      `Expected bundled preset file to exist: ${preset.value}`
    );
  }
});

test('validateLocalAssetPath allowlists bundled preset paths and rejects external URLs or traversal', () => {
  assert.equal(validateLocalAssetPath('assets/presets/alpine-peaks.jpg').valid, true);
  assert.equal(validateLocalAssetPath('https://images.unsplash.com/photo-123').valid, false);
  assert.equal(validateLocalAssetPath('../manifest.json').valid, false);
  assert.equal(validateLocalAssetPath('javascript:alert(1)').valid, false);
  assert.equal(validateLocalAssetPath('').valid, false);
});

test('validateDataImageUrl accepts raster base64 images and rejects SVG/HTML payloads', () => {
  const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const res = validateDataImageUrl(pngData);
  assert.equal(res.valid, true);

  const svgData = 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4=';
  assert.equal(validateDataImageUrl(svgData).valid, false);

  const htmlData = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
  assert.equal(validateDataImageUrl(htmlData).valid, false);
});

test('validateImageFile enforces MIME allowlist and 10 MB size cap', () => {
  assert.equal(validateImageFile({ type: 'image/jpeg', size: 1024 }).valid, true);
  assert.equal(validateImageFile({ type: 'image/webp', size: MAX_UPLOAD_BYTES }).valid, true);

  // Reject SVG uploads
  assert.equal(validateImageFile({ type: 'image/svg+xml', size: 500 }).valid, false);
  // Reject non-images
  assert.equal(validateImageFile({ type: 'application/pdf', size: 500 }).valid, false);
  // Reject empty or oversized files
  assert.equal(validateImageFile({ type: 'image/png', size: 0 }).valid, false);
  assert.equal(validateImageFile({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 }).valid, false);
});

test('toSafeCssUrl formats valid local assets and data URLs and rejects external or unsafe schemes', () => {
  assert.equal(
    toSafeCssUrl('assets/presets/alpine-peaks.jpg'),
    'url("assets/presets/alpine-peaks.jpg")'
  );
  assert.equal(toSafeCssUrl('https://example.com/wall.jpg'), null);
  assert.equal(toSafeCssUrl('javascript:alert(1)'), null);
  assert.equal(toSafeCssUrl('data:image/svg+xml;base64,PHN2Zz4='), null);
});

test('sanitizeSettings clamps numeric ranges, migrates legacy preset URLs, and falls back on corrupted state', () => {
  const corrupted = sanitizeSettings({
    wallpaperType: 'url',
    wallpaperValue: 'https://example.com/unavailable.jpg',
    presetId: 'non-existent-id',
    dimLevel: 999,
    blurLevel: -20,
    fitMode: 'stretch-invalid'
  });

  assert.equal(corrupted.wallpaperType, DEFAULT_SETTINGS.wallpaperType);
  assert.equal(corrupted.wallpaperValue, DEFAULT_SETTINGS.wallpaperValue);
  assert.equal(corrupted.presetId, DEFAULT_SETTINGS.presetId);
  assert.equal(corrupted.dimLevel, 80);
  assert.equal(corrupted.blurLevel, 0);
  assert.equal(corrupted.fitMode, 'cover');

  // Legacy v1 preset with type: 'url' and valid presetId should migrate to bundled local 'image'
  const migrated = sanitizeSettings({
    wallpaperType: 'url',
    wallpaperValue: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    presetId: 'alpine-peaks',
    dimLevel: 40,
    blurLevel: 12,
    fitMode: 'contain'
  });
  assert.equal(migrated.wallpaperType, 'image');
  assert.equal(migrated.wallpaperValue, 'assets/presets/alpine-peaks.jpg');
  assert.equal(migrated.presetId, 'alpine-peaks');
  assert.equal(migrated.dimLevel, 40);
  assert.equal(migrated.blurLevel, 12);
  assert.equal(migrated.fitMode, 'contain');
});

test('storage adapter works with localStorage fallback and handles quota errors gracefully', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k)
  };

  try {
    const initial = await getSettings();
    assert.equal(initial.presetId, DEFAULT_SETTINGS.presetId);

    const updated = await saveSettings({ dimLevel: 55, fitMode: 'contain' });
    assert.equal(updated.dimLevel, 55);
    assert.equal(updated.fitMode, 'contain');

    const afterReset = await resetSettings();
    assert.equal(afterReset.dimLevel, DEFAULT_SETTINGS.dimLevel);
    assert.equal(store.size, 0);

    // Simulate quota error
    globalThis.localStorage.setItem = () => {
      throw new Error('QuotaExceededError: QUOTA_BYTES quota exceeded');
    };
    await assert.rejects(
      () => saveSettings({ dimLevel: 30 }),
      /Storage quota exceeded/
    );
  } finally {
    delete globalThis.localStorage;
  }
});
