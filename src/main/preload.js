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
  // Live-preview snapshots: main asks, renderer encodes audio-so-far.
  onSnapshot: (cb) => ipcRenderer.on('recorder:snapshot', () => cb()),
  sendPartial: (arrayBuffer) => ipcRenderer.send('recorder:wav-partial', arrayBuffer),

  // --- panel.html ---
  onState: (cb) => ipcRenderer.on('panel:state', (_e, payload) => cb(payload)),

  // --- settings.html (request/response) ---
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch) => ipcRenderer.invoke('settings:set', patch),
    requestMic: () => ipcRenderer.invoke('settings:requestMic'),
    openPrivacy: (which) => ipcRenderer.invoke('settings:openPrivacy', which),
    permissions: () => ipcRenderer.invoke('settings:permissions'),
  },
});
