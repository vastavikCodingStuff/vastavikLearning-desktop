/**
 * Vastavik Learning Desktop — Client-Side Router
 * Hash-based SPA router. Each "page" is a JS module that exports
 * { render(params): string, mount(params): void, unmount(): void }
 */

const Router = {
  _routes: {},
  _current: null,
  _params: {},
  _history: [],

  register(name, module) {
    this._routes[name] = module;
  },

  async navigate(name, params = {}, pushHistory = true) {
    const route = this._routes[name];
    if (!route) {
      console.error(`[Router] Unknown route: ${name}`);
      return;
    }

    // Unmount current
    if (this._current && this._routes[this._current]?.unmount) {
      try { this._routes[this._current].unmount(); } catch {}
    }

    // Auth guard
    const publicRoutes = ['home', 'login', 'signup'];
    if (!publicRoutes.includes(name) && !window.AuthManager?.isLoggedIn()) {
      return this.navigate('login', {}, pushHistory);
    }

    this._current = name;
    this._params = params;

    if (pushHistory) {
      this._history.push({ name, params });
      window.location.hash = `#${name}`;
    }

    // Update active nav
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === name);
    });

    // Render
    const container = document.getElementById('app-content');
    if (!container) return;

    container.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';

    try {
      const html = await route.render(params);
      container.innerHTML = html;
      if (route.mount) await route.mount(params);
    } catch (err) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-state__icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>${err.message}</p>
          <button class="b-btn b-btn--primary" onclick="Router.navigate('dashboard')">Go Home</button>
        </div>`;
      console.error('[Router] Page error:', err);
    }
  },

  back() {
    if (this._history.length > 1) {
      this._history.pop();
      const prev = this._history[this._history.length - 1];
      this.navigate(prev.name, prev.params, false);
    }
  },

  current() { return this._current; },
  params() { return this._params; },
};

// Handle hash changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  if (hash !== Router._current) {
    Router.navigate(hash, {}, false);
  }
});

window.Router = Router;
