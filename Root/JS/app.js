/**
 * WCode Web App - Controller & UX Logic
 * Native Vanilla ES6+ - Zero External Frameworks
 */
(function() {
  'use strict';

  // State
  const state = {
    mode: 'encode', // 'encode' | 'decode'
    type: 'auto',   // 'auto' | 'text' | 'number' | 'phone' | 'email' | 'location' | 'url' | 'date' | 'time'
    checksum: false,
    theme: localStorage.getItem('cutie-dark-mode') || localStorage.getItem('wcode_theme') || 'system',
    saved: JSON.parse(localStorage.getItem('wcode_saved') || '[]'),
    core: null
  };

  // DOM Elements
  const DOM = {};

  function initDOM() {
    DOM.modeTabs = document.querySelectorAll('.mode-tab');
    DOM.typePills = document.querySelectorAll('.type-pill');
    DOM.studioCard = document.getElementById('studio-card');
    DOM.inputHeaderLabel = document.getElementById('input-header-label');
    
    // Inputs
    DOM.encodeView = document.getElementById('encode-input-view');
    DOM.decodeView = document.getElementById('decode-input-view');
    DOM.encodeInput = document.getElementById('encode-input');
    DOM.decodeInput = document.getElementById('decode-input');
    DOM.phoneGroup = document.getElementById('phone-group');
    DOM.countryCode = document.getElementById('country-code');
    DOM.suggestionsBox = document.getElementById('suggestions-box');
    
    // Action Buttons
    DOM.actionBtn = document.getElementById('action-btn-main');
    DOM.actionBtnText = document.getElementById('action-btn-text');
    DOM.checksumToggle = document.getElementById('checksum-toggle');
    DOM.pasteBtn = document.getElementById('btn-paste');
    DOM.clearBtn = document.getElementById('btn-clear');
    DOM.helperBtn = document.getElementById('btn-helper');
    
    // Output Section
    DOM.outputSection = document.getElementById('output-section');
    DOM.outputBadge = document.getElementById('output-badge');
    DOM.encodeOutputView = document.getElementById('encode-output-view');
    DOM.decodeOutputView = document.getElementById('decode-output-view');
    DOM.heroDisplay = document.getElementById('wcode-hero-display');
    DOM.outputStats = document.getElementById('output-stats');
    DOM.decodedText = document.getElementById('decoded-text');
    DOM.decodedMetaActions = document.getElementById('decoded-meta-actions');
    
    // Output Toolbar
    DOM.copyBtn = document.getElementById('tool-copy');
    DOM.shareBtn = document.getElementById('tool-share');
    DOM.speakBtn = document.getElementById('tool-speak');
    DOM.saveBtn = document.getElementById('tool-save');
    DOM.swapBtn = document.getElementById('tool-swap');
    
    // Theme & Drawer & Modal
    DOM.darkModeBtn = document.getElementById('darkmode-button');
    DOM.themeMenu = document.getElementById('theme-menu');
    DOM.themeOptions = document.querySelectorAll('.theme-option');
    DOM.themeSelector = document.getElementById('theme-selector');
    DOM.drawerBtn = document.getElementById('drawer-toggle-btn');
    DOM.drawerBadge = document.getElementById('drawer-badge');
    DOM.drawer = document.getElementById('history-drawer');
    DOM.drawerClose = document.getElementById('drawer-close');
    DOM.drawerBody = document.getElementById('drawer-body');
    DOM.drawerClearAll = document.getElementById('drawer-clear-all');
    DOM.infoBtn = document.getElementById('info-modal-btn');
    DOM.infoModal = document.getElementById('info-modal');
    DOM.modalClose = document.getElementById('modal-close');
    DOM.toastContainer = document.getElementById('toast-container');
  }

  // Type Configuration Definitions
  const TYPE_CONFIG = {
    auto: {
      label: 'Data to encode',
      placeholder: 'Type or paste any text, number, email, URL, phone, or location...',
      helper: null
    },
    text: {
      label: 'Text message',
      placeholder: 'Enter a sentence, phrase or message...',
      helper: null
    },
    number: {
      label: 'Numeric code or ID',
      placeholder: 'Enter an integer (e.g. 2025550123)...',
      helper: null
    },
    phone: {
      label: 'Phone number',
      placeholder: 'e.g. 2025550123',
      helper: null
    },
    email: {
      label: 'Email address',
      placeholder: 'e.g. user@example.com',
      helper: null
    },
    location: {
      label: 'GPS Coordinates (Lat, Lng)',
      placeholder: 'e.g. 37.7749, -122.4194',
      helper: { label: 'My GPS', icon: 'gps', action: fetchCurrentLocation }
    },
    url: {
      label: 'Web Link (URL)',
      placeholder: 'e.g. https://wcodes.org',
      helper: null
    },
    date: {
      label: 'Date (YYYY-MM-DD)',
      placeholder: 'e.g. 2026-10-01',
      helper: { label: 'Today', icon: 'calendar', action: setTodayDate }
    },
    time: {
      label: 'Time (HH:MM:SS)',
      placeholder: 'e.g. 14:30:00',
      helper: { label: 'Now', icon: 'clock', action: setNowTime }
    }
  };

  function initApp() {
    initDOM();

    // Initialize WCode Core engine
    if (window.WCode && window.WCodeDictionary) {
      state.core = new window.WCode.Core(window.WCodeDictionary, { checksum: state.checksum });
    } else {
      showToast('Error initializing WCode engine', 'error');
      return;
    }

    // Bind event listeners
    bindEvents();

    // Apply theme
    applyTheme(state.theme);

    // Update UI elements to match initial state
    updateTypeUI();
    updateModeUI();
    updateHistoryBadge();

    // URL parameter support: e.g. /?encode=hello or /?decode=cat+apple+mango
    handleUrlParams();
  }

  function bindEvents() {
    // Mode Switching
    DOM.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        setMode(tab.dataset.mode);
      });
    });

    // Type Switching
    DOM.typePills.forEach(pill => {
      pill.addEventListener('click', () => {
        setType(pill.dataset.type);
      });
    });

    // Checksum toggle
    DOM.checksumToggle.addEventListener('change', (e) => {
      state.checksum = e.target.checked;
      state.core.setChecksum(state.checksum);
      executeTransform();
    });

    // Main action button
    DOM.actionBtn.addEventListener('click', () => {
      executeTransform(true);
    });

    // Input handlers
    DOM.encodeInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeTransform(true);
      }
    });

    DOM.decodeInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeTransform(true);
      }
    });

    DOM.decodeInput.addEventListener('input', () => {
      handleDecodeSuggestions();
    });

    // Quick helpers
    DOM.clearBtn.addEventListener('click', () => {
      if (state.mode === 'encode') {
        DOM.encodeInput.value = '';
        DOM.encodeInput.focus();
      } else {
        DOM.decodeInput.value = '';
        DOM.suggestionsBox.innerHTML = '';
        DOM.decodeInput.focus();
      }
      DOM.outputSection.style.display = 'none';
    });

    DOM.pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (state.mode === 'encode') {
          DOM.encodeInput.value = text;
        } else {
          DOM.decodeInput.value = text.replace(/^[\s\\/\-]+|[\s\\/\-]+$/g, '').trim();
        }
        executeTransform(true);
        showToast('Pasted from clipboard');
      } catch (err) {
        showToast('Unable to access clipboard', 'error');
      }
    });

    // Output Toolbar actions
    DOM.copyBtn.addEventListener('click', copyResult);
    DOM.shareBtn.addEventListener('click', shareResult);
    DOM.speakBtn.addEventListener('click', speakResult);
    DOM.saveBtn.addEventListener('click', saveResult);
    DOM.swapBtn.addEventListener('click', swapMode);

    // Traditional Theme Selector
    if (DOM.darkModeBtn && DOM.themeMenu) {
      DOM.darkModeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !DOM.themeMenu.hidden;
        DOM.themeMenu.hidden = isOpen;
        DOM.darkModeBtn.setAttribute('aria-expanded', String(!isOpen));
      });

      DOM.darkModeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          DOM.themeMenu.hidden = false;
          DOM.darkModeBtn.setAttribute('aria-expanded', 'true');
          const firstOption = DOM.themeMenu.querySelector('.theme-option');
          if (firstOption) firstOption.focus();
        }
      });

      DOM.themeMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          DOM.themeMenu.hidden = true;
          DOM.darkModeBtn.setAttribute('aria-expanded', 'false');
          DOM.darkModeBtn.focus();
        }
      });

      if (DOM.themeOptions) {
        DOM.themeOptions.forEach(opt => {
          opt.addEventListener('click', () => {
            const theme = opt.getAttribute('data-theme');
            applyTheme(theme);
            DOM.themeMenu.hidden = true;
            DOM.darkModeBtn.setAttribute('aria-expanded', 'false');
            DOM.darkModeBtn.focus();
          });
        });
      }

      document.addEventListener('click', (e) => {
        if (DOM.themeSelector && !DOM.themeSelector.contains(e.target)) {
          DOM.themeMenu.hidden = true;
          DOM.darkModeBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Drawer toggle
    DOM.drawerBtn.addEventListener('click', () => openDrawer(true));
    DOM.drawerClose.addEventListener('click', () => openDrawer(false));
    DOM.drawer.addEventListener('click', (e) => {
      if (e.target === DOM.drawer) openDrawer(false);
    });
    DOM.drawerClearAll.addEventListener('click', clearAllHistory);

    // Info Modal
    DOM.infoBtn.addEventListener('click', () => openModal(true));
    DOM.modalClose.addEventListener('click', () => openModal(false));
    DOM.infoModal.addEventListener('click', (e) => {
      if (e.target === DOM.infoModal) openModal(false);
    });

    // Keyboard escape to close modals/drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        openDrawer(false);
        openModal(false);
      }
    });
  }

  function setMode(newMode) {
    if (state.mode === newMode) return;
    state.mode = newMode;
    updateModeUI();
    DOM.outputSection.style.display = 'none';
  }

  function updateModeUI() {
    DOM.modeTabs.forEach(tab => {
      const active = tab.dataset.mode === state.mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active);
    });

    if (state.mode === 'encode') {
      DOM.encodeView.style.display = 'block';
      DOM.decodeView.style.display = 'none';
      DOM.actionBtnText.textContent = 'Encode to WCode';
      DOM.inputHeaderLabel.textContent = TYPE_CONFIG[state.type].label;
      setTimeout(() => DOM.encodeInput.focus(), 50);
    } else {
      DOM.encodeView.style.display = 'none';
      DOM.decodeView.style.display = 'block';
      DOM.actionBtnText.textContent = 'Decode WCode';
      DOM.inputHeaderLabel.textContent = 'WCode words';
      setTimeout(() => DOM.decodeInput.focus(), 50);
    }
  }

  function setType(newType) {
    state.type = newType;
    DOM.typePills.forEach(pill => {
      const active = pill.dataset.type === newType;
      pill.classList.toggle('active', active);
      pill.setAttribute('aria-checked', active);
    });
    updateTypeUI();
  }

  function updateTypeUI() {
    const cfg = TYPE_CONFIG[state.type];
    if (state.mode === 'encode') {
      DOM.inputHeaderLabel.textContent = cfg.label;
    }
    DOM.encodeInput.placeholder = cfg.placeholder;

    // Phone country code visibility
    DOM.phoneGroup.style.display = (state.type === 'phone' && state.mode === 'encode') ? 'flex' : 'none';

    // Helper button (e.g. GPS, Today, Now)
    if (cfg.helper && state.mode === 'encode') {
      DOM.helperBtn.style.display = 'inline-flex';
      DOM.helperBtn.textContent = cfg.helper.label;
      DOM.helperBtn.onclick = cfg.helper.action;
    } else {
      DOM.helperBtn.style.display = 'none';
    }
  }

  // Type helper functions
  function fetchCurrentLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    DOM.helperBtn.textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        DOM.encodeInput.value = `${lat}, ${lng}`;
        DOM.helperBtn.textContent = 'My GPS';
        showToast(`Located: ${lat}, ${lng}`);
        executeTransform(true);
      },
      (err) => {
        DOM.helperBtn.textContent = 'My GPS';
        showToast('Location permission denied or unavailable', 'error');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    DOM.encodeInput.value = today;
    executeTransform(true);
  }

  function setNowTime() {
    const now = new Date().toTimeString().split(' ')[0];
    DOM.encodeInput.value = now;
    executeTransform(true);
  }

  // Autocomplete / Suggestions for Decode Mode
  function handleDecodeSuggestions() {
    const text = DOM.decodeInput.value.replace(/^[\s\\/\-]+|[\s\\/\-]+$/g, '');
    const tokens = text.toLowerCase().split(/\s+/);
    const lastToken = tokens[tokens.length - 1];

    if (!lastToken || lastToken.length < 1) {
      DOM.suggestionsBox.innerHTML = '';
      return;
    }

    const suggestions = window.WCodeDictionary.suggest(lastToken, 8);
    if (suggestions.length === 0) {
      DOM.suggestionsBox.innerHTML = '<span class="suggestions-hint">No matching dictionary word</span>';
      return;
    }

    DOM.suggestionsBox.innerHTML = '';
    suggestions.forEach(word => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggestion-chip';
      
      const prefix = word.substring(0, lastToken.length);
      const rest = word.substring(lastToken.length);
      chip.innerHTML = `<mark>${prefix}</mark>${rest}`;

      chip.addEventListener('click', () => {
        tokens[tokens.length - 1] = word;
        DOM.decodeInput.value = tokens.join(' ') + ' ';
        DOM.suggestionsBox.innerHTML = '';
        DOM.decodeInput.focus();
        // Check if full code can be decoded
        if (tokens.length >= 3) {
          executeTransform(false);
        }
      });

      DOM.suggestionsBox.appendChild(chip);
    });
  }

  // Execution: Encode or Decode
  function executeTransform(showErrorToast = true) {
    if (!state.core) return;

    if (state.mode === 'encode') {
      let rawInput = DOM.encodeInput.value.trim();
      if (!rawInput) {
        if (showErrorToast) showToast('Please enter data to encode', 'warning');
        return;
      }

      if (state.type === 'phone') {
        const cc = DOM.countryCode.value.replace(/[^\d]/g, '');
        if (cc && !rawInput.startsWith(cc)) {
          rawInput = cc + rawInput;
        }
      }

      try {
        const res = state.core.encodeByType(state.type, rawInput);
        renderEncodeOutput(res);
      } catch (err) {
        if (showErrorToast) showToast(err.message, 'error');
      }
    } else {
      const rawWords = DOM.decodeInput.value.replace(/^[\s\\/\-]+|[\s\\/\-]+$/g, '').trim();
      if (!rawWords) {
        if (showErrorToast) showToast('Please enter WCode words to decode', 'warning');
        return;
      }

      try {
        const res = state.core.decodeByType(state.type, rawWords);
        renderDecodeOutput(res);
      } catch (err) {
        if (showErrorToast) showToast(err.message, 'error');
      }
    }
  }

  function renderEncodeOutput(res) {
    DOM.outputSection.style.display = 'block';
    DOM.encodeOutputView.style.display = 'block';
    DOM.decodeOutputView.style.display = 'none';

    DOM.outputBadge.textContent = `${res.wordCount} words • Base-1024`;
    DOM.heroDisplay.innerHTML = `<span class="hero-slash">\\</span>`;
    
    res.words.forEach(word => {
      const pill = document.createElement('span');
      pill.className = 'wcode-word-pill';
      pill.textContent = word;
      pill.title = 'Click to speak word';
      pill.addEventListener('click', () => speakWord(word));
      DOM.heroDisplay.appendChild(pill);
    });

    DOM.heroDisplay.innerHTML += `<span class="hero-slash">/</span>`;
    DOM.outputStats.textContent = `${res.bitCount} bits encoded • ${res.hasChecksum ? 'CRC-8 Verified' : 'Standard'}`;
    
    state.currentResult = {
      mode: 'encode',
      type: res.type,
      input: res.input,
      wcode: res.message,
      formatted: res.formatted
    };

    DOM.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderDecodeOutput(res) {
    DOM.outputSection.style.display = 'block';
    DOM.encodeOutputView.style.display = 'none';
    DOM.decodeOutputView.style.display = 'block';

    DOM.outputBadge.textContent = `Decoded ${res.type.toUpperCase()}`;
    DOM.decodedText.textContent = res.data;

    // Type-specific action links
    DOM.decodedMetaActions.innerHTML = '';
    if (res.type === 'phone') {
      const callLink = document.createElement('a');
      callLink.href = `tel:${res.data}`;
      callLink.className = 'action-link-btn';
      callLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z"/></svg>Call Phone`;
      DOM.decodedMetaActions.appendChild(callLink);

      const smsLink = document.createElement('a');
      smsLink.href = `sms:${res.data}`;
      smsLink.className = 'action-link-btn';
      smsLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>Send SMS`;
      DOM.decodedMetaActions.appendChild(smsLink);
    } else if (res.type === 'url') {
      let href = res.data;
      if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
      const openLink = document.createElement('a');
      openLink.href = href;
      openLink.target = '_blank';
      openLink.rel = 'noopener noreferrer';
      openLink.className = 'action-link-btn';
      openLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>Open URL`;
      DOM.decodedMetaActions.appendChild(openLink);
    } else if (res.type === 'email') {
      const mailLink = document.createElement('a');
      mailLink.href = `mailto:${res.data}`;
      mailLink.className = 'action-link-btn';
      mailLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Send Email`;
      DOM.decodedMetaActions.appendChild(mailLink);
    } else if (res.type === 'location') {
      const coords = res.data.replace(/\s+/g, '');
      const mapLink = document.createElement('a');
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
      mapLink.target = '_blank';
      mapLink.rel = 'noopener noreferrer';
      mapLink.className = 'action-link-btn';
      mapLink.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>View on Google Maps`;
      DOM.decodedMetaActions.appendChild(mapLink);
    }

    state.currentResult = {
      mode: 'decode',
      type: res.type,
      input: DOM.decodeInput.value.trim(),
      wcode: DOM.decodeInput.value.trim(),
      data: res.data
    };

    DOM.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Action Bar Handlers
  async function copyResult() {
    if (!state.currentResult) return;
    const textToCopy = state.mode === 'encode' 
      ? state.currentResult.formatted 
      : state.currentResult.data;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Copy failed', 'error');
    }
  }

  async function shareResult() {
    if (!state.currentResult) return;
    const title = state.mode === 'encode' ? 'WCode' : 'Decoded Data';
    const text = state.mode === 'encode'
      ? `WCode: ${state.currentResult.formatted}`
      : `WCode Decoded: ${state.currentResult.data}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: window.location.href });
      } catch (err) {
        // User cancelled or aborted
      }
    } else {
      copyResult();
      showToast('Sharing not supported on this browser; copied to clipboard');
    }
  }

  function speakResult() {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported', 'warning');
      return;
    }
    const textToSpeak = state.mode === 'encode'
      ? state.currentResult.wcode
      : state.currentResult.data;
    
    speakWord(textToSpeak);
  }

  function speakWord(words) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(words);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function saveResult() {
    if (!state.currentResult) return;
    const item = {
      id: Date.now(),
      timestamp: Date.now(),
      type: state.currentResult.type,
      mode: state.mode,
      wcode: state.currentResult.wcode,
      data: state.mode === 'encode' ? state.currentResult.input : state.currentResult.data
    };

    // Prevent duplicates
    const exists = state.saved.some(s => s.wcode === item.wcode && s.data === item.data);
    if (exists) {
      showToast('Item already saved');
      return;
    }

    state.saved.unshift(item);
    if (state.saved.length > 50) state.saved.pop();
    localStorage.setItem('wcode_saved', JSON.stringify(state.saved));
    updateHistoryBadge();
    showToast('Saved to history!');
  }

  function swapMode() {
    if (!state.currentResult) return;
    if (state.mode === 'encode') {
      const words = state.currentResult.wcode;
      const type = state.currentResult.type || 'auto';
      setMode('decode');
      setType(type);
      DOM.decodeInput.value = words;
      executeTransform(true);
    } else {
      const data = state.currentResult.data;
      const type = state.currentResult.type || 'auto';
      setMode('encode');
      setType(type);
      DOM.encodeInput.value = data;
      executeTransform(true);
    }
  }

  // History Drawer Functions
  function openDrawer(open) {
    DOM.drawer.classList.toggle('open', open);
    if (open) {
      renderHistoryList();
    }
  }

  function updateHistoryBadge() {
    const count = state.saved.length;
    DOM.drawerBadge.textContent = count;
    DOM.drawerBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  function renderHistoryList() {
    if (state.saved.length === 0) {
      DOM.drawerBody.innerHTML = `
        <div class="drawer-empty">
          <p>No saved codes yet.</p>
          <p style="font-size:0.8rem;margin-top:6px;">Encoded or decoded WCodes you save will appear here.</p>
        </div>`;
      return;
    }

    DOM.drawerBody.innerHTML = '';
    state.saved.forEach(item => {
      const card = document.createElement('div');
      card.className = 'saved-card';
      
      const timeStr = formatRelativeTime(item.timestamp);
      card.innerHTML = `
        <div class="saved-card-header">
          <span class="saved-type-tag">${item.type}</span>
          <span>${timeStr}</span>
        </div>
        <div class="saved-wcode">\\ ${item.wcode} /</div>
        <div class="saved-data">${escapeHtml(item.data)}</div>
        <div class="saved-actions">
          <button type="button" class="sub-btn restore-btn" title="Load into studio">Load</button>
          <button type="button" class="sub-btn copy-btn" title="Copy WCode">Copy</button>
          <button type="button" class="sub-btn delete-btn" title="Delete">Delete</button>
        </div>
      `;

      card.querySelector('.restore-btn').addEventListener('click', () => {
        setMode('decode');
        DOM.decodeInput.value = item.wcode;
        openDrawer(false);
        executeTransform(true);
      });

      card.querySelector('.copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(`\\ ${item.wcode} /`);
        showToast('WCode copied!');
      });

      card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteHistoryItem(item.id);
      });

      DOM.drawerBody.appendChild(card);
    });
  }

  function deleteHistoryItem(id) {
    state.saved = state.saved.filter(s => s.id !== id);
    localStorage.setItem('wcode_saved', JSON.stringify(state.saved));
    updateHistoryBadge();
    renderHistoryList();
    showToast('Deleted item');
  }

  function clearAllHistory() {
    if (state.saved.length === 0) return;
    if (confirm('Clear all saved WCode history?')) {
      state.saved = [];
      localStorage.removeItem('wcode_saved');
      updateHistoryBadge();
      renderHistoryList();
      showToast('History cleared');
    }
  }

  // Info Modal
  function openModal(open) {
    DOM.infoModal.classList.toggle('open', open);
  }

  // Theme Management
  function applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
      theme = 'system';
    }
    state.theme = theme;
    try {
      localStorage.setItem('cutie-dark-mode', theme);
      localStorage.setItem('wcode_theme', theme);
    } catch (e) {}

    let effective = theme;
    if (theme === 'system') {
      effective = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const isDark = effective === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.setAttribute('data-theme-preference', theme);
    document.documentElement.setAttribute('data-theme-resolved', effective);
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.style.colorScheme = effective;

    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1a1a2e' : '#ffffff');
    }

    if (DOM.themeOptions) {
      DOM.themeOptions.forEach(opt => {
        const selected = opt.getAttribute('data-theme') === theme;
        opt.classList.toggle('theme-option-active', selected);
        opt.setAttribute('aria-checked', selected ? 'true' : 'false');
      });
    }

    if (DOM.darkModeBtn) {
      const prefLabel = theme.charAt(0).toUpperCase() + theme.slice(1);
      const resLabel = effective.charAt(0).toUpperCase() + effective.slice(1);
      const label = theme === 'system' ? `${prefLabel} (${resLabel})` : resLabel;
      DOM.darkModeBtn.setAttribute('aria-label', `Theme: ${label}`);
      DOM.darkModeBtn.setAttribute('title', `Theme: ${label}`);
    }
  }

  if (window.matchMedia) {
    const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (state.theme === 'system') applyTheme('system');
    };
    if (themeMediaQuery.addEventListener) {
      themeMediaQuery.addEventListener('change', handleSystemChange);
    } else if (themeMediaQuery.addListener) {
      themeMediaQuery.addListener(handleSystemChange);
    }
  }

  // Toast Notifications
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3100);
  }

  // URL Query Parameters support: /?wcode=cat+apple+mango
  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('encode')) {
      setMode('encode');
      DOM.encodeInput.value = params.get('encode');
      executeTransform(true);
    } else if (params.has('decode') || params.has('wcode')) {
      const code = params.get('decode') || params.get('wcode');
      setMode('decode');
      DOM.decodeInput.value = code.replace(/[\\\/]/g, ' ').trim();
      executeTransform(true);
    }
  }

  // Utility functions
  function formatRelativeTime(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
