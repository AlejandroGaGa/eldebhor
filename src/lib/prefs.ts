"use client";

/**
 * Preferencias del visitante en cookies (solo guardan la elección, nada de rastreo ni terceros):
 * - eldebhor_sonido: "si" | "no" → recordar si entró con sonido y no volver a mostrar la pantalla de carga.
 * - eldebhor_reproductor: "min" | "max" → si dejó el reproductor minimizado.
 */
export const SOUND_COOKIE = "eldebhor_sonido";
export const PLAYER_COOKIE = "eldebhor_reproductor";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function readPref(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function savePref(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax${secure}`;
}
