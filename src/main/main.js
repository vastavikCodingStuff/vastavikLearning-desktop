/**
 * Vastavik Learning Desktop — Main Process
 * Electron entry point: window management, IPC handlers, security
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  nativeTheme,
  Menu,
  Tray,
  globalShortcut,
} = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const isDev = process.argv.includes('--dev') || !app.isPackaged;

// ── Persistent store (electron-store) ──────────────────────────────────────
let store;
(async () => {
  try {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'vastavik-prefs',
      defaults: {
        theme: 'light',
        fontSize: 16,
        backendUrl: 'https://api.vastaviklearning.com',
        windowBounds: { width: 1280, height: 800 },
        zoom: 1.0,
      },
    });
  } catch {
    // Fallback in-memory store
    const data = {};
    store = {
      get: (k, def) => (k in data ? data[k] : def),
      set: (k, v) => { data[k] = v; },
      delete: (k) => { delete data[k]; },
    };
  }
})();

// ── Window reference ────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;

function createWindow() {
  const bounds = store ? store.get('windowBounds', { width: 1280, height: 800 }) : { width: 1280, height: 800 };

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 900,
    minHeight: 600,
    title: 'Vastavik Learning',
    backgroundColor: '#ffffff',
    show: false, // show after ready-to-show for smooth launch
    frame: false, // custom titlebar
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload fs access
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
  });

  // Load app
  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  // Graceful show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Persist window size
  mainWindow.on('resize', () => {
    if (store) store.set('windowBounds', mainWindow.getBounds());
  });

  // Open external links in default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  setupMenu();
  setupGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ── Application menu ─────────────────────────────────────────────────────────
function setupMenu() {
  const template = [
    {
      label: 'Vastavik',
      submenu: [
        { label: 'About Vastavik Learning', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.reload() },
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow?.webContents.send('zoom:in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow?.webContents.send('zoom:out') },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.send('zoom:reset') },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Home', accelerator: 'CmdOrCtrl+H', click: () => mainWindow?.webContents.send('nav:home') },
        { label: 'Courses', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('nav:courses') },
        { label: 'AI Tutor', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('nav:ai') },
        { label: 'Graphify Reader', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('nav:graphify') },
        { label: 'PYQ Archive', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('nav:pyq') },
        { label: 'My Notes', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.send('nav:notes') },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { label: 'Select All', role: 'selectAll' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Global shortcuts ──────────────────────────────────────────────────────────
function setupGlobalShortcuts() {
  globalShortcut.register('F5', () => mainWindow?.webContents.reload());
}

// ═══════════════════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Window controls (custom titlebar) ────────────────────────────────────────
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

// ── Theme ─────────────────────────────────────────────────────────────────────
ipcMain.handle('theme:get', () => store?.get('theme', 'light') ?? 'light');
ipcMain.handle('theme:set', (_e, theme) => {
  store?.set('theme', theme);
  nativeTheme.themeSource = theme;
  return true;
});

// ── Store ─────────────────────────────────────────────────────────────────────
ipcMain.handle('store:get', (_e, key, def) => store?.get(key, def));
ipcMain.handle('store:set', (_e, key, val) => { store?.set(key, val); return true; });
ipcMain.handle('store:delete', (_e, key) => { store?.delete(key); return true; });

// ── HTTP API proxy (avoids CORS issues in renderer) ──────────────────────────
ipcMain.handle('api:request', async (_e, { method, url, headers, body }) => {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VastavikLearning-Desktop/1.0',
          ...headers,
        },
        timeout: 15000,
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
          }
        });
      });

      req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, error: 'Request timed out' }); });

      if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
      req.end();
    } catch (err) {
      resolve({ ok: false, status: 0, error: err.message });
    }
  });
});

// ── File dialog (open PDF/images for Graphify) ───────────────────────────────
ipcMain.handle('dialog:openFile', async (_e, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open File for Graphify',
    filters: [
      { name: 'Study Materials', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] },
      { name: 'PDF Documents', extensions: ['pdf'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
    ...options,
  });
  return result;
});

// ── Read file for Graphify ────────────────────────────────────────────────────
ipcMain.handle('file:read', async (_e, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext)) {
      const base64 = buffer.toString('base64');
      const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
      return { type: 'image', dataUrl: `data:${mimeMap[ext] || 'image/jpeg'};base64,${base64}`, name: path.basename(filePath) };
    }

    if (ext === '.pdf') {
      const base64 = buffer.toString('base64');
      return { type: 'pdf', dataUrl: `data:application/pdf;base64,${base64}`, name: path.basename(filePath), size: buffer.length };
    }

    // Text files
    return { type: 'text', content: buffer.toString('utf8'), name: path.basename(filePath) };
  } catch (err) {
    return { error: err.message };
  }
});

// ── Save note to file ─────────────────────────────────────────────────────────
ipcMain.handle('file:save', async (_e, { content, defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'vastavik-note.txt',
    filters: filters || [{ name: 'Text Files', extensions: ['txt', 'md'] }],
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { saved: true, filePath: result.filePath };
  }
  return { saved: false };
});

// ── Shell ─────────────────────────────────────────────────────────────────────
ipcMain.handle('shell:openExternal', (_e, url) => shell.openExternal(url));
ipcMain.handle('shell:openPath', (_e, filePath) => shell.openPath(filePath));

// ── App info ──────────────────────────────────────────────────────────────────
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getPlatform', () => process.platform);
ipcMain.handle('app:isDev', () => isDev);

// ── Notification proxy ────────────────────────────────────────────────────────
ipcMain.handle('notification:show', (_e, { title, body }) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, '../../assets/icons/icon.png') }).show();
  }
});
