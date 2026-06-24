import { Wordmark } from "./Logo";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="text-fg">
          <Wordmark className="text-base" />
        </a>
        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-fg">
              {l.label}
            </a>
          ))}
        </div>
        <a
          href="#get"
          className="rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Get Murmur
        </a>
      </nav>
    </header>
  );
}
