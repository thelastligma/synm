const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');

function createWindow() {
  const win = new BrowserWindow({
    width: 920,
    height: 620,
    minWidth: 600,
    minHeight: 420,
    frame: false,
    transparent: true,
    hasShadow: false,
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // Uncomment to open devtools during development
  // win.webContents.openDevTools({ mode: 'right' });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC handlers for window controls
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on('window-hide', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.hide();
});

// Always-on-top handlers
ipcMain.on('set-always-on-top', (event, flag) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setAlwaysOnTop(!!flag);
});

ipcMain.handle('get-always-on-top', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isAlwaysOnTop() : false;
});

// Execute a script using the macsploit runner (ES module)
ipcMain.handle('macsploit-execute', async (event, { script = '', port = 5553 } = {}) => {
  const runner = path.join(__dirname, 'runners', 'macsploit-runner.mjs');
  if (!fs.existsSync(runner)) return { success: false, error: 'Runner not found' };

  // Normalize port parameter: allow single number or array of numbers (no 'all' shortcut)
  const ports = (function (p) {
    if (Array.isArray(p)) return p.map(Number);
    return [Number(p)];
  })(port);

  const tasks = ports.map((prt) => new Promise((resolve) => {
    const child = spawn(process.execPath, [runner, String(prt), Buffer.from(String(script)).toString('base64')], { cwd: __dirname, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      resolve({ port: prt, success: code === 0, code, stdout, stderr });
    });
    child.on('error', (err) => {
      resolve({ port: prt, success: false, error: err && (err.message || String(err)) });
    });
  }));

  const results = await Promise.all(tasks);
  if (results.length === 1) return results[0];
  return { success: results.every(r => r.success), results };
});

// Check if macsploit ports are reachable (fast TCP connect test)
ipcMain.handle('macsploit-check', async (event, { port = 5553, timeout = 400 } = {}) => {
  const normalize = (p) => {
    if (p === 'all' || p === 'ALL') return Array.from({ length: 10 }, (_, i) => 5553 + i);
    if (Array.isArray(p)) return p.map(Number);
    return [Number(p)];
  };

  const ports = normalize(port);
  const checks = await Promise.all(ports.map((prt) => new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const onDone = (result) => { if (done) return; done = true; try { socket.destroy(); } catch(e){} resolve({ port: prt, open: result }); };
    socket.setTimeout(timeout);
    socket.once('connect', () => onDone(true));
    socket.once('timeout', () => onDone(false));
    socket.once('error', () => onDone(false));
    socket.connect(prt, '127.0.0.1');
  })));

  return { anyOpen: checks.some(c => c.open), checks };
});

// Run a Haskell file using `runhaskell` if available
ipcMain.handle('run-haskell-file', async (event, { filePath = '', args = [] } = {}) => {
  return new Promise((resolve) => {
    if (!filePath) return resolve({ success: false, error: 'filePath is required' });
    const runhaskell = 'runhaskell';
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return resolve({ success: false, error: `File not found: ${fullPath}` });

    const child = spawn(runhaskell, [fullPath, ...args], { cwd: __dirname, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => { resolve({ success: code === 0, code, stdout, stderr }); });
    child.on('error', (err) => { resolve({ success: false, error: err && (err.message || String(err)) }); });
  });
});
