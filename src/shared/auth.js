/**
 * Vastavik Learning Desktop — Auth State Manager
 * Stores tokens + user profile in electron-store, exposes reactive helpers.
 */

const Auth = {
  _user: null,
  _listeners: [],

  async init() {
    try {
      const token = await window.vastavik.store.get('auth_access_token', null);
      if (token) {
        const userData = await window.vastavik.store.get('auth_user', null);
        if (userData) {
          this._user = userData;
          this._emit();
        }
        // Try refresh profile in background
        this._refreshProfile().catch(() => {});
      }
    } catch (e) {
      console.warn('[Auth] Init error:', e);
    }
  },

  async _refreshProfile() {
    try {
      const profile = await window.API.Auth.getProfile();
      this._user = profile;
      await window.vastavik.store.set('auth_user', profile);
      this._emit();
    } catch (e) {
      if (e.status === 401) await this.logout();
    }
  },

  async login(email, password) {
    const resp = await window.API.Auth.login(email, password);
    await this._saveSession(resp);
    return resp;
  },

  async signup(name, email, password, board, language) {
    const resp = await window.API.Auth.signup(name, email, password, board, language);
    await this._saveSession(resp);
    return resp;
  },

  async _saveSession(authResp) {
    await window.vastavik.store.set('auth_access_token', authResp.access_token);
    await window.vastavik.store.set('auth_refresh_token', authResp.refresh_token);
    this._user = {
      user_id: authResp.user_id,
      name: authResp.name,
      email: authResp.email,
      role: authResp.role,
    };
    await window.vastavik.store.set('auth_user', this._user);
    this._emit();
  },

  async logout() {
    await window.vastavik.store.delete('auth_access_token');
    await window.vastavik.store.delete('auth_refresh_token');
    await window.vastavik.store.delete('auth_user');
    this._user = null;
    this._emit();
    Router.navigate('login');
  },

  isLoggedIn() { return !!this._user; },
  getUser() { return this._user; },

  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  },

  _emit() {
    this._listeners.forEach(fn => fn(this._user));
  },
};

window.AuthManager = Auth;
