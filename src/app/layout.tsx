import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";

// Self-hosted (OFL) fonts: no build-time requests to Google, works anywhere.
const tag = localFont({ src: "../fonts/sedgwick-ave-display-latin-400-normal.woff2", variable: "--ff-tag", display: "swap" });
const block = localFont({ src: "../fonts/bungee-latin-400-normal.woff2", variable: "--ff-block", display: "swap" });
const marker = localFont({ src: "../fonts/permanent-marker-latin-400-normal.woff2", variable: "--ff-marker", display: "swap" });
const wet = localFont({ src: "../fonts/rubik-wet-paint-latin-400-normal.woff2", variable: "--ff-wet", display: "swap" });
const spray = localFont({ src: "../fonts/rubik-spray-paint-latin-400-normal.woff2", variable: "--ff-spray", display: "swap" });
// Texto de lectura: Fredoka (variable, 300–700). Redonda y gordita como las letras burbuja del tag:
// se lee bien en celular y no se parece a la tipografía de ninguna otra tienda.
const body = localFont({ src: "../fonts/fredoka-latin-wght-normal.woff2", weight: "300 700", variable: "--ff-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | ELDEBHOR" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["graffiti", "arte urbano", "street art", "merch graffiti", "playeras graffiti", "grinders", "ELDEBHOR", "México"],
  authors: [{ name: "ELDEBHOR" }],
  creator: "Alejandro García Gallardo",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "es_MX",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#121110",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${tag.variable} ${block.variable} ${marker.variable} ${wet.variable} ${spray.variable} ${body.variable} antialiased`}
    >
      <body>
        {/* si ya eligió sonido antes, se marca el <html> antes del primer pintado para no mostrar la pantalla de carga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(/(?:^|; )eldebhor_sonido=(si|no)/.test(document.cookie))document.documentElement.setAttribute("data-vuelta","1")}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
