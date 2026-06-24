import { REPO_URL, HOTKEY } from "@/lib/site";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" />
      <div className="glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px]" />

      <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center sm:pt-32">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition-colors hover:text-fg"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          Open source · Runs 100% on-device
        </a>

        <h1 className="mx-auto mt-7 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Dictation that never
          <br className="hidden sm:block" /> leaves your Mac.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-8 text-muted">
          Hold a hotkey, speak, and polished text is pasted into whatever app you&apos;re
          in. Transcription runs locally — no cloud, no subscription, no account.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#get"
            className="w-full rounded-full bg-fg px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 sm:w-auto"
          >
            Get Murmur — free
          </a>
          <a
            href="#how"
            className="w-full rounded-full border border-border bg-surface px-6 py-3 font-medium text-fg transition-colors hover:border-muted sm:w-auto"
          >
            See how it works
          </a>
        </div>

        <p className="mt-5 text-sm text-muted">
          macOS · Apple Silicon · press{" "}
          <kbd className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-fg">
            {HOTKEY}
          </kbd>{" "}
          to dictate
        </p>

        <HudMock />
      </div>
    </section>
  );
}

// A static recreation of the floating HUD pill the app shows while dictating.
function HudMock() {
  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <div className="rounded-2xl border border-border bg-surface/60 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 rounded-full bg-[#1c1c1e] px-5 py-3 shadow-2xl ring-1 ring-white/5">
            <span className="pulse-dot h-3 w-3 rounded-full bg-danger" />
            <span className="text-sm font-medium text-white/90">Listening…</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Step n="1" label="Press hotkey" />
            <Arrow />
            <Step n="2" label="Speak" />
            <Arrow />
            <Step n="3" label="Press again" />
            <Arrow />
            <Step n="4" label="Pasted ✓" highlight />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, highlight }: { n: string; label: string; highlight?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        highlight ? "border-ok/40 text-ok" : "border-border text-muted"
      }`}
    >
      <span className="opacity-60">{n}</span>
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-border">→</span>;
}
