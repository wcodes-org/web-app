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
    DOM.encodeInfoBtn = document.getElementById('encode-info-btn');
    DOM.decodedText = document.getElementById('decoded-text');
    DOM.decodedMetaActions = document.getElementById('decoded-meta-actions');
    
    // Output Toolbar
    DOM.copyBtn = document.getElementById('tool-copy');
    DOM.shareBtn = document.getElementById('tool-share');
    DOM.speakBtn = document.getElementById('tool-speak');
    DOM.saveBtn = document.getElementById('tool-save');
    DOM.swapBtn = document.getElementById('tool-swap');
    
    // Theme & Profile & Drawer & Modal
    DOM.profileBtn = document.getElementById('profile-button');
    DOM.profileMenu = document.getElementById('profile-menu');
    DOM.profileSelector = document.getElementById('profile-selector');
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
    DOM.infoVersionIndicator = document.getElementById('info_version_indicator');
    DOM.modalClose = document.getElementById('modal-close');
    DOM.infoFullCloseBtn = document.getElementById('info_full_close_button');
    DOM.linksModal = document.getElementById('links-modal');
    DOM.linksModalClose = document.getElementById('links-modal-close');
    DOM.footerAuthor = document.getElementById('footer_author');
    DOM.locationAlternate = document.getElementById('location-alternate');
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

  const TYPE_TITLES = {
    text: 'Text',
    number: 'Number',
    phone: 'Phone',
    email: 'Email',
    location: 'Location',
    url: 'URL',
    date: 'Date',
    time: 'Time'
  };

  function getTypeTitle(type) {
    if (!type) return 'Text';
    const key = String(type).toLowerCase();
    if (TYPE_TITLES[key]) return TYPE_TITLES[key];
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

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
    updateSwapButtonVisibility();
    updateHistoryBadge();

    // URL parameter support: e.g. /?encode=hello or /?decode=cat+apple+mango
    handleUrlParams();

    // Fill version stamps (Wolo parity)
    fillInfoVersionStamps();

    // Check if first visit/login (Wolo parity)
    checkFirstVisit();
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
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        DOM.actionBtn.focus();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeTransform(true);
      }
    });

    DOM.encodeInput.addEventListener('input', () => {
      updateSwapButtonVisibility();
    });

    DOM.decodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        DOM.actionBtn.focus();
        return;
      }
      if (((e.ctrlKey || e.metaKey) && e.key === 'Enter') || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        executeTransform(true);
      }
    });

    DOM.decodeInput.addEventListener('input', () => {
      handleDecodeSuggestions();
    });

    DOM.decodeInput.addEventListener('paste', (event) => {
      if (!event.clipboardData) return;
      event.preventDefault();
      const pastedWords = trimDecodeInput(event.clipboardData.getData('text/plain'));
      DOM.decodeInput.setRangeText(pastedWords, DOM.decodeInput.selectionStart, DOM.decodeInput.selectionEnd, 'end');
      const value = DOM.decodeInput.value;
      const caret = DOM.decodeInput.selectionStart;
      const leadingLength = value.length - value.replace(/^[\s\\/\-]+/, '').length;
      DOM.decodeInput.value = trimDecodeInput(value);
      const position = Math.max(0, Math.min(DOM.decodeInput.value.length, caret - leadingLength));
      DOM.decodeInput.setSelectionRange(position, position);
      updateDecodeInputHeight();
      DOM.suggestionsBox.innerHTML = '';
      const tokens = DOM.decodeInput.value.trim().split(/\s+/).filter(Boolean);
      if (tokens.length >= 3) {
        executeTransform(false);
      }
    });

    new ResizeObserver(updateDecodeInputHeight).observe(DOM.decodeInput);

    // Quick helpers
    DOM.clearBtn.addEventListener('click', () => {
      if (state.mode === 'encode') {
        DOM.encodeInput.value = '';
        updateSwapButtonVisibility();
        DOM.encodeInput.focus();
      } else {
        DOM.decodeInput.value = '';
        updateDecodeInputHeight();
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
          updateSwapButtonVisibility();
        } else {
          DOM.decodeInput.value = trimDecodeInput(text);
          updateDecodeInputHeight();
          DOM.suggestionsBox.innerHTML = '';
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

    // Profile & Theme Menu (Header Profile Button)
    if (DOM.profileBtn && DOM.profileMenu) {
      DOM.profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !DOM.profileMenu.hidden;
        DOM.profileMenu.hidden = isOpen;
        DOM.profileBtn.setAttribute('aria-expanded', String(!isOpen));
      });

      DOM.profileBtn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          DOM.profileMenu.hidden = false;
          DOM.profileBtn.setAttribute('aria-expanded', 'true');
          const firstOption = DOM.profileMenu.querySelector('.theme-option');
          if (firstOption) firstOption.focus();
        }
      });

      DOM.profileMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          DOM.profileMenu.hidden = true;
          DOM.profileBtn.setAttribute('aria-expanded', 'false');
          DOM.profileBtn.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (DOM.profileSelector && !DOM.profileSelector.contains(e.target)) {
          DOM.profileMenu.hidden = true;
          DOM.profileBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Theme Options Selection
    if (DOM.themeOptions) {
      DOM.themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const theme = opt.getAttribute('data-theme');
          applyTheme(theme);
          if (DOM.profileMenu) {
            DOM.profileMenu.hidden = true;
            if (DOM.profileBtn) DOM.profileBtn.setAttribute('aria-expanded', 'false');
          }
          if (DOM.themeMenu) {
            DOM.themeMenu.hidden = true;
            if (DOM.darkModeBtn) DOM.darkModeBtn.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }

    // Fallback if standalone darkModeBtn exists on page
    if (DOM.darkModeBtn && DOM.themeMenu) {
      DOM.darkModeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !DOM.themeMenu.hidden;
        DOM.themeMenu.hidden = isOpen;
        DOM.darkModeBtn.setAttribute('aria-expanded', String(!isOpen));
      });

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

    // Info Modal (App usage - Wolo parity)
    if (DOM.infoBtn) {
      DOM.infoBtn.addEventListener('click', () => showInfoModal(false));
    }
    if (DOM.modalClose) {
      DOM.modalClose.addEventListener('click', hideInfoModal);
    }
    if (DOM.infoFullCloseBtn) {
      DOM.infoFullCloseBtn.addEventListener('click', hideInfoModal);
    }
    if (DOM.infoVersionIndicator) {
      DOM.infoVersionIndicator.addEventListener('click', toggleInfoVersionDisplay);
      DOM.infoVersionIndicator.addEventListener('mouseenter', fillInfoVersionStamps);
      DOM.infoVersionIndicator.addEventListener('focus', fillInfoVersionStamps);
    }
    const introCloseBtn = document.getElementById('info_intro_close_button');
    if (introCloseBtn) {
      introCloseBtn.addEventListener('click', () => {
        try {
          localStorage.setItem('note_version', CURRENT_NOTE_VERSION);
          localStorage.setItem('wcode_note_version', CURRENT_NOTE_VERSION);
        } catch (e) {}
        hideInfoModal();
      });
    }
    if (DOM.infoModal) {
      DOM.infoModal.addEventListener('click', (e) => {
        const introSection = document.getElementById('info-intro');
        const isIntroActive = introSection && introSection.style.display !== 'none';
        if (!isIntroActive && e.target === DOM.infoModal) {
          hideInfoModal();
        }
      });
    }

    // Links & Credits Modal (Connected to 'WCode' in footer - Wolo parity)
    if (DOM.footerAuthor) {
      DOM.footerAuthor.addEventListener('click', showLinksModal);
      DOM.footerAuthor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showLinksModal();
        }
      });
    }
    if (DOM.linksModalClose) {
      DOM.linksModalClose.addEventListener('click', hideLinksModal);
    }
    if (DOM.linksModal) {
      DOM.linksModal.addEventListener('click', (e) => {
        if (e.target === DOM.linksModal) {
          hideLinksModal();
        }
      });
    }

    // Keyboard escape to close modals/drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        openDrawer(false);
        const introSection = document.getElementById('info-intro');
        const isIntroActive = introSection && introSection.style.display !== 'none';
        if (!isIntroActive) {
          hideInfoModal();
        }
        hideLinksModal();
      }
    });
  }

  function setMode(newMode) {
    if (state.mode === newMode) return;
    state.mode = newMode;
    updateModeUI();
    updateSwapButtonVisibility();
    DOM.suggestionsBox.innerHTML = '';
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
      DOM.inputHeaderLabel.textContent = 'WCode';
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

    // Dedicated location alternate app (Wolo Code) visibility
    if (DOM.locationAlternate) {
      DOM.locationAlternate.style.display = (state.type === 'location') ? 'block' : 'none';
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

  function trimDecodeInput(value) {
    return value.replace(/^[\s\\/\-]+|[\s\\/\-]+$/g, '');
  }

  function isLikelyWCode(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Direct format check: framed by slashes (e.g. \ words / or \words/)
    if (/^[\\\/].+[\\\/]$/.test(trimmed)) return true;

    // Token-based dictionary check
    const clean = trimmed
      .replace(/^[\s\\/\-]+|[\s\\/\-]+$/g, '')
      .replace(/[\\\/,;.–—\-]/g, ' ')
      .trim()
      .toLowerCase();
    const tokens = clean.split(/\s+/).filter(Boolean);

    // Need at least 2 tokens to suggest WCode sequence
    if (tokens.length < 2) return false;

    if (!state.core || !state.core.dict) return false;

    let validCount = 0;
    for (const token of tokens) {
      if (state.core.dict.isValid(token)) {
        validCount++;
      }
    }

    // If at least 2 words and >= 80% are in the WCode dictionary
    return validCount >= 2 && (validCount / tokens.length) >= 0.8;
  }

  function updateSwapButtonVisibility() {
    if (!DOM.swapBtn) return;
    if (state.mode === 'encode') {
      const isWCode = isLikelyWCode(DOM.encodeInput.value);
      DOM.swapBtn.classList.toggle('is-visible', isWCode);
    } else {
      DOM.swapBtn.classList.remove('is-visible');
    }
  }

  function updateDecodeInputHeight() {
    if (!DOM.decodeInput.clientWidth) return;
    DOM.decodeInput.style.height = 'auto';
    DOM.decodeInput.style.height = `${DOM.decodeInput.scrollHeight}px`;

    const styles = getComputedStyle(DOM.decodeInput);
    const lineHeight = parseFloat(styles.lineHeight);
    const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const lines = Math.max(1, Math.round((DOM.decodeInput.scrollHeight - padding) / lineHeight));
    DOM.decodeInput.parentElement.style.setProperty('--closing-slash-offset', `${(lines - 1) * lineHeight}px`);
  }

  // Autocomplete / Suggestions for Decode Mode
  function handleDecodeSuggestions() {
    updateDecodeInputHeight();
    const rawVal = DOM.decodeInput.value.replace(/[\/\\]+$/, '');
    if (/\s$/.test(rawVal)) {
      DOM.suggestionsBox.innerHTML = '';
      return;
    }
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
        updateDecodeInputHeight();
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
        if (cc && !rawInput.startsWith('+') && /^[\d\s().-]+$/.test(rawInput)) {
          rawInput = '+' + cc + rawInput;
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
      DOM.decodeInput.value = rawWords;
      updateDecodeInputHeight();
      DOM.suggestionsBox.innerHTML = '';
      if (!rawWords) {
        if (showErrorToast) showToast('Please enter WCode to decode', 'warning');
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
    DOM.outputSection.classList.remove('is-decoded');
    DOM.outputSection.prepend(DOM.outputBadge.parentElement);
    DOM.outputSection.style.display = 'block';
    DOM.encodeOutputView.style.display = 'block';
    DOM.decodeOutputView.style.display = 'none';

    DOM.outputBadge.textContent = 'WCode';
    DOM.heroDisplay.innerHTML = `<span class="hero-slash">\\</span>`;
    
    res.words.forEach((word, idx) => {
      const pill = document.createElement('span');
      pill.className = 'wcode-word-pill';
      pill.textContent = word;
      pill.title = 'Click to speak word';
      pill.addEventListener('click', () => speakWord(word));

      // Group the last word with the trailing slash so the slash never wraps alone
      if (idx === res.words.length - 1) {
        const lastGroup = document.createElement('span');
        lastGroup.className = 'wcode-last-word-group';
        lastGroup.appendChild(pill);

        const trailingSlash = document.createElement('span');
        trailingSlash.className = 'hero-slash';
        trailingSlash.textContent = '/';
        lastGroup.appendChild(trailingSlash);

        DOM.heroDisplay.appendChild(lastGroup);
      } else {
        DOM.heroDisplay.appendChild(pill);
      }
    });

    const inputSymbols = Array.from(res.input != null ? String(res.input) : '').length;
    const inputLabel = `${inputSymbols} ${inputSymbols === 1 ? 'symbol' : 'symbols'}`;
    const outputWordsLabel = `${res.wordCount} ${res.wordCount === 1 ? 'word' : 'words'}`;
    const statusLabel = res.hasChecksum ? 'CRC-8 Verified' : 'Standard';
    
    if (DOM.outputStats) {
      DOM.outputStats.innerHTML = `<span class="tooltip-line">Input: ${inputLabel}</span><span class="tooltip-line">Output: ${outputWordsLabel}</span><span class="tooltip-line tooltip-muted">${statusLabel}</span>`;
    }
    if (DOM.encodeInfoBtn) {
      DOM.encodeInfoBtn.setAttribute('aria-label', `Input: ${inputLabel}, Output: ${outputWordsLabel}, ${statusLabel}`);
    }
    
    state.currentResult = {
      mode: 'encode',
      type: res.type,
      input: res.input,
      wcode: res.message,
      formatted: res.formatted
    };

    DOM.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function createDecodedActionButton(href, label, svgPath, targetBlank = false) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'action-link-btn';
    link.setAttribute('aria-label', label);
    if (targetBlank) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.innerHTML = `<svg viewBox="0 0 24 24"><path d="${svgPath}"/></svg><span class="action-tooltip" role="tooltip">${label}</span>`;
    return link;
  }

  function renderDecodeOutput(res) {
    DOM.outputSection.classList.add('is-decoded');
    DOM.outputSection.prepend(DOM.outputBadge.parentElement);
    DOM.outputSection.style.display = 'block';
    DOM.encodeOutputView.style.display = 'none';
    DOM.decodeOutputView.style.display = 'block';

    DOM.outputBadge.textContent = getTypeTitle(res.type);
    DOM.decodedText.textContent = res.data;

    // Type-specific action links
    DOM.decodedMetaActions.innerHTML = '';
    if (res.type === 'phone') {
      DOM.decodedMetaActions.appendChild(createDecodedActionButton(
        `tel:${res.data}`,
        'Call Phone',
        'M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z'
      ));
      DOM.decodedMetaActions.appendChild(createDecodedActionButton(
        `sms:${res.data}`,
        'Send SMS',
        'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'
      ));
    } else if (res.type === 'url') {
      let href = res.data;
      if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
      DOM.decodedMetaActions.appendChild(createDecodedActionButton(
        href,
        'Open URL',
        'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
        true
      ));
    } else if (res.type === 'email') {
      DOM.decodedMetaActions.appendChild(createDecodedActionButton(
        `mailto:${res.data}`,
        'Send Email',
        'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'
      ));
    } else if (res.type === 'location') {
      const coords = res.data.replace(/\s+/g, '');
      DOM.decodedMetaActions.appendChild(createDecodedActionButton(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`,
        'View on Google Maps',
        'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
        true
      ));
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
    const typeTitle = getTypeTitle(state.currentResult.type);
    const title = state.mode === 'encode' ? 'WCode' : typeTitle;
    const text = state.mode === 'encode'
      ? `WCode: ${state.currentResult.formatted}`
      : `${typeTitle}: ${state.currentResult.data}`;

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
    if (state.mode === 'encode') {
      const encodeVal = DOM.encodeInput.value.trim();
      const words = encodeVal ? trimDecodeInput(encodeVal) : (state.currentResult ? state.currentResult.wcode : '');
      const type = (state.currentResult && state.currentResult.type) ? state.currentResult.type : state.type;
      setMode('decode');
      if (type) setType(type);
      if (words) {
        DOM.decodeInput.value = words;
        updateDecodeInputHeight();
        DOM.encodeInput.value = '';
        executeTransform(true);
      }
    } else {
      const decodeVal = DOM.decodeInput.value.trim();
      const data = decodeVal ? decodeVal : (state.currentResult ? state.currentResult.data : '');
      const type = (state.currentResult && state.currentResult.type) ? state.currentResult.type : state.type;
      setMode('encode');
      if (type) setType(type);
      if (data) {
        DOM.encodeInput.value = data;
        DOM.decodeInput.value = '';
        executeTransform(true);
      }
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

  // Info Modal & First-Visit Check (Wolo Parity)
  const CURRENT_NOTE_VERSION = '1.0';

  function checkFirstVisit() {
    let isFirst = false;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('note_version') || localStorage.getItem('wcode_note_version');
        if (!stored) {
          isFirst = true;
        }
      }
    } catch (e) {
      isFirst = false;
    }

    if (isFirst) {
      showInfoModal(true);
    }
  }

  // Info Version Indicator (Wolo Parity)
  function getInfoVersionToggles() {
    return [
      document.getElementById('info_version_indicator')
    ];
  }

  function getInfoUpdatedTimestamp() {
    const indicator = document.getElementById('info_version_indicator');
    if (!indicator) return '';
    const updated = indicator.getAttribute('data-updated');
    return updated ? updated.replace(/\s+/g, ' ').trim() : '';
  }

  function padInfoTimePart(value) {
    return (value < 10 ? '0' : '') + value;
  }

  function formatInfoTimestamp(date, local) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!date || isNaN(date.getTime())) return '';
    if (local) {
      let zone = '';
      try {
        const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(date);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].type === 'timeZoneName') {
            zone = parts[i].value;
            break;
          }
        }
      } catch (error) {
        zone = '';
      }
      return date.getFullYear() + ' ' + months[date.getMonth()] + ' ' + padInfoTimePart(date.getDate()) + ' ' + padInfoTimePart(date.getHours()) + ':' + padInfoTimePart(date.getMinutes()) + ':' + padInfoTimePart(date.getSeconds()) + (zone ? ' ' + zone : '');
    }
    return date.getUTCFullYear() + ' ' + months[date.getUTCMonth()] + ' ' + padInfoTimePart(date.getUTCDate()) + ' ' + padInfoTimePart(date.getUTCHours()) + ':' + padInfoTimePart(date.getUTCMinutes()) + ':' + padInfoTimePart(date.getUTCSeconds()) + ' UTC';
  }

  function formatInfoElapsed(date) {
    if (!date || isNaN(date.getTime())) return '';
    let ms = Date.now() - date.getTime();
    if (ms < 0) ms = 0;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return seconds + ' seconds ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return minutes + ' minutes ago';
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return hours + ' hours ago';
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 30) return days + ' days ago';
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return months + ' months ago';
    const years = Math.floor(days / 365);
    if (years <= 1) return '1 year ago';
    return years + ' years ago';
  }

  function fillInfoVersionStamps() {
    const indicator = document.getElementById('info_version_indicator');
    if (!indicator) return;
    const utcNode = indicator.querySelector('.info_version_stamp_utc');
    const elapsedNode = indicator.querySelector('.info_version_stamp_elapsed');
    const localNode = indicator.querySelector('.info_version_local');
    if (!utcNode || !elapsedNode || !localNode) return;
    const updated = getInfoUpdatedTimestamp();
    const date = updated ? new Date(updated) : null;
    utcNode.textContent = formatInfoTimestamp(date) || updated;
    elapsedNode.textContent = formatInfoElapsed(date) || '';
    localNode.textContent = formatInfoTimestamp(date, true) || updated;
  }

  function setInfoVersionExpanded(expanded) {
    fillInfoVersionStamps();
    const nodes = getInfoVersionToggles();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node) continue;
      node.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  function toggleInfoVersionDisplay(event) {
    if (event) {
      if (event.preventDefault) event.preventDefault();
      if (event.stopPropagation) event.stopPropagation();
    }
    const indicator = document.getElementById('info_version_indicator');
    const expanded = indicator && indicator.getAttribute('aria-expanded') === 'true';
    setInfoVersionExpanded(!expanded);
  }

  function showInfoModal(isIntro = false) {
    hideLinksModal();
    setInfoVersionExpanded(false);
    fillInfoVersionStamps();
    const introSection = document.getElementById('info-intro');
    const fullSection = document.getElementById('info-full');
    const closeBtn = document.getElementById('modal-close');

    if (isIntro) {
      if (introSection) introSection.style.display = 'block';
      if (fullSection) fullSection.style.display = 'none';
      if (closeBtn) closeBtn.style.display = 'none';
    } else {
      if (introSection) introSection.style.display = 'none';
      if (fullSection) fullSection.style.display = 'block';
      if (closeBtn) closeBtn.style.display = 'inline-flex';
    }

    if (DOM.infoModal) {
      DOM.infoModal.classList.add('open');
      DOM.infoModal.setAttribute('aria-hidden', 'false');
    }
  }

  function hideInfoModal() {
    setInfoVersionExpanded(false);
    if (DOM.infoModal) {
      DOM.infoModal.classList.remove('open');
      DOM.infoModal.setAttribute('aria-hidden', 'true');
    }
  }

  function showLinksModal() {
    hideInfoModal();
    if (DOM.linksModal) {
      DOM.linksModal.classList.add('open');
      DOM.linksModal.setAttribute('aria-hidden', 'false');
    }
  }

  function hideLinksModal() {
    if (DOM.linksModal) {
      DOM.linksModal.classList.remove('open');
      DOM.linksModal.setAttribute('aria-hidden', 'true');
    }
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

    if (DOM.profileBtn) {
      const prefLabel = theme.charAt(0).toUpperCase() + theme.slice(1);
      const resLabel = effective.charAt(0).toUpperCase() + effective.slice(1);
      const label = theme === 'system' ? `${prefLabel} (${resLabel})` : resLabel;
      DOM.profileBtn.setAttribute('aria-label', `Profile & Theme: ${label}`);
      DOM.profileBtn.setAttribute('title', `Profile & Theme: ${label}`);
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
    if (params.has('type')) {
      const paramType = params.get('type').toLowerCase();
      if (TYPE_CONFIG[paramType]) {
        setType(paramType);
      }
    }
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
