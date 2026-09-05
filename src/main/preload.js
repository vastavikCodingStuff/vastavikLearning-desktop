/**
 * Vastavik Learning Desktop — Preload Script
 * Exposes a secure, typed API surface to the renderer via contextBridge.
 * nodeIntegration is OFF — all Node/Electron access is proxied through here.
 */

const { contextBridge, ipcRenderer } = require('electron');

// ── Safe IPC invoke wrapper ──────────────────────────────────────────────────
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
const on = (channel, listener) => {
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

// ── Exposed API ───────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('vastavik', {
  // Window controls
  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close'),
    isMaximized: () => invoke('window:isMaximized'),
    onNav: (cb) => on('nav:home', cb),
  },

  // Navigation events from menu
  nav: {
    onHome: (cb) => on('nav:home', () => cb('home')),
    onCourses: (cb) => on('nav:courses', () => cb('courses')),
    onAI: (cb) => on('nav:ai', () => cb('ai-chat')),
    onGraphify: (cb) => on('nav:graphify', () => cb('graphify')),
    onPYQ: (cb) => on('nav:pyq', () => cb('pyq')),
    onNotes: (cb) => on('nav:notes', () => cb('notes')),
    onZoomIn: (cb) => on('zoom:in', cb),
    onZoomOut: (cb) => on('zoom:out', cb),
    onZoomReset: (cb) => on('zoom:reset', cb),
  },

  // Theme
  theme: {
    get: () => invoke('theme:get'),
    set: (theme) => invoke('theme:set', theme),
  },

  // Persistent key-value store
  store: {
    get: (key, defaultValue) => invoke('store:get', key, defaultValue),
    set: (key, value) => invoke('store:set', key, value),
    delete: (key) => invoke('store:delete', key),
  },

  // HTTP API requests (proxied through main to avoid CORS)
  api: {
    request: (opts) => invoke('api:request', opts),
  },

  // File system (sandboxed operations)
  file: {
    openDialog: (options) => invoke('dialog:openFile', options),
    read: (filePath) => invoke('file:read', filePath),
    save: (opts) => invoke('file:save', opts),
  },

  // Shell
  shell: {
    openExternal: (url) => invoke('shell:openExternal', url),
    openPath: (p) => invoke('shell:openPath', p),
  },

  // App info
  app: {
    getVersion: () => invoke('app:getVersion'),
    getPlatform: () => invoke('app:getPlatform'),
    isDev: () => invoke('app:isDev'),
  },

  // Notifications
  notification: {
    show: (title, body) => invoke('notification:show', { title, body }),
  },
});
