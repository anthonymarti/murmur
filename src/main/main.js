'use strict';

// Murmur main process: tray-resident app that orchestrates the dictation loop.
//   hotkey → recorder window captures mic → WAV → whisper-cli → cleanup → paste
// Everything here is offline. The renderer owns the mic; main owns whisper,
// the clipboard, and the synthetic paste.

const {
  app,
  Tray,
  Menu,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  clipboard,
  nativeImage,
  shell,
  systemPreferences,
} = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('./config');

const ROOT = path.resolve(__dirname, '..', '..');
const MODELS_DIR = path.join(ROOT, 'vendor', 'whisper.cpp', 'models');

// Recent whisper.cpp renamed `main` → `whisper-cli`. If your build produces a
// different name, fix this path rather than assuming.
const WHISPER_CLI = path.join(ROOT, 'vendor', 'whisper.cpp', 'build', 'bin', 'whisper-cli');

// The active model is configurable; resolve it from settings each time.
function modelPath() {
  return path.join(MODELS_DIR, config.load().model);
}

let tray = null;
let recorderWin = null; // hidden; owns getUserMedia
let panelWin = null; // floating HUD
let settingsWin = null; // visible settings window (created on demand)
let isRecording = false;
let busy = false; // true while transcribing/pasting — ignore hotkey re-entry

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------

function createRecorderWindow() {
  recorderWin = new BrowserWindow({
    show: false,
    width: 1,
    height: 1,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  recorderWin.loadFile(path.join(ROOT, 'src', 'renderer', 'recorder.html'));
}

function createPanelWindow() {
  panelWin = new BrowserWindow({
    width: 220,
    height: 72,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    focusable: false, // never steal focus from the app being dictated into
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  panelWin.loadFile(path.join(ROOT, 'src', 'renderer', 'panel.html'));
  panelWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

function positionPanel() {
  if (!panelWin) return;
  // Bottom-center of the primary display, just above the Dock.
  const { screen } = require('electron');
  const { workArea } = screen.getPrimaryDisplay();
  const [w, h] = panelWin.getSize();
  const x = Math.round(workArea.x + (workArea.width - w) / 2);
  const y = Math.round(workArea.y + workArea.height - h - 24);
  panelWin.setPosition(x, y);
}

function showPanel(state, text) {
  if (!panelWin) return;
  positionPanel();
  panelWin.showInactive(); // show without taking focus
  panelWin.webContents.send('panel:state', { state, text });
}

function setPanelState(state, text) {
  if (panelWin) panelWin.webContents.send('panel:state', { state, text });
}

function hidePanel(delayMs = 0) {
  if (!panelWin) return;
  setTimeout(() => panelWin && panelWin.hide(), delayMs);
}

// ---------------------------------------------------------------------------
// The dictation loop
// ---------------------------------------------------------------------------

function toggleDictation() {
  if (busy) return; // mid-transcription; ignore until done

  if (!isRecording) {
    if (!preflight()) return;
    isRecording = true;
    showPanel('recording');
    recorderWin.webContents.send('recorder:start');
    updateTrayTitle();
  } else {
    isRecording = false;
    busy = true;
    setPanelState('transcribing');
    recorderWin.webContents.send('recorder:stop');
    updateTrayTitle();
  }
}

// Verify the local toolchain exists before we bother recording.
function preflight() {
  if (!fs.existsSync(WHISPER_CLI) || !fs.existsSync(modelPath())) {
    showPanel('error', 'Run `npm run setup` first');
    hidePanel(2600);
    return false;
  }
  return true;
}

// Renderer hands us the finished 16kHz mono WAV as a Buffer.
ipcMain.on('recorder:wav', async (_evt, arrayBuffer) => {
  const buf = Buffer.from(arrayBuffer);
  if (buf.length < 1024) {
    // Nothing meaningful captured (e.g. instant double-tap).
    setPanelState('done', '');
    hidePanel(900);
    busy = false;
    return;
  }

  const wavPath = path.join(os.tmpdir(), `murmur-${Date.now()}.wav`);
  try {
    fs.writeFileSync(wavPath, buf);
    const raw = await transcribe(wavPath);
    const text = cleanup(raw);

    if (!text) {
      setPanelState('done', '');
      hidePanel(900);
      return;
    }

    clipboard.writeText(text);
    await pasteIntoActiveApp();
    setPanelState('done', text);
    hidePanel(1400);
  } catch (err) {
    setPanelState('error', err.message || 'Transcription failed');
    hidePanel(2800);
  } finally {
    fs.rm(wavPath, { force: true }, () => {});
    busy = false;
  }
});

// Run whisper.cpp on the WAV and return the raw transcript from stdout.
function transcribe(wavPath) {
  return new Promise((resolve, reject) => {
    // -nt  no timestamps   -np  no progress prints   -otxt off (we read stdout)
    const args = ['-m', modelPath(), '-f', wavPath, '-nt', '-np'];
    execFile(WHISPER_CLI, args, { maxBuffer: 1024 * 1024 * 16 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`whisper failed: ${stderr.trim() || err.message}`));
      }
      resolve(stdout);
    });
  });
}

// ---------------------------------------------------------------------------
// Offline cleanup — regex only. No network, no LLM. (LLM polish is a future,
// opt-in phase; the core loop must never depend on it.)
// ---------------------------------------------------------------------------

function cleanup(raw) {
  let t = (raw || '').replace(/\r/g, '').trim();
  if (!t) return '';

  // whisper sometimes brackets non-speech, e.g. [BLANK_AUDIO], (music).
  t = t.replace(/\[[^\]]*\]|\([^)]*\)/g, ' ');

  // Collapse whitespace/newlines into single spaces.
  t = t.replace(/\s+/g, ' ').trim();

  // Strip standalone filler words (um, uh, er, hmm, and leading "like,"/"you know,").
  t = t.replace(/\b(um+|uh+|er+|ah+|hmm+)\b[,]?/gi, ' ');
  t = t.replace(/\b(you know|i mean|like|sort of|kind of)\b[,]?(?=\s)/gi, (m) => {
    // Only drop these when clearly filler (followed by space); keep otherwise rare.
    return ' ';
  });

  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+([,.!?;:])/g, '$1'); // no space before punctuation
  t = t.replace(/([,.!?;:])(?=[^\s])/g, '$1 '); // ensure space after punctuation

  // Apply the user's custom dictionary (names/jargon whisper mishears).
  t = applyDictionary(t);

  if (!t) return '';

  // Capitalize the first letter and ensure terminal punctuation.
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';

  return t;
}

// Replace each spoken form with its written form, case-insensitively and on
// whole-word boundaries. The replacement is verbatim (so "Neverday" keeps its
// capitalization), and a bad/empty entry is skipped rather than throwing.
function applyDictionary(text) {
  const dict = config.load().dictionary || [];
  let t = text;
  for (const entry of dict) {
    const from = (entry.from || '').trim();
    if (!from) continue;
    const to = entry.to || '';
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      t = t.replace(new RegExp(`\\b${esc}\\b`, 'gi'), () => to);
    } catch {
      /* skip malformed entry */
    }
  }
  return t;
}

// ---------------------------------------------------------------------------
// Synthetic paste via AppleScript (requires Accessibility permission).
// ---------------------------------------------------------------------------

function pasteIntoActiveApp() {
  return new Promise((resolve, reject) => {
    const script = 'tell application "System Events" to keystroke "v" using command down';
    execFile('osascript', ['-e', script], (err, _stdout, stderr) => {
      if (err) {
        return reject(
          new Error(
            'Paste blocked — grant Accessibility permission to Murmur ' +
              '(System Settings → Privacy & Security → Accessibility).'
          )
        );
      }
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Tray
// ---------------------------------------------------------------------------

// Draw a microphone glyph as a raw RGBA bitmap rather than embedding an opaque
// base64 PNG (which rendered invisible). As a macOS template image only the
// alpha matters — the system inverts the ink for light/dark menu bars — so the
// pixels are black with per-pixel alpha for anti-aliasing.
function trayIcon() {
  const S = 36; // 36px buffer shown at 18pt via scaleFactor 2 (retina-crisp)
  const buf = Buffer.alloc(S * S * 4); // zero-filled = fully transparent

  // Coverage of a point by a thick line segment (a "stadium"/capsule shape).
  const segCoverage = (px, py, ax, ay, bx, by, radius) => {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    return Math.max(0, Math.min(1, radius + 0.5 - d));
  };

  // Coverage of a point by an arc ring (lower half only → the mic's U-stand).
  const arcCoverage = (px, py, cx, cy, radius, thick) => {
    if (py < cy) return 0;
    const d = Math.abs(Math.hypot(px - cx, py - cy) - radius);
    return Math.max(0, Math.min(1, thick + 0.5 - d));
  };

  const cx = S / 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let a = 0;
      a = Math.max(a, segCoverage(px, py, cx, 9, cx, 18, 4.5)); // mic body capsule
      a = Math.max(a, arcCoverage(px, py, cx, 18.5, 8, 1.4)); //   stand arc (U)
      a = Math.max(a, segCoverage(px, py, cx, 26.5, cx, 30, 1.2)); // stem
      a = Math.max(a, segCoverage(px, py, cx - 5, 30.5, cx + 5, 30.5, 1.2)); // base
      if (a > 0) {
        const i = (y * S + x) * 4;
        buf[i + 3] = Math.round(a * 255); // alpha only; RGB stay 0 (black ink)
      }
    }
  }

  const img = nativeImage.createFromBitmap(buf, { width: S, height: S, scaleFactor: 2 });
  img.setTemplateImage(true);
  return img;
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'Murmur — offline dictation', enabled: false },
    { type: 'separator' },
    { label: `Dictate (${config.load().hotkey})`, click: toggleDictation },
    { label: 'Settings…', click: openSettings },
    {
      label: 'Open whisper folder',
      click: () => shell.openPath(path.join(ROOT, 'vendor', 'whisper.cpp')),
    },
    { type: 'separator' },
    { label: 'Quit Murmur', click: () => app.quit() },
  ]);
}

function updateTrayTitle() {
  if (!tray) return;
  tray.setTitle(isRecording ? ' ●' : ''); // red-dot-ish hint while recording
}

// Register the configured global hotkey, replacing any prior binding. Returns
// true on success; a false result means the accelerator was invalid or already
// claimed by another app.
function registerHotkey() {
  globalShortcut.unregisterAll();
  const ok = globalShortcut.register(config.load().hotkey, toggleDictation);
  if (tray) tray.setTitle(ok ? '' : ' ⚠︎'); // warn in the menu bar if it failed
  return ok;
}

// ---------------------------------------------------------------------------
// Settings window
// ---------------------------------------------------------------------------

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 460,
    height: 540,
    resizable: false,
    title: 'Murmur Settings',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWin.loadFile(path.join(ROOT, 'src', 'renderer', 'settings.html'));
  settingsWin.once('ready-to-show', () => settingsWin.show());
  settingsWin.on('closed', () => {
    settingsWin = null;
  });
}

// Models present on disk — drives the settings model picker.
function listModels() {
  try {
    return fs
      .readdirSync(MODELS_DIR)
      .filter((f) => f.endsWith('.bin'))
      .sort();
  } catch {
    return [];
  }
}

// Live macOS permission status for the two things the core loop needs.
function permissionStatus() {
  return {
    // 'granted' | 'denied' | 'restricted' | 'not-determined'
    microphone: systemPreferences.getMediaAccessStatus('microphone'),
    accessibility: systemPreferences.isTrustedAccessibilityClient(false),
  };
}

function snapshot() {
  const s = config.load();
  return {
    hotkey: s.hotkey,
    model: s.model,
    models: listModels(),
    dictionary: s.dictionary || [],
    permissions: permissionStatus(),
  };
}

// --- Settings IPC (invoke/handle: request → response) ---

ipcMain.handle('settings:get', () => snapshot());

ipcMain.handle('settings:set', (_e, patch) => {
  // A hotkey change must actually bind before we keep it — otherwise the user
  // could lock themselves out with an invalid or taken accelerator.
  if (patch.hotkey && patch.hotkey !== config.load().hotkey) {
    const prev = config.load().hotkey;
    config.save({ hotkey: patch.hotkey });
    if (!registerHotkey()) {
      config.save({ hotkey: prev }); // revert
      registerHotkey();
      tray.setContextMenu(buildTrayMenu());
      return { ok: false, error: 'That shortcut is invalid or already in use.', ...snapshot() };
    }
  }
  if (patch.model) config.save({ model: patch.model });
  if (Array.isArray(patch.dictionary)) config.save({ dictionary: patch.dictionary });
  tray.setContextMenu(buildTrayMenu()); // reflect new hotkey label
  return { ok: true, ...snapshot() };
});

ipcMain.handle('settings:requestMic', async () => {
  // Triggers the macOS mic prompt if still undecided; no-op if already set.
  await systemPreferences.askForMediaAccess('microphone');
  return permissionStatus();
});

ipcMain.handle('settings:openPrivacy', (_e, which) => {
  const pane =
    which === 'accessibility'
      ? 'com.apple.preference.security?Privacy_Accessibility'
      : 'com.apple.preference.security?Privacy_Microphone';
  shell.openExternal(`x-apple.systempreferences:${pane}`);
  return true;
});

ipcMain.handle('settings:permissions', () => permissionStatus());

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide(); // tray-only, no Dock icon

  createRecorderWindow();
  createPanelWindow();

  tray = new Tray(trayIcon());
  tray.setToolTip('Murmur — offline dictation');
  tray.setContextMenu(buildTrayMenu());

  registerHotkey();
});

// Stay resident when the (hidden) windows "close".
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
