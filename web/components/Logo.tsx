// Microphone mark — the same glyph the desktop app draws in the menu bar.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="13.5" y="6" width="9" height="16" rx="4.5" fill="currentColor" stroke="none" />
      <path d="M10 18.5a8 8 0 0 0 16 0" />
      <path d="M18 26.5V30" />
      <path d="M13 30.5h10" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <Logo className="h-5 w-5 text-fg" />
      <span>Murmur</span>
    </span>
  );
}
