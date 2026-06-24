const FEATURES = [
  {
    title: "Fully offline",
    body: "Transcription runs on-device with whisper.cpp. Turn off Wi-Fi and it still works.",
  },
  {
    title: "Private by design",
    body: "Audio is recorded to a temporary file, transcribed, and deleted immediately. Nothing is uploaded.",
  },
  {
    title: "Works in any app",
    body: "Output is pasted into whatever field is focused — your editor, browser, chat, notes.",
  },
  {
    title: "Custom dictionary",
    body: "Teach it the spelling of names and jargon so they come out right every time.",
  },
  {
    title: "Rebindable hotkey",
    body: "Pick the global shortcut that fits your hands. Change the model and more in Settings.",
  },
  {
    title: "Lightweight & native",
    body: "Lives in your menu bar, not your Dock. No Electron bloat in your face, no background telemetry.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need. Nothing you don&apos;t.
        </h2>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-surface p-7">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
