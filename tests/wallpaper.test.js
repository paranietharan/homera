const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PRESETS,
  DEFAULT_SETTINGS,
  MAX_UPLOAD_BYTES,
  validateWallpaperUrl,
  validateDataImageUrl,
  validateImageFile,
  toSafeCssUrl,
  sanitizeSettings,
  getSettings,
  saveSettings,
  resetSettings
} = require('../wallpaper.js');

test('validateWallpaperUrl accepts valid HTTPS URLs and rejects insecure or dangerous schemes', () => {
  const valid = validateWallpaperUrl('  https://images.unsplash.com/photo-123?w=2000  ');
  assert.equal(valid.valid, true);
  assert.equal(valid.value, 'https://images.unsplash.com/photo-123?w=2000');

  assert.equal(validateWallpaperUrl('http://example.com/image.jpg').valid, false);
  assert.equal(validateWallpaperUrl('javascript:alert(1)').valid, false);
  assert.equal(validateWallpaperUrl('data:text/html,<script>alert(1)</script>').valid, false);
  assert.equal(validateWallpaperUrl('file:///etc/passwd').valid, false);
  assert.equal(validateWallpaperUrl('https://user:pass@example.com/a.jpg').valid, false);
  assert.equal(validateWallpaperUrl('').valid, false);
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

test('toSafeCssUrl prevents CSS injection and rejects invalid schemes', () => {
  const safe = toSafeCssUrl('https://example.com/wall("test").jpg');
  assert.ok(safe);
  assert.ok(safe.startsWith('url("https://example.com/'));

  const unescapedQuoteAttempt = toSafeCssUrl('https://example.com/a.jpg?x=")}body{background:red}');
  assert.ok(unescapedQuoteAttempt);
  // Ensure raw double quotes or closing parens cannot break out of url("...")
  const inner = unescapedQuoteAttempt.slice(5, -2);
  assert.equal(/(?<!\\)["()]/.test(inner), false);

  assert.equal(toSafeCssUrl('javascript:alert(1)'), null);
  assert.equal(toSafeCssUrl('data:image/svg+xml;base64,PHN2Zz4='), null);
});

test('sanitizeSettings clamps numeric ranges and falls back safely on corrupted state', () => {
  const corrupted = sanitizeSettings({
    wallpaperType: 'url',
    wallpaperValue: 'javascript:alert(1)',
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

  const validPreset = PRESETS.find((p) => p.type === 'url');
  const valid = sanitizeSettings({
    wallpaperType: 'url',
    wallpaperValue: validPreset.value,
    presetId: validPreset.id,
    dimLevel: 40,
    blurLevel: 12,
    fitMode: 'contain'
  });
  assert.equal(valid.wallpaperType, 'url');
  assert.equal(valid.presetId, validPreset.id);
  assert.equal(valid.dimLevel, 40);
  assert.equal(valid.blurLevel, 12);
  assert.equal(valid.fitMode, 'contain');
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
