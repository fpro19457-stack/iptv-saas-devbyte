console.log('[REMOTE] Remote control script loaded');

const DeviceType = {
  detect() {
    const ua = navigator.userAgent;
    const w = window.innerWidth;
    console.log('[REMOTE] Detecting device. UA:', ua, 'Width:', w);
    if (/SmartTV|Tizen|webOS|SMART-TV|HbbTV/i.test(ua)) return 'SMART_TV';
    if (/Android.*TV|TV Box|AFT|MediaBox/i.test(ua)) return 'TV_BOX';
    if (w >= 1280 && !('ontouchstart' in window)) return 'PC_TV';
    if (/iPhone|iPad/i.test(ua)) return 'IOS';
    if (/Android/i.test(ua) && w < 900) return 'ANDROID_MOBILE';
    return 'PC';
  }
};

const DEVICE = DeviceType.detect();
  console.log('[REMOTE] Device type:', DEVICE);
  document.body.dataset.device = DEVICE;

let sidebarOverlayTimeout = null;
let isInCinemaMode = false;
let currentFocusElement = null;

function enterCinemaMode() {
  const sidebar = document.getElementById('sidebar');
  document.body.classList.add('cinema-mode');
  document.body.classList.remove('cinema-mode-overlay');
  isInCinemaMode = true;
  console.log('[REMOTE] Cinema mode entered');
  if (sidebar) sidebar.classList.remove('video-playing');
}

function exitCinemaMode() {
  document.body.classList.remove('cinema-mode', 'cinema-mode-overlay');
  isInCinemaMode = false;
  console.log('[REMOTE] Cinema mode exited');
}

function toggleCinemaMode() {
  if (isInCinemaMode) {
    exitCinemaMode();
  } else {
    enterCinemaMode();
  }
  updateCinemaModeButton();
}

function showSidebarOverlay() {
  if (!isInCinemaMode) return;
  document.body.classList.add('cinema-mode-overlay');
  resetOverlayTimeout();
}

function hideSidebarOverlay() {
  document.body.classList.remove('cinema-mode-overlay');
  clearTimeout(sidebarOverlayTimeout);
}

function resetOverlayTimeout() {
  clearTimeout(sidebarOverlayTimeout);
  sidebarOverlayTimeout = setTimeout(hideSidebarOverlay, 5000);
}

function updateCinemaModeButton() {
  const btn = document.getElementById('cinemaModeBtn');
  if (!btn) return;

  if (isInCinemaMode) {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
      <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
      <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
      <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
    </svg>`;
    btn.title = 'Salir de modo cine';
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 3h6v6"></path>
      <path d="M9 21H3v-6"></path>
      <path d="M21 3l-7 7"></path>
      <path d="M3 21l7-7"></path>
    </svg>`;
    btn.title = 'Modo cine';
  }
}

const KEY_MAP = {
  13: 'enter',
  37: 'left', 38: 'up', 39: 'right', 40: 'down',
  8: 'back',
  27: 'back',
  10009: 'back',
  461: 'back',
  196: 'back',
  4: 'back',
  179: 'playpause',
  80: 'playpause',
  32: 'playpause',
  415: 'play',
  19: 'pause',
  413: 'stop',
  10252: 'playpause',
  48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
  53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
  96: '0', 97: '1', 98: '2', 99: '3', 100: '4',
  101: '5', 102: '6', 103: '7', 104: '8', 105: '9',
  403: 'red', 404: 'green', 405: 'yellow', 406: 'blue',
  457: 'info',
  10232: 'info',
  66: 'back',
};

let lastNumberInput = '';
let numberTimeout = null;

function navigateChannels(direction) {
  if (typeof filteredChannels === 'undefined') {
    console.log('[REMOTE] filteredChannels not defined');
    return;
  }
  if (filteredChannels.length === 0) {
    console.log('[REMOTE] No channels');
    return;
  }

  const newIndex = selectedIndex + direction;
  if (newIndex >= 0 && newIndex < filteredChannels.length) {
    selectedIndex = newIndex;
    if (typeof renderChannels === 'function') {
      renderChannels();
    }
    console.log('[REMOTE] Navigated to channel', newIndex);
  }
}

function navigateToChannelNumber(num) {
  if (typeof filteredChannels === 'undefined' || filteredChannels.length === 0) return;

  const idx = filteredChannels.findIndex((ch, i) => ch.number === num || i + 1 === num);
  if (idx !== -1) {
    selectedIndex = idx;
    if (typeof renderChannels === 'function') {
      renderChannels();
    }
    if (typeof playChannel === 'function') {
      playChannel(filteredChannels[idx].id);
    }
    console.log('[REMOTE] Jump to channel number', num);
  }
}

function selectChannel(index) {
  if (typeof filteredChannels !== 'undefined' && index >= 0 && index < filteredChannels.length) {
    selectedIndex = index;
    if (typeof renderChannels === 'function') {
      renderChannels();
    }
  }
}

function togglePlayPause() {
  const video = document.getElementById('videoPlayer');
  if (!video) return;
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

function clickFocusedElement() {
  if (currentFocusElement && typeof currentFocusElement.click === 'function') {
    console.log('[REMOTE] Clicking focused element');
    currentFocusElement.click();
  } else if (typeof filteredChannels !== 'undefined' && filteredChannels[selectedIndex]) {
    if (typeof playChannel === 'function') {
      playChannel(filteredChannels[selectedIndex].id);
    }
  }
}

function handleKeyDown(e) {
  const keyCode = e.keyCode || e.which;
  const action = KEY_MAP[keyCode];

  console.log('[REMOTE] Keydown:', keyCode, 'action:', action);

  if (!action) {
    console.log('[REMOTE] Unknown key, ignoring');
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const overlayVisible = document.body.classList.contains('cinema-mode-overlay');

  switch (action) {
    case 'up':
      console.log('[REMOTE] Action: UP');
      if (isInCinemaMode && !overlayVisible) {
        showSidebarOverlay();
      } else {
        navigateChannels(-1);
      }
      break;

    case 'down':
      console.log('[REMOTE] Action: DOWN');
      if (overlayVisible) {
        navigateChannels(1);
        resetOverlayTimeout();
      } else {
        navigateChannels(1);
      }
      break;

    case 'left':
      console.log('[REMOTE] Action: LEFT');
      if (overlayVisible) {
        hideSidebarOverlay();
      }
      break;

    case 'right':
      console.log('[REMOTE] Action: RIGHT');
      break;

    case 'enter':
      console.log('[REMOTE] Action: ENTER');
      clickFocusedElement();
      break;

    case 'back':
      console.log('[REMOTE] Action: BACK');
      if (overlayVisible) {
        hideSidebarOverlay();
      } else if (isInCinemaMode) {
        exitCinemaMode();
      }
      break;

    case 'playpause':
      togglePlayPause();
      break;

    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      clearTimeout(numberTimeout);
      lastNumberInput += action;
      const overlay = document.getElementById('numberOverlay');
      const valueEl = document.getElementById('numberValue');
      if (overlay) overlay.classList.add('visible');
      if (valueEl) valueEl.textContent = lastNumberInput;
      numberTimeout = setTimeout(() => {
        if (lastNumberInput.length > 0) {
          const num = parseInt(lastNumberInput, 10);
          navigateToChannelNumber(num);
          lastNumberInput = '';
          if (overlay) overlay.classList.remove('visible');
        }
      }, 800);
      break;

    case 'yellow':
      console.log('[REMOTE] Action: YELLOW');
      if (typeof toggleFavorite === 'function' && typeof filteredChannels !== 'undefined' && filteredChannels[selectedIndex]) {
        toggleFavorite(filteredChannels[selectedIndex].id);
      }
      break;
  }
}

document.addEventListener('keydown', handleKeyDown, true);

const video = document.getElementById('videoPlayer');
if (video) {
  video.addEventListener('focus', () => {
    console.log('[REMOTE] Video focused, moving focus to body');
    document.body.focus();
  }, true);

  video.style.pointerEvents = 'none';
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    document.body.focus();
  }
});

function initRemoteControl() {
  console.log('[REMOTE] initRemoteControl called');

  document.body.focus();

  const focusableSelectors = 'button, input, a, [tabindex], .login-tab, .filter-btn, .channel-item, .btn-login';

  function updateFocus() {
    const focusable = Array.from(document.querySelectorAll(focusableSelectors)).filter(el => {
      return el.offsetParent !== null && !el.closest('[style*="display: none"]');
    });

    if (focusable.length > 0 && !document.activeElement?.matches(focusableSelectors)) {
      focusable[0].focus();
      currentFocusElement = focusable[0];
    }
  }

  document.addEventListener('focusin', (e) => {
    currentFocusElement = e.target;
  });

  updateFocus();

  const cinemaBtn = document.getElementById('cinemaModeBtn');
  if (cinemaBtn) {
    cinemaBtn.addEventListener('click', toggleCinemaMode);
  }

  updateCinemaModeButton();

  setTimeout(updateFocus, 1000);

  console.log('[REMOTE] Init complete, device:', DEVICE);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[REMOTE] DOM ready');
  initRemoteControl();
});

window.handleAndroidKey = function(keyCode) {
  console.log('[REMOTE] handleAndroidKey called with:', keyCode);
  const action = KEY_MAP[keyCode];
  if (action) {
    handleKeyDown({ keyCode, which: keyCode, preventDefault: () => {}, stopPropagation: () => {} });
  }
};

console.log('[REMOTE] Script initialized');