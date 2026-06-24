import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Murmur — Private, offline voice dictation for macOS",
  description:
    "Hold a hotkey, speak, and polished text is pasted anywhere. The entire pipeline runs on-device — your voice never leaves your Mac. Free, private, and offline. An open-source alternative to cloud dictation.",
  keywords: [
    "voice dictation",
    "macOS dictation",
    "offline speech to text",
    "private dictation",
    "Wispr Flow alternative",
    "whisper.cpp",
    "on-device transcription",
  ],
  openGraph: {
    title: "Murmur — Private, offline voice dictation for macOS",
    description:
      "Free, private, on-device voice dictation. Your audio never leaves your Mac.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Murmur — Private, offline voice dictation for macOS",
    description:
      "Free, private, on-device voice dictation. Your audio never leaves your Mac.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
