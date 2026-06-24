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
} = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// Recent whisper.cpp renamed `main` → `whisper-cli`. If your build produces a
// different name, fix this path rather than assuming.
const WHISPER_CLI = path.join(ROOT, 'vendor', 'whisper.cpp', 'build', 'bin', 'whisper-cli');
const MODEL = path.join(ROOT, 'vendor', 'whisper.cpp', 'models', 'ggml-base.en.bin');

const HOTKEY = 'Control+Alt+Space'; // Ctrl+Option+Space on a Mac keyboard.

let tray = null;
let recorderWin = null; // hidden; owns getUserMedia
let panelWin = null; // floating HUD
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
  if (!fs.existsSync(WHISPER_CLI) || !fs.existsSync(MODEL)) {
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
    const args = ['-m', MODEL, '-f', wavPath, '-nt', '-np'];
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

  if (!t) return '';

  // Capitalize the first letter and ensure terminal punctuation.
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';

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

function trayIcon() {
  // A tiny template image so it adapts to light/dark menu bars. Drawn inline so
  // the prototype needs no asset files.
  const img = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAW0lEQVR4nO3UsQ0AIAhE0XP%2Fne0sLEgM8V8DyRUUBQAAAPCgJDlJ3rZ7kpVkJdkmuUmWJDfJ2navJFeSm%2BS2eyVZk5wkb9s9yUqykqxJ7iR32z3JSrIm%2Bdq9kjwAAAAAAAAAAAAAAAAA8L8DYwAGAUo1iQAAAABJRU5ErkJggg=='
  );
  img.setTemplateImage(true);
  return img;
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'Murmur — offline dictation', enabled: false },
    { type: 'separator' },
    { label: `Dictate (${HOTKEY})`, click: toggleDictation },
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

  const ok = globalShortcut.register(HOTKEY, toggleDictation);
  if (!ok) {
    // Don't die silently — make the failure visible.
    tray.setTitle(' ⚠︎');
  }
});

// Stay resident when the (hidden) windows "close".
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
