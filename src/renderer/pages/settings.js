/** Page: Settings */
window.Pages = window.Pages || {};

window.Pages.Settings = {
  _version: '1.0.0',

  async render() {
    const theme      = await window.vastavik.theme.get() || 'light';
    const backendUrl = await window.vastavik.store.get('backendUrl', 'https://api.vastaviklearning.com');
    const platform   = await window.vastavik.app.getPlatform();
    const user       = AuthManager.getUser();

    try { this._version = await window.vastavik.app.getVersion(); } catch {}

    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="b-page-head b-page-head--black">
        <div class="container">
          <h2>⚙️ Settings</h2>
          <p style="opacity:.85;margin-top:4px">App preferences &amp; account</p>
        </div>
      </div>

      <div class="page-body" style="max-width:760px">

        <!-- Account -->
        ${user ? `
        <div class="settings-section">
          <h3>👤 Account</h3>
          <div class="settings-row">
            <div>
              <div class="settings-label">${user.name}</div>
              <div class="settings-sub">${user.email}</div>
            </div>
            <div class="flex gap-2">
              <span class="b-tag ${user.is_premium ? 'b-tag--purple' : 'b-tag--ghost'}">${user.is_premium ? '⭐ Pro' : 'Free Plan'}</span>
              <button class="b-btn b-btn--danger b-btn--sm" onclick="AuthManager.logout()">Sign Out</button>
            </div>
          </div>
        </div>` : `
        <div class="settings-section">
          <h3>👤 Account</h3>
          <p class="muted mb-3">You are not signed in.</p>
          <div class="flex gap-2">
            <button class="b-btn b-btn--primary" onclick="Router.navigate('login')">Sign In</button>
            <button class="b-btn b-btn--ghost" onclick="Router.navigate('signup')">Create Account</button>
          </div>
        </div>`}

        <!-- Appearance -->
        <div class="settings-section">
          <h3>🎨 Appearance</h3>
          <div class="settings-row">
            <div>
              <div class="settings-label">Dark Mode</div>
              <div class="settings-sub">Switch between light and dark themes</div>
            </div>
            <button class="toggle ${theme === 'dark' ? 'on' : ''}" id="dark-toggle" role="switch" aria-checked="${theme === 'dark'}" aria-label="Dark mode toggle"></button>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Font Size</div>
              <div class="settings-sub">Adjust reading font size</div>
            </div>
            <div class="flex items-center gap-2">
              <button class="b-btn b-btn--ghost b-btn--sm b-btn--icon" id="font-smaller">A−</button>
              <span id="font-size-label" style="font-weight:700;min-width:32px;text-align:center">16px</span>
              <button class="b-btn b-btn--ghost b-btn--sm b-btn--icon" id="font-larger">A+</button>
            </div>
          </div>
        </div>

        <!-- Backend -->
        <div class="settings-section">
          <h3>🌐 Backend Connection</h3>
          <div class="settings-row">
            <div class="flex-1">
              <div class="settings-label">API Server URL</div>
              <div class="settings-sub">Change if you're running a local backend</div>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <input class="b-input" type="url" id="backend-url-input" value="${backendUrl}" style="flex:1" />
            <button class="b-btn b-btn--primary b-btn--sm" id="save-backend-btn">Save</button>
            <button class="b-btn b-btn--ghost b-btn--sm" id="test-backend-btn">Test</button>
          </div>
          <div id="backend-status" class="mt-2" style="font-size:.85rem"></div>
        </div>

        <!-- Graphify settings -->
        <div class="settings-section">
          <h3>📖 Graphify Reader</h3>
          <div class="settings-row">
            <div>
              <div class="settings-label">Default Zoom</div>
              <div class="settings-sub">Starting zoom level for opened files</div>
            </div>
            <div class="flex items-center gap-2">
              <input type="range" id="graphify-zoom-range" min="50" max="200" step="10" value="100"
                style="width:120px" />
              <span id="graphify-zoom-val" style="font-weight:700;min-width:40px">100%</span>
            </div>
          </div>
          <div class="settings-row">
            <div>
              <div class="settings-label">Clear annotations &amp; bookmarks</div>
              <div class="settings-sub">Remove all stored Graphify data</div>
            </div>
            <button class="b-btn b-btn--danger b-btn--sm" id="clear-graphify-btn">Clear</button>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section">
          <h3>ℹ️ About</h3>
          <div class="settings-row">
            <div class="settings-label">Version</div>
            <span class="b-tag">${this._version}</span>
          </div>
          <div class="settings-row">
            <div class="settings-label">Platform</div>
            <span class="b-tag b-tag--ghost">${platform}</span>
          </div>
          <div class="settings-row">
            <div class="settings-label">Website</div>
            <a href="#" onclick="window.vastavik.shell.openExternal('https://vastaviklearning.com');return false">vastaviklearning.com ↗</a>
          </div>
        </div>

      </div>
    </div>`;
  },

  async mount() {
    // Dark mode toggle
    document.getElementById('dark-toggle')?.addEventListener('click', async (e) => {
      const isOn = e.currentTarget.classList.toggle('on');
      e.currentTarget.setAttribute('aria-checked', String(isOn));
      await applyTheme(isOn ? 'dark' : 'light');
      showToast(`${isOn ? 'Dark' : 'Light'} mode enabled`, 'ok');
    });

    // Font size
    const savedSize = (await window.vastavik.store.get('fontSize', 16)) || 16;
    document.documentElement.style.fontSize = `${savedSize}px`;
    document.getElementById('font-size-label').textContent = `${savedSize}px`;

    document.getElementById('font-smaller')?.addEventListener('click', async () => {
      const cur = parseInt(document.getElementById('font-size-label').textContent) || 16;
      const next = Math.max(12, cur - 1);
      document.documentElement.style.fontSize = `${next}px`;
      document.getElementById('font-size-label').textContent = `${next}px`;
      await window.vastavik.store.set('fontSize', next);
    });
    document.getElementById('font-larger')?.addEventListener('click', async () => {
      const cur = parseInt(document.getElementById('font-size-label').textContent) || 16;
      const next = Math.min(24, cur + 1);
      document.documentElement.style.fontSize = `${next}px`;
      document.getElementById('font-size-label').textContent = `${next}px`;
      await window.vastavik.store.set('fontSize', next);
    });

    // Backend URL
    document.getElementById('save-backend-btn')?.addEventListener('click', async () => {
      const url = document.getElementById('backend-url-input').value.trim();
      if (!url) return;
      await window.vastavik.store.set('backendUrl', url);
      showToast('Backend URL saved!', 'ok');
    });

    document.getElementById('test-backend-btn')?.addEventListener('click', async () => {
      const statusEl = document.getElementById('backend-status');
      statusEl.textContent = '⟳ Testing connection…';
      try {
        const data = await window.API.System.health();
        statusEl.innerHTML = `<span style="color:var(--lime);font-weight:700">✅ Connected — ${data.status} (${Math.round(data.uptime_seconds)}s uptime)</span>`;
      } catch (err) {
        statusEl.innerHTML = `<span style="color:var(--pink);font-weight:700">❌ ${err.message}</span>`;
      }
    });

    // Graphify zoom
    const gZoom = Math.round(((await window.vastavik.store.get('graphifyZoom', 1.0)) || 1.0) * 100);
    const zRange = document.getElementById('graphify-zoom-range');
    const zVal   = document.getElementById('graphify-zoom-val');
    if (zRange) zRange.value = gZoom;
    if (zVal)   zVal.textContent = `${gZoom}%`;
    zRange?.addEventListener('input', async (e) => {
      zVal.textContent = `${e.target.value}%`;
      await window.vastavik.store.set('graphifyZoom', e.target.value / 100);
    });

    // Clear graphify
    document.getElementById('clear-graphify-btn')?.addEventListener('click', async () => {
      if (!confirm('Clear all Graphify annotations and bookmarks?')) return;
      await window.vastavik.store.delete('graphifyAnnotations');
      await window.vastavik.store.delete('graphifyBookmarks');
      showToast('Graphify data cleared', 'ok');
    });
  },

  unmount() {},
};
