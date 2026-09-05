import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

/**
 * Load faces only via CSS variables — do NOT use next/font `.className`.
 * `.className` injects `"… Fallback"` (local Arial + size-adjust) which
 * mixes with Vietnamese glyphs and looks broken (uneven accents).
 */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "Cascadia Code", "Segoe UI Mono", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "NAM NAM DATA",
  description: "Master Data Management — Nam Nam Logistics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
