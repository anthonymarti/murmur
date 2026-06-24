const ROWS = [
  { label: "Price", murmur: "Free, forever", cloud: "Monthly subscription" },
  { label: "Where audio goes", murmur: "Stays on your Mac", cloud: "Uploaded to the cloud" },
  { label: "Works offline", murmur: "Yes — no network needed", cloud: "No — requires internet" },
  { label: "Account required", murmur: "None", cloud: "Sign-up required" },
  { label: "Per-word cost", murmur: "Zero", cloud: "Metered / capped" },
  { label: "Source code", murmur: "Open source", cloud: "Closed" },
];

export function Comparison() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          The cloud was never the point.
        </h2>
        <p className="mt-4 text-balance text-muted">
          Cloud dictation tools are powerful — but they upload your voice, charge monthly,
          and stop working offline. Murmur does the whole thing on your machine.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-surface-2 text-sm font-medium">
          <div className="px-5 py-4 text-muted" />
          <div className="px-5 py-4 text-fg">Murmur</div>
          <div className="px-5 py-4 text-muted">Cloud dictation</div>
        </div>
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1.2fr_1fr_1fr] text-sm ${
              i % 2 ? "bg-surface/40" : "bg-transparent"
            }`}
          >
            <div className="px-5 py-4 text-muted">{row.label}</div>
            <div className="flex items-center gap-2 px-5 py-4 font-medium text-fg">
              <Check /> {row.murmur}
            </div>
            <div className="px-5 py-4 text-muted">{row.cloud}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 flex-none text-ok" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
