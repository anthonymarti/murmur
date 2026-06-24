"use client";

import { useState } from "react";
import { INSTALL_STEPS, REPO_URL } from "@/lib/site";

export function GetStarted() {
  return (
    <section id="get" className="mx-auto max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-12">
        <div className="glow pointer-events-none absolute inset-x-0 top-0 h-40" />
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Get Murmur running in a few minutes.
          </h2>
          <p className="mt-4 text-muted">
            It&apos;s open source. Clone the repo and run three commands — the setup builds the
            local model the first time.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {INSTALL_STEPS.map((step, i) => (
            <CommandRow key={step.cmd} index={i + 1} cmd={step.cmd} note={step.note} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-full bg-fg px-6 py-3 text-center font-medium text-bg transition-opacity hover:opacity-90 sm:w-auto"
          >
            View on GitHub
          </a>
          <span className="text-sm text-muted">Requires macOS, Xcode CLT, and cmake.</span>
        </div>
      </div>
    </section>
  );
}

function CommandRow({ index, cmd, note }: { index: number; cmd: string; note: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-bg/60 p-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-surface-2 font-mono text-xs text-accent">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <code className="block truncate font-mono text-sm text-fg">{cmd}</code>
        <span className="text-xs text-muted">{note}</span>
      </div>
      <button
        onClick={copy}
        className="flex-none rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-muted hover:text-fg"
        aria-label="Copy command"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
