export function Privacy() {
  return (
    <section id="privacy" className="border-y border-border bg-surface/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-xs font-medium text-ok">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            Zero data leaves your device
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your voice is yours.
          </h2>
          <p className="mt-4 max-w-md leading-7 text-muted">
            Cloud processing of voice is the single biggest concern people have with dictation
            tools. Murmur sidesteps it entirely: there is no server to send audio to. The model
            lives on your Mac, and the core loop never makes a network request.
          </p>
          <p className="mt-4 max-w-md leading-7 text-muted">
            Any future cloud-assisted polish will be strictly opt-in and bring-your-own-key —
            off by default, always.
          </p>
        </div>

        <ul className="space-y-4">
          {[
            "Recorded audio is deleted right after transcription.",
            "No account, no login, no tracking.",
            "No telemetry or analytics in the core app.",
            "Open source — verify every claim yourself.",
          ].map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none text-ok" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm leading-6 text-fg">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
