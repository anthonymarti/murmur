'use strict';

// Persisted user settings. Stored as JSON in Electron's per-user data dir so it
// survives app restarts and never lives in the repo. Tiny on purpose — the app
// stays lightweight and the defaults must always produce a working core loop.

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  hotkey: 'Control+Alt+Space', // Ctrl+Option+Space
  model: 'ggml-base.en.bin', // filename inside vendor/whisper.cpp/models
  dictionary: [], // [{ from, to }] spoken→written substitutions for names/jargon
  streaming: true, // live preview while dictating (re-transcribes the growing buffer)
};

let cached = null;

function file() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function load() {
  if (cached) return cached;
  try {
    cached = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file(), 'utf8')) };
  } catch {
    cached = { ...DEFAULTS }; // missing/corrupt → fall back to working defaults
  }
  return cached;
}

// Merge a patch, persist, and return the new settings. Persist failures are
// non-fatal: the in-memory settings still apply for this session.
function save(patch) {
  cached = { ...load(), ...patch };
  try {
    fs.writeFileSync(file(), JSON.stringify(cached, null, 2));
  } catch {
    /* non-fatal */
  }
  return cached;
}

module.exports = { load, save, DEFAULTS };
