const { app, BrowserWindow, Menu, shell } = require('electron');
const path   = require('path');
const http   = require('http');
const { spawn } = require('child_process');

// process.defaultApp is set by Electron when run via `electron .` (dev mode)
// It is undefined when running from a packaged app
const isDev = !!process.defaultApp || /[\\/]electron/.test(process.execPath);

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL  = 'http://localhost:3001';
const BACKEND_PORT = 3001;

let mainWindow;
let backendProc;

// ── Start backend ─────────────────────────────────────────────────────────────
function startBackend() {
  const backendEntry = isDev
    ? path.join(__dirname, '..', 'backend', 'server.js')
    : path.join(process.resourcesPath, 'backend', 'server.js');

  const cwd = isDev
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'backend');

  backendProc = spawn(process.execPath.replace('electron.exe', 'node.exe').replace(/electron/i, 'node'), [backendEntry], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env },
  });

  // Fallback: try system node if above path fails
  backendProc.on('error', () => {
    backendProc = spawn('node', [backendEntry], { cwd, stdio: 'pipe', env: { ...process.env } });
    backendProc.stdout?.on('data', d => console.log('[backend]', d.toString().trim()));
    backendProc.stderr?.on('data', d => console.error('[backend err]', d.toString().trim()));
  });

  backendProc.stdout?.on('data', d => console.log('[backend]', d.toString().trim()));
  backendProc.stderr?.on('data', d => console.error('[backend err]', d.toString().trim()));
}

// ── Wait for backend to be ready ──────────────────────────────────────────────
function waitForBackend(tries = 40) {
  return new Promise((resolve) => {
    const attempt = (n) => {
      http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else if (n > 0) setTimeout(() => attempt(n - 1), 500);
        else resolve();
      }).on('error', () => {
        if (n > 0) setTimeout(() => attempt(n - 1), 500);
        else resolve();
      });
    };
    setTimeout(() => attempt(tries), 1000);
  });
}

// ── Create window ─────────────────────────────────────────────────────────────
async function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '..', 'frontend', 'public', 'logo.png')
    : path.join(process.resourcesPath, 'frontend', 'dist', 'logo.png');

  mainWindow = new BrowserWindow({
    width:  1280,
    height: 820,
    minWidth:  920,
    minHeight: 600,
    icon:  iconPath,
    title: 'RAM LLM',
    backgroundColor: '#1a1a2e',
    show: false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  Menu.setApplicationMenu(buildMenu());

  if (isDev) {
    await mainWindow.loadURL(FRONTEND_URL);
  } else {
    await mainWindow.loadURL(BACKEND_URL);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'RAM LLM',
      submenu: [
        { label: 'About', click: () => {
          const { dialog } = require('electron');
          dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'RAM LLM',
            message: 'RAM LLM — Local AI Desktop',
            detail: 'deepseek-coder:6.7b via Ollama\nBuilt with Electron + React\n\n© Ramakrishnan',
          });
        }},
        { type: 'separator' },
        { label: 'Quit RAM LLM', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload',           accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload',      accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'zoomIn',           accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut',          accelerator: 'CmdOrCtrl+-' },
        { role: 'resetZoom',        accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { role: 'togglefullscreen', accelerator: 'F11' },
      ],
    },
    {
      label: 'Dev',
      submenu: [
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      ],
    },
  ]);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log('[electron] mode:', isDev ? 'development' : 'production');

  if (!isDev) startBackend();   // in dev, backend is started separately via concurrently
  else {
    // dev: also start backend since concurrently may not have it yet
    startBackend();
  }

  await waitForBackend();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', killBackend);

function killBackend() {
  if (backendProc) {
    try { backendProc.kill('SIGTERM'); } catch (_) {}
    backendProc = null;
  }
}
