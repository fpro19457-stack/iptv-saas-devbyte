const API_URL = 'http://localhost:3002/api';

let allChannels = [];
let filteredChannels = [];
let selectedIndex = 0;
let currentCategory = 'Todos';
let lastChannelId = localStorage.getItem('lastChannelId') || null;
let controlsTimeout = null;
let currentHls = null;
let timeInterval = null;

function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('lastChannelId');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  await loadChannels();
  setupRemoteControl();
  setupVideoControls();
  setupMobileSidebar();
}

async function loadChannels() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/channels`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) { await loadChannels(); return; }
      logout();
      return;
    }

    if (!response.ok) throw new Error('Error al cargar canales');

    const data = await response.json();
    allChannels = data.data || [];
    filteredChannels = [...allChannels];
    currentCategory = 'Todos';

    renderCategories();
    renderChannels();
    restoreLastChannel();
    updateUserAvatar();
  } catch (err) {
    console.error('Error cargando canales:', err);
    const container = document.getElementById('channelList');
    if (container) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--tv-muted);">Error conectando al servidor.</div>';
    }
  }
}

async function tryRefreshToken() {
  const refreshTokenVal = localStorage.getItem('refreshToken');
  if (!refreshTokenVal) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenVal })
    });

    if (!response.ok) return null;
    const data = await response.json();
    localStorage.setItem('accessToken', data.data.accessToken);
    return data.data.accessToken;
  } catch { return null; }
}

function updateUserAvatar() {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      const avatar = document.getElementById('userAvatar');
      if (avatar) avatar.textContent = (userData.username || 'U').charAt(0).toUpperCase();
    } catch {}
  }
}

function renderCategories() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  const categories = ['Todos', ...new Set(allChannels.map(c => c.category))];
  container.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">${cat}</button>
  `).join('');

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      filteredChannels = currentCategory === 'Todos' ? [...allChannels] : allChannels.filter(c => c.category === currentCategory);
      selectedIndex = 0;
      renderCategories();
      renderChannels();
    });
  });
}

function renderChannels() {
  const container = document.getElementById('channelList');
  if (!container) return;

  container.innerHTML = filteredChannels.map((channel, index) => `
    <div class="channel-item ${index === selectedIndex ? 'selected' : ''}" data-index="${index}" data-id="${channel.id}">
      <span class="channel-number">${channel.number}</span>
      <div class="channel-logo">
        ${channel.logoUrl
          ? `<img src="${channel.logoUrl}" alt="${channel.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<svg width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'2\\' y=\\'7\\' width=\\'20\\' height=\\'15\\' rx=\\'2\\'></rect><polyline points=\\'17 2 12 7 7 2\\'></polyline></svg>'">`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`
        }
      </div>
      <div class="channel-info">
        <div class="channel-name">${channel.name}</div>
      </div>
      <span class="quality-badge ${channel.quality}">${channel.quality}</span>
    </div>
  `).join('');

  container.querySelectorAll('.channel-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedIndex = parseInt(item.dataset.index);
      renderChannels();
      playChannel(filteredChannels[selectedIndex].id);
    });
  });

  scrollToSelected();
}

function scrollToSelected() {
  const container = document.getElementById('channelList');
  const selected = container?.querySelector('.channel-item.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function restoreLastChannel() {
  if (lastChannelId) {
    const index = filteredChannels.findIndex(c => c.id === lastChannelId);
    if (index !== -1) {
      selectedIndex = index;
      renderChannels();
    }
  }
}

async function playChannel(channelId) {
  const token = localStorage.getItem('accessToken');
  if (!token) { window.location.href = 'index.html'; return; }

  showLoading(true);
  hideError();

  try {
    const response = await fetch(`${API_URL}/channels/${channelId}/stream`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('No se pudo cargar el canal');

    const data = await response.json();
    lastChannelId = channelId;
    localStorage.setItem('lastChannelId', channelId);
    playVideo(data.data, channelId);
  } catch (err) {
    showError(err.message);
    showNotification('Error', err.message, 'danger');
  } finally {
    showLoading(false);
  }
}

function playVideo(streamData, channelId) {
  const placeholder = document.getElementById('placeholder');
  const videoContainer = document.getElementById('videoContainer');
  const video = document.getElementById('videoPlayer');

  if (placeholder) placeholder.style.display = 'none';
  if (videoContainer) videoContainer.style.display = 'block';

  const channel = filteredChannels.find(c => c.id === channelId);
  showChannelOverlay(channel?.number, streamData.name, streamData.quality);

  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }

  if (streamData.streamUrl.includes('.m3u8')) {
    if (Hls.isSupported()) {
      currentHls = new Hls();
      currentHls.loadSource(streamData.streamUrl);
      currentHls.attachMedia(video);
      currentHls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal && streamData.streamUrlBackup) {
          currentHls.loadSource(streamData.streamUrlBackup);
        } else if (data.fatal) {
          showError('Stream no disponible');
        }
      });
      currentHls.on(Hls.Events.LEVEL_SWITCHED, () => {
        document.getElementById('liveIndicator')?.classList.add('visible');
      });
      currentHls.startLoad();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamData.streamUrl;
      document.getElementById('liveIndicator')?.classList.add('visible');
    }
  } else {
    video.src = streamData.streamUrl;
    if (streamData.streamUrlBackup) {
      video.onerror = () => {
        video.src = streamData.streamUrlBackup;
      };
    }
  }

  video.play().catch(() => {});
  updatePlayButton(true);
  showControls();
}

function showControls() {
  const controls = document.getElementById('playerControls');
  const overlay = document.getElementById('channelOverlay');
  if (controls) controls.classList.add('visible');
  if (overlay) overlay.classList.remove('hidden');
  clearTimeout(controlsTimeout);
  clearInterval(timeInterval);

  const timeEl = document.getElementById('channelTime');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    timeInterval = setInterval(() => {
      if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
  }

  controlsTimeout = setTimeout(hideControls, 3000);
}

function hideControls() {
  const controls = document.getElementById('playerControls');
  const overlay = document.getElementById('channelOverlay');
  if (controls) controls.classList.remove('visible');
  if (overlay) overlay.classList.add('hidden');
  clearInterval(timeInterval);
}

function showChannelOverlay(number, name, quality) {
  const overlay = document.getElementById('channelOverlay');
  const numEl = document.getElementById('channelNumber');
  const nameEl = document.getElementById('channelName');
  const qualityEl = document.getElementById('channelQuality');

  if (numEl) numEl.textContent = number || '';
  if (nameEl) nameEl.textContent = name || '';
  if (qualityEl) { qualityEl.textContent = quality || ''; qualityEl.className = `channel-quality-badge ${quality}`; }

  overlay?.classList.remove('hidden');
  showControls();
}

function showLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  spinner?.classList.toggle('visible', show);
}

function showError(message) {
  const errorScreen = document.getElementById('errorScreen');
  errorScreen?.classList.add('visible');
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.onclick = () => {
      const last = localStorage.getItem('lastChannelId');
      if (last) playChannel(last);
    };
  }
}

function hideError() {
  document.getElementById('errorScreen')?.classList.remove('visible');
}

function showNotification(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const existing = container.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

function setupVideoControls() {
  const video = document.getElementById('videoPlayer');
  const playBtn = document.getElementById('controlPlay');
  const fullscreenBtn = document.getElementById('controlFullscreen');
  const container = document.getElementById('videoContainer');

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        updatePlayButton(true);
      } else {
        video.pause();
        updatePlayButton(false);
      }
      showControls();
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container?.requestFullscreen();
      }
    });
  }

  if (container) {
    container.addEventListener('mousemove', showControls);
    container.addEventListener('touchstart', showControls);
    container.addEventListener('click', (e) => {
      if (e.target === video || e.target.closest('.loading-spinner') || e.target.closest('.error-screen')) {
        showControls();
      }
    });
  }

  video?.addEventListener('play', () => { updatePlayButton(true); showControls(); });
  video?.addEventListener('pause', () => { updatePlayButton(false); showControls(); clearTimeout(controlsTimeout); });
  video?.addEventListener('ended', () => updatePlayButton(false));
}

function updatePlayButton(isPlaying) {
  const playBtn = document.getElementById('controlPlay');
  if (!playBtn) return;
  const playIcon = playBtn.querySelector('.icon-play');
  const pauseIcon = playBtn.querySelector('.icon-pause');

  if (isPlaying) {
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'block';
  } else {
    if (playIcon) playIcon.style.display = 'block';
    if (pauseIcon) pauseIcon.style.display = 'none';
  }
}

function setupMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const handle = document.getElementById('sidebarHandle');

  if (handle && sidebar) {
    let startY = 0;
    let isDragging = false;

    handle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const diff = startY - e.touches[0].clientY;
      if (diff > 50) {
        sidebar.classList.add('open');
        isDragging = false;
      } else if (diff < -50) {
        sidebar.classList.remove('open');
        isDragging = false;
      }
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });
  }
}

function setupRemoteControl() {
  document.addEventListener('keydown', handleKeyDown);
}

let numberBuffer = '';
let numberTimeout = null;

function handleKeyDown(e) {
  const video = document.getElementById('videoPlayer');
  const isVideoActive = video && video.src && video.src.length > 0;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (selectedIndex > 0) {
        selectedIndex--;
        renderChannels();
      }
      break;

    case 'ArrowDown':
      e.preventDefault();
      if (selectedIndex < filteredChannels.length - 1) {
        selectedIndex++;
        renderChannels();
      }
      break;

    case 'Enter':
    case 'OK':
      e.preventDefault();
      if (filteredChannels[selectedIndex]) {
        playChannel(filteredChannels[selectedIndex].id);
      }
      break;

    case 'Backspace':
      e.preventDefault();
      if (isVideoActive) {
        const placeholder = document.getElementById('placeholder');
        const videoContainer = document.getElementById('videoContainer');
        video.pause();
        video.src = '';
        if (currentHls) { currentHls.destroy(); currentHls = null; }
        if (videoContainer) videoContainer.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
      }
      break;

    case 'MediaPlayPause':
    case 'Play':
      if (isVideoActive) {
        video.paused ? video.play() : video.pause();
      }
      break;

    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      e.preventDefault();
      numberBuffer += e.key;
      showNumberBuffer();

      clearTimeout(numberTimeout);
      numberTimeout = setTimeout(() => {
        const channelNum = parseInt(numberBuffer);
        const channel = filteredChannels.find(c => c.number === channelNum);
        if (channel) {
          const index = filteredChannels.indexOf(channel);
          selectedIndex = index;
          renderChannels();
          playChannel(channel.id);
        }
        numberBuffer = '';
        hideNumberBuffer();
      }, 1000);
      break;
  }
}

function showNumberBuffer() {
  const overlay = document.getElementById('numberOverlay');
  const valueEl = document.getElementById('numberValue');
  if (overlay) {
    overlay.classList.add('visible');
    if (valueEl) valueEl.textContent = numberBuffer;
  }
}

function hideNumberBuffer() {
  const overlay = document.getElementById('numberOverlay');
  if (overlay) overlay.classList.remove('visible');
}