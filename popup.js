document.addEventListener('DOMContentLoaded', async () => {
  const fileInput = document.getElementById('popup-file-input');
  const urlInput = document.getElementById('popup-url-input');
  const applyUrlBtn = document.getElementById('popup-apply-url');
  const presetGrid = document.getElementById('popup-preset-grid');
  const dimSlider = document.getElementById('popup-dim-slider');
  const dimVal = document.getElementById('popup-dim-val');
  const statusEl = document.getElementById('popup-status');
  const resetBtn = document.getElementById('popup-reset');
  const openNewTabBtn = document.getElementById('open-newtab-btn');

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function renderUI(settings) {
    dimSlider.value = settings.dimLevel ?? 25;
    dimVal.textContent = `${settings.dimLevel ?? 25}%`;

    document.querySelectorAll('.preset-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.id === settings.presetId);
    });
  }

  function initPresets(activeId) {
    presetGrid.innerHTML = '';
    PRESETS.forEach((preset) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `preset-item ${preset.id === activeId ? 'active' : ''}`;
      btn.dataset.id = preset.id;

      if (preset.type === 'css') {
        btn.style.backgroundImage = preset.preview;
      } else {
        btn.style.backgroundImage = `url("${preset.preview}")`;
      }

      const span = document.createElement('span');
      span.textContent = preset.name;
      btn.appendChild(span);

      btn.addEventListener('click', async () => {
        await saveSettings({
          wallpaperType: preset.type,
          wallpaperValue: preset.value,
          presetId: preset.id
        });
        const current = await getSettings();
        renderUI(current);
        setStatus(`Applied ${preset.name}`);
      });

      presetGrid.appendChild(btn);
    });
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setStatus('Uploading image...');
    try {
      const dataUrl = await readFileAsDataURL(file);
      await saveSettings({
        wallpaperType: 'data',
        wallpaperValue: dataUrl,
        presetId: null
      });
      const current = await getSettings();
      renderUI(current);
      setStatus('Custom image saved!');
    } catch (err) {
      console.error(err);
      setStatus('Failed to load image');
    }
  });

  applyUrlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    await saveSettings({
      wallpaperType: 'url',
      wallpaperValue: url,
      presetId: null
    });
    urlInput.value = '';
    const current = await getSettings();
    renderUI(current);
    setStatus('Image URL saved!');
  });

  dimSlider.addEventListener('input', async (e) => {
    const dimLevel = Number(e.target.value);
    dimVal.textContent = `${dimLevel}%`;
    await saveSettings({ dimLevel });
    setStatus('Updated dim level');
  });

  resetBtn.addEventListener('click', async () => {
    await saveSettings(DEFAULT_SETTINGS);
    const current = await getSettings();
    renderUI(current);
    setStatus('Reset to default');
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

