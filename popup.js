document.addEventListener('DOMContentLoaded', async () => {
  const fileInput = document.getElementById('popup-file-input');
  const dropZone = document.getElementById('popup-drop-zone');
  const presetGrid = document.getElementById('popup-preset-grid');
  const dimSlider = document.getElementById('popup-dim-slider');
  const dimVal = document.getElementById('popup-dim-val');
  const statusEl = document.getElementById('popup-status');
  const resetBtn = document.getElementById('popup-reset');
  const openNewTabBtn = document.getElementById('open-newtab-btn');

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', Boolean(isError));
  }

  function renderUI(rawSettings) {
    const settings = sanitizeSettings(rawSettings);
    dimSlider.value = String(settings.dimLevel);
    dimVal.textContent = `${settings.dimLevel}%`;

    document.querySelectorAll('.preset-item').forEach((item) => {
      const isActive = item.dataset.id === settings.presetId;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
  }

  function initPresets(activeId) {
    presetGrid.textContent = '';
    PRESETS.forEach((preset) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = preset.id === activeId;
      btn.className = `preset-item ${isActive ? 'active' : ''}`;
      btn.dataset.id = preset.id;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.title =
        preset.type === 'css'
          ? `${preset.name} (Local gradient — offline)`
          : `${preset.name} (Bundled photo — offline)`;

      if (preset.type === 'css') {
        btn.style.backgroundImage = preset.preview;
      } else {
        const safePreview = toSafeCssUrl(preset.preview);
        if (safePreview) btn.style.backgroundImage = safePreview;
      }

      const span = document.createElement('span');
      span.textContent = preset.name;
      btn.appendChild(span);

      btn.addEventListener('click', async () => {
        try {
          const current = await saveSettings({
            wallpaperType: preset.type,
            wallpaperValue: preset.value,
            presetId: preset.id
          });
          renderUI(current);
          setStatus(`Applied ${preset.name}`);
        } catch (err) {
          setStatus(err.message || 'Failed to apply preset', true);
        }
      });

      presetGrid.appendChild(btn);
    });
  }

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    fileInput.value = '';
    const check = validateImageFile(file);
    if (!check.valid) {
      setStatus(check.error || 'Invalid image file', true);
      return;
    }
    setStatus('Uploading image...');
    try {
      const dataUrl = await readFileAsDataURL(file);
      const current = await saveSettings({
        wallpaperType: 'data',
        wallpaperValue: dataUrl,
        presetId: null
      });
      renderUI(current);
      setStatus('Custom image saved!');
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'Failed to load image', true);
    }
  });

  dimSlider.addEventListener('input', async (e) => {
    const dimLevel = Number(e.target.value);
    dimVal.textContent = `${dimLevel}%`;
    try {
      await saveSettings({ dimLevel });
      setStatus('Updated dim level');
    } catch (err) {
      setStatus(err.message || 'Failed to update dim level', true);
    }
  });

  resetBtn.addEventListener('click', async () => {
    try {
      const current = await resetSettings();
      renderUI(current);
      setStatus('Reset to default');
    } catch (err) {
      setStatus(err.message || 'Failed to reset settings', true);
    }
  });

  openNewTabBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'chrome://newtab' });
    } else {
      window.open('newtab.html', '_blank');
    }
  });

  const settings = await getSettings();
  initPresets(settings.presetId);
  renderUI(settings);
});
