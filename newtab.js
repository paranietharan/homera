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

  let statusTimer = null;

  function showStatus(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.classList.toggle('error', Boolean(isError));
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      if (statusMsg.textContent === text) {
        statusMsg.textContent = '';
        statusMsg.classList.remove('error');
      }
    }, 3000);
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

  function renderWallpaper(rawSettings) {
    const settings = sanitizeSettings(rawSettings);

    if (settings.wallpaperType === 'css') {
      wallpaperLayer.style.backgroundImage = settings.wallpaperValue;
    } else {
      const safeCssUrl = toSafeCssUrl(settings.wallpaperValue);
      wallpaperLayer.style.backgroundImage = safeCssUrl || DEFAULT_SETTINGS.wallpaperValue;
    }

    wallpaperLayer.style.backgroundSize = settings.fitMode;
    wallpaperLayer.style.filter = `blur(${settings.blurLevel}px)`;
    wallpaperOverlay.style.background = `rgba(2, 6, 23, ${settings.dimLevel / 100})`;

    dimSlider.value = String(settings.dimLevel);
    dimVal.textContent = `${settings.dimLevel}%`;

    blurSlider.value = String(settings.blurLevel);
    blurVal.textContent = `${settings.blurLevel}px`;

    fitBtns.forEach((btn) => {
      const isActive = btn.dataset.fit === settings.fitMode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    document.querySelectorAll('.preset-card').forEach((card) => {
      const isActive = card.dataset.id === settings.presetId;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-pressed', String(isActive));
    });
  }

  function buildPresets(activePresetId) {
    presetGrid.textContent = '';
    PRESETS.forEach((preset) => {
      const card = document.createElement('button');
      card.type = 'button';
      const isActive = preset.id === activePresetId;
      card.className = `preset-card ${isActive ? 'active' : ''}`;
      card.dataset.id = preset.id;
      card.setAttribute('aria-pressed', String(isActive));
      card.title =
        preset.source === 'local'
          ? `${preset.name} (Local gradient — offline)`
          : `${preset.name} (Remote HTTPS image)`;

      if (preset.type === 'css') {
        card.style.backgroundImage = preset.preview;
      } else {
        const safePreview = toSafeCssUrl(preset.preview);
        if (safePreview) card.style.backgroundImage = safePreview;
      }

      const label = document.createElement('span');
      label.textContent = preset.name;
      card.appendChild(label);

      card.addEventListener('click', async () => {
        try {
          const full = await saveSettings({
            wallpaperType: preset.type,
            wallpaperValue: preset.value,
            presetId: preset.id
          });
          renderWallpaper(full);
          showStatus(`Applied ${preset.name}`);
        } catch (err) {
          showStatus(err.message || 'Failed to apply preset', true);
        }
      });

      presetGrid.appendChild(card);
    });
  }

  async function handleFileSelect(file) {
    const fileCheck = validateImageFile(file);
    if (!fileCheck.valid) {
      showStatus(fileCheck.error || 'Invalid image file', true);
      return;
    }
    try {
      showStatus('Loading image...');
      const dataUrl = await readFileAsDataURL(file);
      const full = await saveSettings({
        wallpaperType: 'data',
        wallpaperValue: dataUrl,
        presetId: null
      });
      renderWallpaper(full);
      showStatus('Wallpaper updated!');
    } catch (err) {
      console.error('Failed to read or save image file:', err);
      showStatus(err.message || 'Error loading image', true);
    }
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFileSelect(file);
    fileInput.value = '';
  });

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
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
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  async function applyCustomUrl() {
    const check = validateWallpaperUrl(urlInput.value);
    if (!check.valid || !check.value) {
      showStatus(check.error || 'Invalid HTTPS URL', true);
      return;
    }
    try {
      const full = await saveSettings({
        wallpaperType: 'url',
        wallpaperValue: check.value,
        presetId: null
      });
      renderWallpaper(full);
      urlInput.value = '';
      showStatus('Custom URL applied!');
    } catch (err) {
      showStatus(err.message || 'Failed to save URL', true);
    }
  }

  applyUrlBtn.addEventListener('click', applyCustomUrl);
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustomUrl();
    }
  });

  dimSlider.addEventListener('input', async (e) => {
    const dimLevel = Number(e.target.value);
    dimVal.textContent = `${dimLevel}%`;
    wallpaperOverlay.style.background = `rgba(2, 6, 23, ${dimLevel / 100})`;
    try {
      await saveSettings({ dimLevel });
    } catch (err) {
      showStatus(err.message || 'Failed to save dim level', true);
    }
  });

  blurSlider.addEventListener('input', async (e) => {
    const blurLevel = Number(e.target.value);
    blurVal.textContent = `${blurLevel}px`;
    wallpaperLayer.style.filter = `blur(${blurLevel}px)`;
    try {
      await saveSettings({ blurLevel });
    } catch (err) {
      showStatus(err.message || 'Failed to save blur level', true);
    }
  });

  fitBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const fitMode = btn.dataset.fit;
      try {
        const full = await saveSettings({ fitMode });
        renderWallpaper(full);
      } catch (err) {
        showStatus(err.message || 'Failed to save fit mode', true);
      }
    });
  });

  resetBtn.addEventListener('click', async () => {
    try {
      const full = await resetSettings();
      renderWallpaper(full);
      showStatus('Reset to default');
    } catch (err) {
      showStatus(err.message || 'Failed to reset settings', true);
    }
  });

  function setDrawerOpen(isOpen) {
    drawer.classList.toggle('hidden', !isOpen);
    drawer.setAttribute('aria-hidden', String(!isOpen));
    openBtn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      closeBtn.focus();
    } else {
      openBtn.focus();
    }
  }

  openBtn.addEventListener('click', () => setDrawerOpen(true));
  closeBtn.addEventListener('click', () => setDrawerOpen(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
      setDrawerOpen(false);
    }
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
