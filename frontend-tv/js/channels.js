const API_URL = `https://${window.location.hostname}:3002/api`;

let allChannels = [];
let filteredChannels = [];
let selectedIndex = 0;
let currentCategory = 'Todos';
let lastChannelId = localStorage.getItem('lastChannelId') || null;
let controlsTimeout = null;
let currentHls = null;
let currentDashPlayer = null;
let timeInterval = null;
let preferredQuality = localStorage.getItem('preferredQuality') || 'AUTO';
let favoriteIds = new Set();

async function detectBandwidth() {
  const startTime = Date.now();
  try {
    await fetch(`${API_URL}/health?_=${Date.now()}`);
    const duration = Date.now() - startTime;
    if (duration < 100) return 'FHD';
    if (duration < 300) return 'HD';
    return 'SD';
  } catch {
    return 'HD';
  }
}

async function selectStreamUrl(streamData) {
  let quality = preferredQuality;

  if (quality === 'AUTO') {
    quality = await detectBandwidth();
  }

  const qualities = streamData.qualities || {};

  if (quality === 'FHD' && qualities.FHD) return { url: qualities.FHD, quality: 'FHD' };
  if (quality === 'FHD' && qualities.HD)  return { url: qualities.HD,  quality: 'HD' };
  if (quality === 'HD'  && qualities.HD)  return { url: qualities.HD,  quality: 'HD' };
  if (quality === 'HD'  && qualities.SD)  return { url: qualities.SD,  quality: 'SD' };
  if (quality === 'SD'  && qualities.SD)  return { url: qualities.SD,  quality: 'SD' };

  return { url: streamData.streamUrl, quality: streamData.defaultQuality || 'HD' };
}

function showQualityMenu() {
  const existingMenu = document.querySelector('.quality-menu');
  if (existingMenu) existingMenu.remove();

  const videoContainer = document.getElementById('videoContainer');
  if (!videoContainer) return;

  const menu = document.createElement('div');
  menu.className = 'quality-menu';
  menu.innerHTML = `
    <div class="quality-option ${preferredQuality === 'AUTO' ? 'active' : ''}" data-quality="AUTO">Auto</div>
    <div class="quality-option ${preferredQuality === 'FHD' ? 'active' : ''}" data-quality="FHD">FHD</div>
    <div class="quality-option ${preferredQuality === 'HD' ? 'active' : ''}" data-quality="HD">HD</div>
    <div class="quality-option ${preferredQuality === 'SD' ? 'active' : ''}" data-quality="SD">SD</div>
  `;

  menu.querySelectorAll('.quality-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const newQuality = opt.dataset.quality;
      preferredQuality = newQuality;
      localStorage.setItem('preferredQuality', newQuality);
      menu.remove();
      const currentChannelId = lastChannelId;
      if (currentChannelId) playChannel(currentChannelId);
    });
  });

  videoContainer.appendChild(menu);

  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target) && !e.target.closest('#qualityBtn')) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}

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

  await loadFavorites();
  await loadChannels();
  setupRemoteControl();
  setupVideoControls();
  setupMobileSidebar();

  const prefs = JSON.parse(localStorage.getItem('user') || '{}').preferences;
  if (prefs?.lastCinemaMode) {
    enterCinemaMode();
  }
  if (prefs?.lastVolume) {
    const video = document.getElementById('videoPlayer');
    if (video) video.volume = (prefs.lastVolume || 100) / 100;
  }
  if (prefs?.lastChannelId) {
    setTimeout(() => {
      const idx = filteredChannels.findIndex(c => c.id === prefs.lastChannelId);
      if (idx !== -1) {
        selectedIndex = idx;
        renderChannels();
        playChannel(prefs.lastChannelId);
      }
    }, 1000);
  }
}

window.showQualityMenu = showQualityMenu;
window.toggleFavorite = toggleFavorite;

async function loadFavorites() {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      favoriteIds = new Set(data.data || []);
    }
  } catch {}
}

function toggleFavorite(channelId) {
  const token = localStorage.getItem('accessToken');
  if (favoriteIds.has(channelId)) {
    fetch(`${API_URL}/favorites/${channelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      favoriteIds.delete(channelId);
      showNotification('Eliminado de favoritos', '', 'info');
      renderChannels();
    }).catch(() => {});
  } else {
    fetch(`${API_URL}/favorites/${channelId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      favoriteIds.add(channelId);
      showNotification('Agregado a favoritos', '', 'info');
      renderChannels();
    }).catch(() => {});
  }
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

  const categories = ['Todos', '⭐ Favoritos', ...new Set(allChannels.map(c => c.category))];
  container.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">${cat}</button>
  `).join('');

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      if (currentCategory === '⭐ Favoritos') {
        filteredChannels = allChannels.filter(c => favoriteIds.has(c.id));
      } else {
        filteredChannels = currentCategory === 'Todos' ? [...allChannels] : allChannels.filter(c => c.category === currentCategory);
      }
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
    <div class="channel-item ${index === selectedIndex ? 'selected' : ''} ${favoriteIds.has(channel.id) ? 'is-favorite' : ''}" data-index="${index}" data-id="${channel.id}">
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
      <span class="channel-star">${favoriteIds.has(channel.id) ? '★' : '☆'}</span>
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

  container.querySelectorAll('.channel-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const channelItem = star.closest('.channel-item');
      const channelId = channelItem.dataset.id;
      toggleFavorite(channelId);
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

    if (response.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        const retry = await fetch(`${API_URL}/channels/${channelId}/stream`, {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        if (!retry.ok) throw new Error('No se pudo cargar el canal');
        const data = await retry.json();
        lastChannelId = channelId;
        localStorage.setItem('lastChannelId', channelId);
        savePreferencesDebounced({ lastChannelId: channelId });
        playVideo(data.data, channelId);
        showLoading(false);
        return;
      }
      logout();
      return;
    }

    if (!response.ok) throw new Error('No se pudo cargar el canal');

    const data = await response.json();
    lastChannelId = channelId;
    localStorage.setItem('lastChannelId', channelId);
    savePreferencesDebounced({ lastChannelId: channelId });
    playVideo(data.data, channelId);
  } catch (err) {
    showError(err.message);
    showNotification('Error', err.message, 'danger');
  } finally {
    showLoading(false);
  }
}

let savePreferencesTimeout = null;
function savePreferencesDebounced(prefs) {
  clearTimeout(savePreferencesTimeout);
  savePreferencesTimeout = setTimeout(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${API_URL}/auth/preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prefs)
    }).catch(() => {});
  }, 2000);
}

function playVideo(streamData, channelId) {
  const placeholder = document.getElementById('placeholder');
  const videoContainer = document.getElementById('videoContainer');
  const video = document.getElementById('videoPlayer');

  if (placeholder) placeholder.style.display = 'none';
  if (videoContainer) {
    videoContainer.style.display = 'block';
    videoContainer.style.position = 'relative';
    videoContainer.style.width = '100%';
    videoContainer.style.height = '100%';
  }

  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const isMobile = window.innerWidth <= 600;
  if (sidebar) {
    sidebar.classList.add('video-playing');
    sidebar.classList.remove('open');
  }
  if (isMobile && mainContent) {
    mainContent.classList.add('video-active');
  }

  const channel = filteredChannels.find(c => c.id === channelId);
  showChannelOverlay(channel?.number, streamData.name, streamData.quality || streamData.defaultQuality);

  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }
  if (currentDashPlayer) {
    currentDashPlayer.reset();
    currentDashPlayer = null;
  }

  video.pause();
  video.removeAttribute('src');
  video.load();

  selectStreamUrl(streamData).then(({ url, quality }) => {
    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        currentHls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          lowLatencyMode: false,
          backBufferLength: 30,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
          levelLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 1000,
        });
        currentHls.loadSource(url);
        currentHls.attachMedia(video);
        let retryCount = 0;
        const maxRetries = 3;

        currentHls.on(Hls.Events.ERROR, (event, data) => {
          console.warn('HLS error:', data.type, data.details, 'fatal:', data.fatal);

          if (!data.fatal) {
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Reintentando conexión (${retryCount}/${maxRetries})...`);
                showNotification('Reconectando...', `Intento ${retryCount} de ${maxRetries}`, 'info');
                setTimeout(() => {
                  currentHls.startLoad();
                }, 2000 * retryCount);
              } else if (streamData.streamUrlBackup) {
                console.log('Cambiando a URL backup...');
                showNotification('Señal principal caída', 'Conectando a señal de respaldo...', 'warning');
                retryCount = 0;
                currentHls.loadSource(streamData.streamUrlBackup);
                currentHls.startLoad();
              } else {
                showNotification('Sin señal', 'No se puede conectar al canal. Intentá de nuevo más tarde.', 'danger');
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              if (retryCount < maxRetries) {
                retryCount++;
                console.log('Recuperando error de media...');
                currentHls.recoverMediaError();
              } else if (streamData.streamUrlBackup) {
                showNotification('Error de reproducción', 'Conectando a señal de respaldo...', 'warning');
                retryCount = 0;
                currentHls.loadSource(streamData.streamUrlBackup);
                currentHls.startLoad();
              } else {
                showNotification('Error de reproducción', 'No se puede reproducir este canal.', 'danger');
              }
              break;

            default:
              if (streamData.streamUrlBackup) {
                showNotification('Error inesperado', 'Conectando a señal de respaldo...', 'warning');
                currentHls.loadSource(streamData.streamUrlBackup);
                currentHls.startLoad();
              } else {
                showNotification('Error', 'No se puede reproducir este canal.', 'danger');
              }
              break;
          }
        });

        currentHls.on(Hls.Events.FRAG_LOADED, () => {
          retryCount = 0;
        });

        currentHls.on(Hls.Events.BUFFER_STALLED, () => {
          showNotification('Buffering...', 'Cargando señal, un momento', 'info');
        });

        currentHls.on(Hls.Events.LEVEL_SWITCHED, () => {
          document.getElementById('liveIndicator')?.classList.add('visible');
        });
        currentHls.startLoad();
        video.play().catch(err => console.log('Playback needs user interaction:', err));
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(err => console.log('Playback needs user interaction:', err));
        document.getElementById('liveIndicator')?.classList.add('visible');
      } else {
        video.src = url;
        video.play().catch(err => console.log('Playback needs user interaction:', err));
      }
    } else if (url.includes('.mpd')) {
      if (typeof dashjs === 'undefined') {
        showError('DASH player no cargado. Actualizá la página.');
        showLoading(false);
        return;
      }

      if (currentDashPlayer) {
        currentDashPlayer.reset();
        currentDashPlayer = null;
      }

      const isFlow = url.includes('cvattv.com.ar') || url.includes('chromecast') ||
                     url.includes('edge-live') || url.includes('edge6') || url.includes('edge-vod');
      const PROXY_BASE = API_URL + '/proxy';
      const cdntokenMatch = url.match(/cdntoken=([^&]+)/);
      const cdntoken = cdntokenMatch ? cdntokenMatch[1] : null;
      window.currentCdntoken = cdntoken;

      const player = dashjs.MediaPlayer().create();

      if (isFlow) {
        player.initialize(video, `${PROXY_BASE}?url=${encodeURIComponent(url)}`, true, {
          'stream': { 'buffer': { 'enabled': true, 'bufferTime': 10, 'bufferLength': 5 } },
          'protectionData': {
            'com.widevine.alpha': {
              'serverURL': `${API_URL.replace('/api', '')}/proxy?url=${encodeURIComponent('license://widevine')}`,
              'withCredentials': false
            }
          }
        });
      } else {
        player.initialize(video, `${PROXY_BASE}?url=${encodeURIComponent(url)}`, true);
      }

      currentDashPlayer = player;

      player.on(dashjs.MediaPlayer.events.ERROR, (e, err) => {
        console.error('[DASH ERROR]', err?.message || err?.type || err);
        if (err?.type === 'capability' && err?.message === 'mediasource') {
          showError('Tu navegador no soporta DASH/MSE. Probá con Chrome o Edge.');
        }
      });

      player.on(dashjs.MediaPlayer.events.PLAYBACK_ERROR, (e, err) => {
        console.error('[DASH PLAYBACK ERROR]', err?.message || err);
      });

      video.play().catch(err => console.log('Playback needs user interaction:', err));
      document.getElementById('liveIndicator')?.classList.add('visible');
    } else {
      video.src = url;
      if (streamData.streamUrlBackup) {
        video.onerror = () => {
          video.src = streamData.streamUrlBackup;
          video.play().catch(() => {});
        };
      }
      video.play().catch(err => console.log('Playback needs user interaction:', err));
    }

    const qualityBadge = document.getElementById('channelQuality');
    if (qualityBadge) {
      qualityBadge.textContent = quality;
      qualityBadge.className = `channel-quality-badge ${quality}`;
    }
  });

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
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('video-playing');

  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.onclick = () => {
      const last = localStorage.getItem('lastChannelId');
      if (last) playChannel(last);
    };
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Volver a canales';
  closeBtn.style.cssText = 'margin-top:8px;background:#475569;border:none;color:white;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;';
  closeBtn.onclick = closeVideoAndShowList;
  errorScreen?.appendChild(closeBtn);
}

function hideError() {
  const errorScreen = document.getElementById('errorScreen');
  errorScreen?.classList.remove('visible');
  const existingBtn = errorScreen?.querySelector('button:last-child');
  if (existingBtn && existingBtn.textContent === 'Volver a canales') {
    existingBtn.remove();
  }
}

function closeVideoAndShowList() {
  const placeholder = document.getElementById('placeholder');
  const videoContainer = document.getElementById('videoContainer');
  const video = document.getElementById('videoPlayer');
  const sidebar = document.getElementById('sidebar');
  const errorScreen = document.getElementById('errorScreen');
  const mainContent = document.getElementById('mainContent');

  video.pause();
  video.src = '';
  if (currentHls) { currentHls.destroy(); currentHls = null; }
  if (videoContainer) videoContainer.style.display = 'none';
  if (placeholder) placeholder.style.display = 'block';
  if (sidebar) sidebar.classList.remove('video-playing');
  if (errorScreen) errorScreen.classList.remove('visible');
  if (mainContent) mainContent.classList.remove('video-active');
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
  const filtersContainer = document.getElementById('categoryFilters');

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

  if (filtersContainer) {
    filtersContainer.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        filtersContainer.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
}

function setupRemoteControl() {
  document.addEventListener('keydown', handleKeyDown);
}

let numberBuffer = '';

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
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        video.pause();
        video.src = '';
        if (currentHls) { currentHls.destroy(); currentHls = null; }
        if (videoContainer) videoContainer.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        if (sidebar) sidebar.classList.remove('video-playing');
        if (mainContent) mainContent.classList.remove('video-active');
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

function navigateChannels(direction) {
  const newIndex = selectedIndex + direction;
  if (newIndex >= 0 && newIndex < filteredChannels.length) {
    selectedIndex = newIndex;
    renderChannels();
  }
}

function selectChannel(index) {
  if (index >= 0 && index < filteredChannels.length) {
    selectedIndex = index;
    renderChannels();
  }
}