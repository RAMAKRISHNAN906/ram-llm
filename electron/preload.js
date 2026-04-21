const { contextBridge } = require('electron');

// Expose app info to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
});
