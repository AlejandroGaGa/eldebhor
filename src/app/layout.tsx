import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (OFL) fonts: no build-time requests to Google, works anywhere.
const tag = localFont({ src: "../fonts/sedgwick-ave-display-latin-400-normal.woff2", variable: "--ff-tag", display: "swap" });
const block = localFont({ src: "../fonts/bungee-latin-400-normal.woff2", variable: "--ff-block", display: "swap" });
const marker = localFont({ src: "../fonts/permanent-marker-latin-400-normal.woff2", variable: "--ff-marker", display: "swap" });
const wet = localFont({ src: "../fonts/rubik-wet-paint-latin-400-normal.woff2", variable: "--ff-wet", display: "swap" });
const spray = localFont({ src: "../fonts/rubik-spray-paint-latin-400-normal.woff2", variable: "--ff-spray", display: "swap" });
const mono = localFont({
  src: [
    { path: "../fonts/space-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/space-mono-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--ff-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ELDEBHOR — hoy como con 20 varos",
  description:
    "Hoy voy a comer con estos 20 varos, porque todo mi dinero me lo gasté pintando y poniéndome bien pedote. Graffiti, obras y merch de ELDEBHOR.",
  openGraph: {
    title: "ELDEBHOR — hoy como con 20 varos",
    description: "Todo el varo se fue en latas. La pared es tuya.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121110",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${tag.variable} ${block.variable} ${marker.variable} ${wet.variable} ${spray.variable} ${mono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
