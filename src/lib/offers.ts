import type { Producto } from "@/data/merch";

export type Promo = { activo: boolean; texto: string; hasta?: string };

/** Último instante de un día AAAA-MM-DD en hora de Ciudad de México (UTC-6, sin horario de verano). */
export const finDelDia = (d: string) => new Date(`${d}T23:59:59.999-06:00`).getTime();

/** La oferta existe y tiene sentido (precio menor al normal). No mira la fecha: eso lo hace el servidor. */
export const ofertaValida = (p: Producto) => !!p.oferta && p.precio != null && p.oferta.precio > 0 && p.oferta.precio < p.precio;

/** Además de ser válida, no ha pasado su fecha de fin. */
export const ofertaVigente = (p: Producto, ahora: number) => ofertaValida(p) && (!p.oferta?.hasta || finDelDia(p.oferta.hasta) >= ahora);

export const descuento = (p: Producto) => (p.oferta && p.precio ? Math.round((1 - p.oferta.precio / p.precio) * 100) : 0);

/** "2026-10-20" -> "20 de octubre de 2026" */
export const fechaLarga = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
