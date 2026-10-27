document.addEventListener('DOMContentLoaded', async () => {
  const wallpaperLayer = document.getElementById('wallpaper-layer');
  const wallpaperOverlay = document.getElementById('wallpaper-overlay');
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingEl = document.getElementById('greeting');

  const openBtn = document.getElementById('open-settings-btn');
  const closeBtn = document.getElementById('close-settings-btn');
  const drawer = document.getElementById('settings-drawer');

  const fileInput = document.getElementById('file-upload');
  const dropZone = document.getElementById('drop-zone');
  const urlInput = document.getElementById('url-input');
  const applyUrlBtn = document.getElementById('apply-url-btn');
  const presetGrid = document.getElementById('preset-grid');

  const dimSlider = document.getElementById('dim-slider');
  const dimVal = document.getElementById('dim-val');
  const blurSlider = document.getElementById('blur-slider');
  const blurVal = document.getElementById('blur-val');
  const fitBtns = document.querySelectorAll('.fit-btn');
  const resetBtn = document.getElementById('reset-btn');
  const statusMsg = document.getElementById('status-msg');

  function showStatus(text) {
    statusMsg.textContent = text;
    setTimeout(() => {
      if (statusMsg.textContent === text) statusMsg.textContent = '';
    }, 2200);
  }

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString(undefined, options);

    const hr = now.getHours();
    if (hr < 12) greetingEl.textContent = 'Good morning';
    else if (hr < 18) greetingEl.textContent = 'Good afternoon';
    else greetingEl.textContent = 'Good evening';
  }

  updateClock();
  setInterval(updateClock, 10000);

  function renderWallpaper(settings) {
    if (settings.wallpaperType === 'css') {
      wallpaperLayer.style.backgroundImage = settings.wallpaperValue;
    } else if (settings.wallpaperValue) {
      wallpaperLayer.style.backgroundImage = `url("${settings.wallpaperValue}")`;
    }

    wallpaperLayer.style.backgroundSize = settings.fitMode || 'cover';
    wallpaperLayer.style.filter = `blur(${settings.blurLevel || 0}px)`;
    wallpaperOverlay.style.background = `rgba(2, 6, 23, ${(settings.dimLevel ?? 25) / 100})`;

    dimSlider.value = settings.dimLevel ?? 25;
    dimVal.textContent = `${settings.dimLevel ?? 25}%`;

    blurSlider.value = settings.blurLevel ?? 0;
    blurVal.textContent = `${settings.blurLevel ?? 0}px`;

    fitBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.fit === (settings.fitMode || 'cover'));
    });

    document.querySelectorAll('.preset-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.id === settings.presetId);
    });
  }

  function buildPresets(activePresetId) {
    presetGrid.innerHTML = '';
    PRESETS.forEach((preset) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `preset-card ${preset.id === activePresetId ? 'active' : ''}`;
      card.dataset.id = preset.id;

      if (preset.type === 'css') {
        card.style.backgroundImage = preset.preview;
      } else {
        card.style.backgroundImage = `url("${preset.preview}")`;
      }

      const label = document.createElement('span');
      label.textContent = preset.name;
      card.appendChild(label);

      card.addEventListener('click', async () => {
        const updated = {
          wallpaperType: preset.type,
          wallpaperValue: preset.value,
          presetId: preset.id
        };
        await saveSettings(updated);
        const full = await getSettings();
        renderWallpaper(full);
        showStatus(`Applied ${preset.name}`);
      });

      presetGrid.appendChild(card);
    });
  }

  async function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      showStatus('Please choose an image file');
      return;
    }
    try {
      showStatus('Loading image...');
      const dataUrl = await readFileAsDataURL(file);
      await saveSettings({
        wallpaperType: 'data',
        wallpaperValue: dataUrl,
        presetId: null
      });
      const full = await getSettings();
      renderWallpaper(full);
      showStatus('Wallpaper updated!');
    } catch (e) {
      console.error('Failed to read image file:', e);
      showStatus('Error loading image');
    }
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  applyUrlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    await saveSettings({
      wallpaperType: 'url',
      wallpaperValue: url,
      presetId: null
    });
    const full = await getSettings();
    renderWallpaper(full);
    urlInput.value = '';
    showStatus('Custom URL applied!');
  });

  dimSlider.addEventListener('input', async (e) => {
    const dimLevel = Number(e.target.value);
    dimVal.textContent = `${dimLevel}%`;
    wallpaperOverlay.style.background = `rgba(2, 6, 23, ${dimLevel / 100})`;
    await saveSettings({ dimLevel });
  });

  blurSlider.addEventListener('input', async (e) => {
    const blurLevel = Number(e.target.value);
    blurVal.textContent = `${blurLevel}px`;
    wallpaperLayer.style.filter = `blur(${blurLevel}px)`;
    await saveSettings({ blurLevel });
  });

  fitBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const fitMode = btn.dataset.fit;
      await saveSettings({ fitMode });
      const full = await getSettings();
      renderWallpaper(full);
    });
  });

  resetBtn.addEventListener('click', async () => {
    await saveSettings(DEFAULT_SETTINGS);
    const full = await getSettings();
    renderWallpaper(full);
    showStatus('Reset to default');
  });

  openBtn.addEventListener('click', () => {
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
  });

  closeBtn.addEventListener('click', () => {
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-hidden', 'true');
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(async () => {
      const updated = await getSettings();
      renderWallpaper(updated);
    });
  }

  const initialSettings = await getSettings();
  buildPresets(initialSettings.presetId);
  renderWallpaper(initialSettings);
});

