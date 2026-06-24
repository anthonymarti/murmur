const STEPS = [
  {
    title: "Press the hotkey",
    body: "A global shortcut starts capture from anywhere. A small floating pill shows you it's listening.",
  },
  {
    title: "Speak naturally",
    body: "Your mic is recorded locally and encoded to the exact format the on-device model expects.",
  },
  {
    title: "Transcribe on-device",
    body: "whisper.cpp runs locally with Metal acceleration — no audio ever leaves your Mac.",
  },
  {
    title: "Clean up & paste",
    body: "Filler is stripped, punctuation and casing fixed, your custom terms applied — then it's pasted into the focused app.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From thought to text in two keystrokes.
          </h2>
          <p className="mt-4 text-muted">
            The entire pipeline is local. Press to start, press to finish.
          </p>
        </div>

        <ol className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-muted/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 font-mono text-sm text-accent">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
