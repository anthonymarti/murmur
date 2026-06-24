import { REPO_URL } from "@/lib/site";
import { Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <div>
          <Wordmark className="text-sm" />
          <p className="mt-2 text-xs text-muted">
            Private, offline voice dictation for macOS.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#how" className="transition-colors hover:text-fg">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-fg">
            Features
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fg"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted">
        Built with whisper.cpp · Open source · © {new Date().getFullYear()} Murmur
      </div>
    </footer>
  );
}
