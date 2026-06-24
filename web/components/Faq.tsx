const QA = [
  {
    q: "Does my audio ever leave my Mac?",
    a: "No. Recording, transcription, and cleanup all happen locally. The core loop makes no network requests, and the recorded audio file is deleted right after it's transcribed.",
  },
  {
    q: "Is it really free?",
    a: "Yes. Murmur is open source and free to run. Because transcription is on-device, there's no per-word cost and no subscription.",
  },
  {
    q: "What are the requirements?",
    a: "macOS on Apple Silicon is recommended (whisper.cpp builds with Metal acceleration). You'll need Xcode Command Line Tools and cmake to build the local model once during setup.",
  },
  {
    q: "Which apps does it work with?",
    a: "Any app with a text field. Murmur pastes into whatever is focused — code editors, browsers, chat apps, notes, email.",
  },
  {
    q: "Why does it need Accessibility permission?",
    a: "To paste the transcribed text into the active app with a synthetic ⌘V. macOS also asks for Microphone access the first time you dictate.",
  },
  {
    q: "How accurate is it?",
    a: "It uses OpenAI's Whisper model (base.en by default) running via whisper.cpp, with an offline cleanup pass that fixes punctuation, casing, and filler words. You can swap in a larger model for more accuracy.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Questions, answered.
      </h2>
      <div className="mt-12 divide-y divide-border border-y border-border">
        {QA.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.q}
              <span className="text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
