# CLAUDE.md — Murmur

This file orients you (Claude Code) to the project. Read it fully before editing.

## What Murmur is

Murmur is an **offline, private voice-dictation app for macOS** — a Wispr Flow
alternative. The user holds a global hotkey, speaks, and polished text is pasted
into whatever app is focused. The entire pipeline runs **on-device**: audio never
leaves the machine, there is no per-word cost, and it works with no network.

The wedge against Wispr Flow is exactly this: **free + private + offline**. Wispr
is cloud-only and subscription-based, and cloud processing of voice is its biggest
criticism. Murmur's whole reason to exist is that transcription is local and costs
nothing to run. Do not introduce mandatory cloud calls into the core loop — any
cloud/LLM features must be optional and BYO-key.

## The core loop (must always work)

```
Global hotkey (Ctrl+Option+Space)
  → start capture        (hidden renderer owns the mic)
  → hotkey again
  → encode 16kHz mono WAV (whisper.cpp's required input format)
  → whisper.cpp CLI       (local transcription, base.en model)
  → cleanup pass          (offline: strip filler, fix punctuation/caps)
  → clipboard + Cmd+V     (AppleScript synthetic paste into active app)
```

If a change would break or bypass this loop, stop and flag it.

## Current state (prototype, already scaffolded)

This repo is a **working prototype skeleton**, not a finished app. What exists:

- `package.json` — Electron app, one runtime dep (`node-global-key-listener`,
  currently unused; the main process uses Electron's built-in `globalShortcut`).
- `scripts/setup.js` — clones + builds whisper.cpp via cmake, downloads the
  `ggml-base.en.bin` model (~142MB). Run once with `npm run setup`.
- `src/main/main.js` — tray app, hotkey registration, recording orchestration,
  whisper invocation via `execFile`, offline cleanup, AppleScript paste.
- `src/main/preload.js` — contextIsolated IPC bridge.
- `src/renderer/recorder.html` — hidden window; captures mic with
  `getUserMedia` + `ScriptProcessorNode`, downsamples to 16kHz, encodes WAV.
- `src/renderer/panel.html` — floating HUD (recording/transcribing/done states).
- `README.md` — user-facing setup + run instructions.

The app currently has **no persistent window** — it lives in the menu-bar tray
and shows a floating HUD only while dictating. `app.dock.hide()` keeps it out of
the Dock. `window-all-closed` is intercepted so it stays resident.

## Hard technical constraints

- **Target macOS only** for now (Apple Silicon preferred — whisper.cpp builds
  with Metal acceleration by default). Cross-platform is a future phase.
- **whisper.cpp must build locally.** The binary is native and platform-specific;
  it cannot be committed or cross-compiled. `npm run setup` owns this.
- whisper.cpp expects **16kHz, mono, 16-bit PCM WAV**. The recorder downsamples
  from the AudioContext's native rate (usually 44.1/48kHz) — do not remove this.
- The whisper CLI binary is `vendor/whisper.cpp/build/bin/whisper-cli`. Recent
  whisper.cpp renamed `main` → `whisper-cli`; if a build produces a different
  name, fix the path in `main.js` rather than assuming.
- Two macOS permissions are required at runtime: **Microphone** and
  **Accessibility** (the latter for synthetic paste). The app degrades to a
  visible error state if transcription or paste can't run.

## Conventions

- Keep it **lightweight**: minimal dependencies, no heavy frameworks. Prefer
  Node/Electron built-ins over adding packages.
- Keep `contextIsolation: true`; all renderer↔main communication goes through
  the preload bridge. Never enable `nodeIntegration` in renderers.
- The core loop stays **offline by default**. Any networked feature is opt-in.
- Comments explain *why*, not *what*. Match the existing terse comment style.

## What's intentionally NOT built yet (future phases)

Don't assume these exist; build them only when asked:

1. **LLM cleanup pass** — tone/formatting polish beyond regex. BYO-key
   (Groq Llama, Claude Haiku) or a local small model. Must stay optional.
2. **Command mode** — operate on highlighted text ("make this concise",
   "turn into bullets").
3. **Custom dictionary** — consistent spelling of names/jargon.
4. **Voice snippets** — spoken triggers expand to saved text.
5. **Settings UI** — model picker, hotkey rebinding, permission status.
6. **Streaming transcription** — currently transcribes after stop, not live.
7. **Backend** — Next.js/Vercel + Supabase for marketing site, auth, dashboard,
   and cross-device sync of settings/dictionary. The desktop app is the product;
   the backend is support infrastructure only.

## Build/run commands

```bash
npm install        # install Electron
npm run setup      # build whisper.cpp + download model (one time)
npm start          # launch the tray app
```

## Definition of done for the prototype

The prototype is "working" when, on a clean Apple Silicon Mac with cmake and
Xcode CLT installed: `npm install && npm run setup && npm start` launches a tray
app, and pressing `Ctrl+Option+Space`, speaking a sentence, and pressing it again
results in cleaned-up text pasted into the focused field — with no network access.