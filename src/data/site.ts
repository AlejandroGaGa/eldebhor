/**
 * Datos generales del sitio.
 * INSTAGRAM: usuario de la cuenta (sin @), para el botón de perfil.
 * WHATSAPP: número de pedidos con lada (52 = México), solo dígitos.
 */
export const INSTAGRAM = "eldhebor";

export const igProfile = `https://instagram.com/${INSTAGRAM}`;

/**
 * FACEBOOK: enlace completo a la página del debhor (p. ej. https://www.facebook.com/eldebhor).
 * Déjalo vacío ("") y el botón de Facebook no se muestra.
 */
export const FACEBOOK = "https://www.facebook.com/share/1KRDWsEFai/";

/** Redes del debhor, en el orden en que salen en el pie. Solo las que tienen enlace. */
export const REDES = [
  { red: "instagram" as const, nombre: "Instagram", usuario: `@${INSTAGRAM}`, url: igProfile },
  { red: "facebook" as const, nombre: "Facebook", usuario: "el debhor", url: FACEBOOK },
].filter((r) => r.url);

/** Crédito del desarrollador (perfil personal). */
export const DEV_NAME = "GAGA";
export const DEV_INSTAGRAM = "gagaeldev";
export const devProfile = `https://instagram.com/${DEV_INSTAGRAM}`;

/** Número donde llegan los pedidos (solo dígitos, con 52 de México). */
export const WHATSAPP = "524775885719";
/** Chat de WhatsApp con el mensaje ya escrito. */
export const waLink = (mensaje: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

/** Canción que suena al llegar al «Manifiesto 001» (archivo en /public). */
export const SONG_SRC = "/rolita.mp3";
export const SONG_TITLE = "Rolita";
/** Segundo en el que empieza (0:04). Pon 0 para que arranque desde el principio. */
export const SONG_START = 4;
