
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: process.versions,
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleMaximize: () => ipcRenderer.send('window-toggle-maximize'),
    close: () => ipcRenderer.send('window-close'),
    hide: () => ipcRenderer.send('window-hide')
  }
});

contextBridge.exposeInMainWorld('electronAlways', {
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', !!flag),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top')
});

// Expose API for running macsploit scripts and Haskell files
contextBridge.exposeInMainWorld('electronApi', {
  runMacsploit: (script, port = 5553) => ipcRenderer.invoke('macsploit-execute', { script, port }),
  runHaskellFile: (filePath, args = []) => ipcRenderer.invoke('run-haskell-file', { filePath, args })
});

contextBridge.exposeInMainWorld('electronApiCheck', {
  checkMacsploit: (port = 5553, timeout = 400) => ipcRenderer.invoke('macsploit-check', { port, timeout })
});
