/**
 * Vastavik Learning Desktop — In-Memory Reactive Store
 * Lightweight state management for UI components.
 */

const Store = {
  _state: {
    theme: 'light',
    sidebarCollapsed: false,
    toast: null,
    loading: false,
    user: null,
    courses: null,
    currentCourse: null,
    currentLesson: null,
    notes: [],
    pyqs: [],
    aiHistory: [],
    graphifyFile: null,
    graphifyZoom: 1.0,
    graphifyPage: 1,
    searchResults: [],
    streak: 0,
  },

  _listeners: {},

  get(key) { return this._state[key]; },

  set(key, value) {
    this._state[key] = value;
    (this._listeners[key] || []).forEach(fn => fn(value));
    (this._listeners['*'] || []).forEach(fn => fn(key, value));
  },

  update(key, updater) {
    this.set(key, updater(this._state[key]));
  },

  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return () => {
      this._listeners[key] = (this._listeners[key] || []).filter(l => l !== fn);
    };
  },

  // Toast helper
  toast(message, type = 'info', duration = 3500) {
    this.set('toast', { message, type, id: Date.now() });
    setTimeout(() => this.set('toast', null), duration);
  },
};

window.AppStore = Store;
