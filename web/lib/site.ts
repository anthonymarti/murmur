// Shared site constants. The desktop app is the product; this site is support
// infrastructure (marketing). It's distributed open-source via GitHub.

export const REPO_URL = "https://github.com/anthonymarti/murmur";

export const HOTKEY = "⌃ ⌥ Space";

export const INSTALL_STEPS = [
  { cmd: "git clone https://github.com/anthonymarti/murmur.git", note: "Clone the repo" },
  { cmd: "cd murmur && npm install", note: "Install Electron" },
  { cmd: "npm run setup", note: "Build whisper.cpp + download the model (one time, ~142MB)" },
  { cmd: "npm start", note: "Launch the menu-bar app" },
] as const;
