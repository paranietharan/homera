// Shared wallpaper helper and presets for Homera

const PRESETS = [
  {
    id: 'aurora-night',
    name: 'Aurora Night',
    type: 'css',
    value: 'radial-gradient(circle at 20% 20%, #3b1d5e 0%, #0f172a 55%, #020617 100%)',
    preview: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #0f172a 100%)'
  },
  {
    id: 'sunset-dunes',
    name: 'Sunset Dunes',
    type: 'css',
    value: 'linear-gradient(160deg, #1e1b4b 0%, #7c2d12 55%, #f97316 100%)',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #c2410c 60%, #fb923c 100%)'
  },
  {
    id: 'emerald-mist',
    name: 'Emerald Mist',
    type: 'css',
    value: 'radial-gradient(circle at 80% 15%, #065f46 0%, #0f172a 65%, #020617 100%)',
    preview: 'linear-gradient(135deg, #10b981 0%, #065f46 60%, #020617 100%)'
  },
  {
    id: 'alpine-peaks',
    name: 'Alpine Peaks',
    type: 'url',
    value: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85',
    preview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=70'
  },
  {
    id: 'starry-sky',
    name: 'Starry Sky',
    type: 'url',
    value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=85',
    preview: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=70'
  },
  {
    id: 'coastal-calm',
    name: 'Coastal Calm',
    type: 'url',
    value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70'
  }
];

const DEFAULT_SETTINGS = {
  wallpaperType: 'css',
  wallpaperValue: PRESETS[0].value,
  presetId: PRESETS[0].id,
  dimLevel: 25,
  blurLevel: 0,
  fitMode: 'cover'
};

function getSettings() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
        resolve(items);
      });
    } else {
      const saved = localStorage.getItem('homera_settings');
      resolve(saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS);
    }
  });
}

function saveSettings(partial) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(partial, () => resolve());
    } else {
      getSettings().then((current) => {
        const updated = { ...current, ...partial };
        localStorage.setItem('homera_settings', JSON.stringify(updated));
        resolve();
      });
    }
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

