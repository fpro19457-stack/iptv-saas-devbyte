const API_URL = 'http://192.168.100.120:3002/api';

let currentTab = 'credentials';
let pairingPollingInterval = null;
let pairingExpiryTimeout = null;

function logout() {
  stopPairingPolling();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('lastChannelId');
  window.location.href = 'index.html';
}

function showError(message, elementId = 'errorMessage') {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function hideError(elementId = 'errorMessage') {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    window.location.href = 'canales.html';
    return;
  }

  initTabs();
  initPairingTab();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

function initTabs() {
  const tabs = document.querySelectorAll('.login-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;
  stopPairingPolling();

  document.querySelectorAll('.login-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.dataset.tab === tabName);
  });

  if (tabName === 'pairing') {
    startPairing();
  }
}

async function initPairingTab() {
  const regenerateBtn = document.getElementById('regenerateBtn');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', startPairing);
  }
}

async function startPairing() {
  stopPairingPolling();
  hideError('pairingError');

  const codeElement = document.getElementById('pairingCode');
  const expiryElement = document.getElementById('pairingExpiry');
  const statusElement = document.getElementById('pairingStatus');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const codeBox = document.getElementById('pairingCodeDisplay');

  if (codeElement) codeElement.textContent = 'Generando...';
  if (expiryElement) expiryElement.textContent = '';
  if (statusElement) statusElement.innerHTML = '<span class="pairing-dots">Generando código<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span></span>';
  if (regenerateBtn) regenerateBtn.style.display = 'none';
  if (codeBox) codeBox.style.opacity = '1';

  try {
    const response = await fetch(`${API_URL}/auth/pairing/generate`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al generar código');
    }

    const code = data.data.code;
    const expiresAt = new Date(data.data.expiresAt);
    const expiresInSeconds = data.data.expiresInSeconds;

    if (codeElement) codeElement.textContent = code;
    updateExpiryCountdown(expiresAt);

    if (statusElement) {
      statusElement.innerHTML = '<span class="pairing-dots">Esperando aprobación<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span></span>';
    }

    startPairingPolling(code, expiresAt);

  } catch (err) {
    if (statusElement) {
      statusElement.innerHTML = `<span style="color: var(--tv-error)">Error: ${err.message}</span>`;
    }
  }
}

function updateExpiryCountdown(expiresAt) {
  const expiryElement = document.getElementById('pairingExpiry');

  clearInterval(pairingExpiryTimeout);

  function update() {
    const now = new Date();
    const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (expiryElement) {
      expiryElement.textContent = `Expira en ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (remaining < 120000 && remaining > 0) {
        expiryElement.style.color = 'var(--tv-error)';
      } else {
        expiryElement.style.color = '';
      }
    }

    if (remaining <= 0) {
      clearInterval(pairingExpiryTimeout);
      handlePairingExpired();
    }
  }

  update();
  pairingExpiryTimeout = setInterval(update, 1000);
}

function startPairingPolling(code, expiresAt) {
  stopPairingPolling();

  pairingPollingInterval = setInterval(async () => {
    if (currentTab !== 'pairing') {
      stopPairingPolling();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/pairing/status/${code}`);
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      if (data.data.status === 'APPROVED') {
        clearInterval(pairingExpiryTimeout);
        stopPairingPolling();

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        const statusElement = document.getElementById('pairingStatus');
        if (statusElement) {
          statusElement.innerHTML = '<span style="color: var(--tv-success); font-size: 18px;">✓ Autorizado</span>';
        }

        setTimeout(() => {
          window.location.href = 'canales.html';
        }, 1000);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 3000);
}

function stopPairingPolling() {
  if (pairingPollingInterval) {
    clearInterval(pairingPollingInterval);
    pairingPollingInterval = null;
  }
}

function handlePairingExpired() {
  stopPairingPolling();

  const statusElement = document.getElementById('pairingStatus');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const codeBox = document.getElementById('pairingCodeDisplay');

  if (statusElement) {
    statusElement.innerHTML = '<span style="color: var(--tv-warning)">Código expirado</span>';
  }
  if (regenerateBtn) regenerateBtn.style.display = 'block';
  if (codeBox) codeBox.style.opacity = '0.5';
}

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  const btnText = document.querySelector('.btn-text');
  const btnLoading = document.querySelector('.btn-loading');
  const btn = document.querySelector('.btn-login');

  if (!username || !password) {
    showError('Ingresá usuario y contraseña');
    return;
  }

  if (btnText) btnText.style.display = 'none';
  if (btnLoading) btnLoading.style.display = 'inline';
  if (btn) btn.disabled = true;
  hideError();

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    window.location.href = 'canales.html';
  } catch (err) {
    showError(err.message);
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    if (btn) btn.disabled = false;
  }
}

async function getUser() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

async function refreshToken() {
  const refreshTokenVal = localStorage.getItem('refreshToken');
  if (!refreshTokenVal) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenVal })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data.accessToken;
  } catch {
    return null;
  }
}