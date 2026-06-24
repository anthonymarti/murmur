'use strict';

// contextIsolated bridge. Renderers never touch Node directly — every
// renderer↔main message passes through this narrow, named surface.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('murmur', {
  // --- recorder.html ---
  onStart: (cb) => ipcRenderer.on('recorder:start', () => cb()),
  onStop: (cb) => ipcRenderer.on('recorder:stop', () => cb()),
  // Hand the finished WAV (ArrayBuffer) back to main for transcription.
  sendWav: (arrayBuffer) => ipcRenderer.send('recorder:wav', arrayBuffer),

  // --- panel.html ---
  onState: (cb) => ipcRenderer.on('panel:state', (_e, payload) => cb(payload)),
});
