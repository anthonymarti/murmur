# Murmur

**Offline, private voice dictation for macOS.** Hold a global hotkey, speak, and
polished text is pasted into whatever app is focused. The entire pipeline runs
on-device — your audio never leaves the machine, there's no per-word cost, and it
works with no network connection.

It's a free, private, offline alternative to cloud dictation tools like Wispr Flow.

## How it works

```
Ctrl+Option+Space  →  capture mic  →  16kHz mono WAV  →  whisper.cpp (local)
                   →  offline cleanup  →  clipboard + Cmd+V into the active app
```

Transcription is done locally by [whisper.cpp](https://github.com/ggerganov/whisper.cpp)
using the `base.en` model. The cleanup pass (filler removal, capitalization,
punctuation) is plain regex — no network, no LLM.

## Requirements

- **macOS** (Apple Silicon recommended — whisper.cpp builds with Metal acceleration).
- **Xcode Command Line Tools**: `xcode-select --install`
- **cmake**: `brew install cmake`
- **Node.js 18+** and npm.

## Install & run

```bash
npm install        # install Electron
npm run setup      # clone + build whisper.cpp, download the base.en model (~142MB, one time)
npm start          # launch the tray app
```

`npm run setup` is a one-time step. It builds a native binary at
`vendor/whisper.cpp/build/bin/whisper-cli`, which is why whisper can't simply be
committed — it has to be compiled on your machine.

## Usage

1. Murmur lives in the **menu bar** (no Dock icon, no window).
2. Focus any text field in any app.
3. Press **`Ctrl+Option+Space`** — a floating pill shows _Listening…_
4. Speak.
5. Press **`Ctrl+Option+Space`** again — Murmur transcribes, cleans up, and pastes.

## Permissions

macOS will prompt for two permissions the first time:

- **Microphone** — to capture your voice.
- **Accessibility** — to perform the synthetic Cmd+V paste
  (System Settings → Privacy & Security → Accessibility).

If either is missing, the floating pill shows an error explaining what to grant.

## Privacy

The core loop is **offline by default**. Audio is recorded to a temporary WAV,
transcribed locally, and the WAV is deleted immediately after. Nothing is sent
anywhere. Any future networked features (e.g. optional LLM polish) will be strictly
opt-in and bring-your-own-key.

## Project layout

| Path | What it does |
| --- | --- |
| `scripts/setup.js` | Builds whisper.cpp and downloads the model. |
| `src/main/main.js` | Tray app, hotkey, whisper invocation, cleanup, paste. |
| `src/main/preload.js` | contextIsolated IPC bridge. |
| `src/renderer/recorder.html` | Hidden window: mic capture, downsample, WAV encode. |
| `src/renderer/panel.html` | Floating HUD (listening / transcribing / done). |

## License

MIT.
