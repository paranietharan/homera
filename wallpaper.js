// Shared domain, validation, and storage adapter for Homera

/**
 * @typedef {Object} WallpaperPreset
 * @property {string} id
 * @property {string} name
 * @property {'css' | 'image'} type
 * @property {'local'} source
 * @property {string} value
 * @property {string} preview
 */

/**
 * @typedef {Object} WallpaperSettings
 * @property {number} schemaVersion
 * @property {'css' | 'image' | 'data'} wallpaperType
 * @property {string} wallpaperValue
 * @property {string | null} presetId
 * @property {number} dimLevel
 * @property {number} blurLevel
 * @property {'cover' | 'contain'} fitMode
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [value]
 * @property {string} [error]
 */

const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'homera_settings';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_MIMES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
]);

const ALLOWED_FIT_MODES = Object.freeze(['cover', 'contain']);

/** @type {readonly WallpaperPreset[]} */
const PRESETS = Object.freeze([
  {
    id: 'aurora-night',
    name: 'Aurora Night',
    type: 'css',
    source: 'local',
    value: 'radial-gradient(circle at 20% 20%, #3b1d5e 0%, #0f172a 55%, #020617 100%)',
    preview: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #0f172a 100%)'
  },
  {
    id: 'sunset-dunes',
    name: 'Sunset Dunes',
    type: 'css',
    source: 'local',
    value: 'linear-gradient(160deg, #1e1b4b 0%, #7c2d12 55%, #f97316 100%)',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #c2410c 60%, #fb923c 100%)'
  },
  {
    id: 'emerald-mist',
    name: 'Emerald Mist',
    type: 'css',
    source: 'local',
    value: 'radial-gradient(circle at 80% 15%, #065f46 0%, #0f172a 65%, #020617 100%)',
    preview: 'linear-gradient(135deg, #10b981 0%, #065f46 60%, #020617 100%)'
  },
  {
    id: 'alpine-peaks',
    name: 'Alpine Peaks',
    type: 'image',
    source: 'local',
    value: 'assets/presets/alpine-peaks.jpg',
    preview: 'assets/presets/alpine-peaks.jpg'
  },
  {
    id: 'starry-sky',
    name: 'Starry Sky',
    type: 'image',
    source: 'local',
    value: 'assets/presets/starry-sky.jpg',
    preview: 'assets/presets/starry-sky.jpg'
  },
  {
    id: 'coastal-calm',
    name: 'Coastal Calm',
    type: 'image',
    source: 'local',
    value: 'assets/presets/coastal-calm.jpg',
    preview: 'assets/presets/coastal-calm.jpg'
  }
]);

const ALLOWED_CSS_GRADIENTS = new Set(
  PRESETS.filter((p) => p.type === 'css').flatMap((p) => [p.value, p.preview])
);

const ALLOWED_LOCAL_ASSETS = new Set(
  PRESETS.filter((p) => p.type === 'image').flatMap((p) => [p.value, p.preview])
);

/** @type {Readonly<WallpaperSettings>} */
const DEFAULT_SETTINGS = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  wallpaperType: 'css',
  wallpaperValue: PRESETS[0].value,
  presetId: PRESETS[0].id,
  dimLevel: 25,
  blurLevel: 0,
  fitMode: 'cover'
});

/**
 * Validates that a local asset path matches the explicit bundled preset allowlist.
 * Rejects external URLs, path traversal, or unknown files.
 * @param {unknown} rawPath
 * @returns {ValidationResult}
 */
function validateLocalAssetPath(rawPath) {
  if (typeof rawPath !== 'string') {
    return { valid: false, error: 'Asset path must be a string' };
  }
  const trimmed = rawPath.trim();
  if (!ALLOWED_LOCAL_ASSETS.has(trimmed)) {
    return { valid: false, error: 'Only bundled local preset images are allowed' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates a local image data URL against the allowed raster MIME types (rejects SVG and HTML).
 * @param {unknown} rawDataUrl
 * @returns {ValidationResult}
 */
function validateDataImageUrl(rawDataUrl) {
  if (typeof rawDataUrl !== 'string') {
    return { valid: false, error: 'Image data must be a string' };
  }
  const trimmed = rawDataUrl.trim();
  const dataUrlPattern = /^data:(image\/(?:jpeg|jpg|png|webp|gif|avif));base64,[A-Za-z0-9+/=\s]+$/i;
  if (!dataUrlPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Unsupported image data format (allowed: JPG, PNG, WebP, GIF, AVIF)'
    };
  }
  return { valid: true, value: trimmed.replace(/\s+/g, '') };
}

/**
 * Validates an uploaded File/Blob object before reading into memory.
 * @param {{ type?: string, size?: number } | null | undefined} file
 * @returns {ValidationResult}
 */
function validateImageFile(file) {
  if (!file || typeof file !== 'object') {
    return { valid: false, error: 'Please choose an image file' };
  }
  const mimeType = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  if (!ALLOWED_IMAGE_MIMES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Unsupported file type. Allowed: JPG, PNG, WebP, GIF, AVIF'
    };
  }
  if (typeof file.size !== 'number' || file.size <= 0) {
    return { valid: false, error: 'Selected image file is empty' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: 'Image exceeds 10 MB limit. Please choose a smaller file'
    };
  }
  return { valid: true };
}

/**
 * Escapes and formats a validated bundled local asset path or data URL into a safe CSS `url("...")` value.
 * Returns null if the input fails validation.
 * @param {unknown} rawAssetOrData
 * @returns {string | null}
 */
function toSafeCssUrl(rawAssetOrData) {
  if (typeof rawAssetOrData !== 'string') return null;
  const trimmed = rawAssetOrData.trim();
  const check = trimmed.startsWith('data:')
    ? validateDataImageUrl(trimmed)
    : validateLocalAssetPath(trimmed);

  if (!check.valid || !check.value) {
    return null;
  }

  const escaped = check.value.replace(/[\\"()'\n\r\t]/g, (ch) => `\\${ch}`);
  return `url("${escaped}")`;
}

/**
 * Clamps a numeric setting to an integer within [min, max] or returns fallback.
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
function clampNumber(value, min, max, fallback) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

/**
 * Sanitizes and migrates untrusted settings read from storage.
 * Automatically migrates legacy v1 preset URLs to bundled local preset assets,
 * and falls back safely to the default CSS gradient if stored state is invalid.
 * @param {unknown} raw
 * @returns {WallpaperSettings}
 */
function sanitizeSettings(raw) {
  const input = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};

  const dimLevel = clampNumber(input.dimLevel, 0, 80, DEFAULT_SETTINGS.dimLevel);
  const blurLevel = clampNumber(input.blurLevel, 0, 24, DEFAULT_SETTINGS.blurLevel);
  const fitMode = ALLOWED_FIT_MODES.includes(/** @type {any} */ (input.fitMode))
    ? /** @type {'cover' | 'contain'} */ (input.fitMode)
    : DEFAULT_SETTINGS.fitMode;

  const matchedPreset =
    typeof input.presetId === 'string'
      ? PRESETS.find((p) => p.id === input.presetId) || null
      : null;

  let wallpaperType = DEFAULT_SETTINGS.wallpaperType;
  let wallpaperValue = DEFAULT_SETTINGS.wallpaperValue;
  let resolvedPresetId = matchedPreset ? matchedPreset.id : null;

  if (input.wallpaperType === 'css' && typeof input.wallpaperValue === 'string') {
    if (ALLOWED_CSS_GRADIENTS.has(input.wallpaperValue)) {
      wallpaperType = 'css';
      wallpaperValue = input.wallpaperValue;
    } else {
      resolvedPresetId = DEFAULT_SETTINGS.presetId;
    }
  } else if (input.wallpaperType === 'image') {
    const check = validateLocalAssetPath(input.wallpaperValue);
    if (check.valid && check.value) {
      wallpaperType = 'image';
      wallpaperValue = check.value;
    } else {
      resolvedPresetId = DEFAULT_SETTINGS.presetId;
    }
  } else if (input.wallpaperType === 'url' && matchedPreset && matchedPreset.type === 'image') {
    // Migrate legacy v1 remote preset URL to bundled local preset image
    wallpaperType = 'image';
    wallpaperValue = matchedPreset.value;
    resolvedPresetId = matchedPreset.id;
  } else if (input.wallpaperType === 'data') {
    const check = validateDataImageUrl(input.wallpaperValue);
    if (check.valid && check.value) {
      wallpaperType = 'data';
      wallpaperValue = check.value;
    } else {
      resolvedPresetId = DEFAULT_SETTINGS.presetId;
    }
  } else {
    resolvedPresetId = DEFAULT_SETTINGS.presetId;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    wallpaperType,
    wallpaperValue,
    presetId: resolvedPresetId,
    dimLevel,
    blurLevel,
    fitMode
  };
}

/**
 * Formats storage errors (including quota exhaustion) into user-friendly messages.
 * @param {unknown} err
 * @returns {Error}
 */
function normalizeStorageError(err) {
  const message =
    err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
      ? err.message
      : String(err || 'Storage error');
  if (/quota/i.test(message)) {
    return new Error('Storage quota exceeded. Please choose a smaller image.');
  }
  return new Error(message);
}

/**
 * Reads and sanitizes user settings from `chrome.storage.local` or `localStorage`.
 * @returns {Promise<WallpaperSettings>}
 */
function getSettings() {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.warn('Homera storage read error:', chrome.runtime.lastError.message);
            resolve({ ...DEFAULT_SETTINGS });
            return;
          }
          resolve(sanitizeSettings(items));
        });
      } else if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          resolve({ ...DEFAULT_SETTINGS });
          return;
        }
        const parsed = JSON.parse(saved);
        resolve(sanitizeSettings({ ...DEFAULT_SETTINGS, ...parsed }));
      } else {
        resolve({ ...DEFAULT_SETTINGS });
      }
    } catch (err) {
      console.warn('Failed to read settings, falling back to default:', err);
      resolve({ ...DEFAULT_SETTINGS });
    }
  });
}

/**
 * Validates and persists partial settings updates to storage.
 * @param {Partial<WallpaperSettings>} partial
 * @returns {Promise<WallpaperSettings>}
 */
async function saveSettings(partial) {
  const current = await getSettings();
  const merged = sanitizeSettings({ ...current, ...partial });

  return new Promise((resolve, reject) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(merged, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            reject(normalizeStorageError(chrome.runtime.lastError));
            return;
          }
          resolve(merged);
        });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        resolve(merged);
      } else {
        resolve(merged);
      }
    } catch (err) {
      reject(normalizeStorageError(err));
    }
  });
}

/**
 * Purges stored settings and custom wallpaper data and restores defaults.
 * @returns {Promise<WallpaperSettings>}
 */
function resetSettings() {
  return new Promise((resolve, reject) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.clear(() => {
          if (chrome.runtime && chrome.runtime.lastError) {
            reject(normalizeStorageError(chrome.runtime.lastError));
            return;
          }
          chrome.storage.local.set(DEFAULT_SETTINGS, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(normalizeStorageError(chrome.runtime.lastError));
              return;
            }
            resolve({ ...DEFAULT_SETTINGS });
          });
        });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        resolve({ ...DEFAULT_SETTINGS });
      } else {
        resolve({ ...DEFAULT_SETTINGS });
      }
    } catch (err) {
      reject(normalizeStorageError(err));
    }
  });
}

/**
 * Validates and reads a user-selected image File as a Base64 Data URL.
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsDataURL(file) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return Promise.reject(new Error(validation.error));
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const dataCheck = validateDataImageUrl(result);
        if (!dataCheck.valid || !dataCheck.value) {
          reject(new Error(dataCheck.error || 'Failed to validate encoded image'));
          return;
        }
        resolve(dataCheck.value);
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to read image file'));
    }
  });
}

const Homera = Object.freeze({
  SCHEMA_VERSION,
  STORAGE_KEY,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_FIT_MODES,
  PRESETS,
  DEFAULT_SETTINGS,
  validateLocalAssetPath,
  validateDataImageUrl,
  validateImageFile,
  toSafeCssUrl,
  sanitizeSettings,
  getSettings,
  saveSettings,
  resetSettings,
  readFileAsDataURL
});

if (typeof globalThis !== 'undefined') {
  globalThis.Homera = Homera;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Homera;
}
