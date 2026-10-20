import { REDES, WHATSAPP } from "@/data/site";

/**
 * URL pública del sitio (sin «/» final). Configura NEXT_PUBLIC_SITE_URL en Vercel
 * con tu dominio, p. ej. https://eldebhor.com. Si no existe, usa el dominio de
 * producción de Vercel y, en local, localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "ELDEBHOR";
export const SITE_TITLE = "ELDEBHOR — graffiti, arte urbano y merch.";
export const SITE_DESCRIPTION =
  "ELDEBHOR: graffiti y arte urbano hecho a mano. Conoce las obras, recorre el muro libre y compra playeras, pines, grinders y más por WhatsApp.";

export const SAME_AS = REDES.map((r) => r.url);
export const TELEFONO = `+${WHATSAPP}`;
