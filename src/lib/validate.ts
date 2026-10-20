import "server-only";
import type { Producto } from "@/data/merch";
import type { Promo } from "./offers";

const IMG_OK = /^(\/(merch|obras|stickers|brand)\/[\w.\-/]+|\/api\/img\/[a-f0-9]{16})$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#[0-9a-f]{3,8}$/i;
const FORMAS = ["playera", "sudadera", "gorra", "tote", "stickers", "print"] as const;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const validDate = (d: unknown): d is string => typeof d === "string" && DATE.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00Z`));
type R<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export function parseProducto(raw: unknown): R<Producto> {
  if (!raw || typeof raw !== "object") return fail("Producto inválido.");
  const r = raw as Record<string, unknown>;
  const nombre = str(r.nombre, 80);
  if (!nombre) return fail("Ponle nombre al producto.");
  const id = typeof r.id === "string" && /^[a-z0-9-]{3,60}$/.test(r.id) ? r.id : "";
  if (!id) return fail("Falta el identificador del producto.");

  let precio: number | undefined;
  if (r.precio !== undefined && r.precio !== null && r.precio !== "") {
    const n = Number(r.precio);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return fail("El precio no es válido.");
    precio = Math.round(n * 100) / 100;
  }

  let oferta: Producto["oferta"];
  if (r.oferta && typeof r.oferta === "object") {
    const o = r.oferta as Record<string, unknown>;
    const op = Math.round(Number(o.precio) * 100) / 100;
    if (!Number.isFinite(op) || op <= 0) return fail("El precio de oferta no es válido.");
    if (precio == null || op >= precio) return fail("El precio de oferta debe ser menor al precio normal.");
    if (o.hasta !== undefined && o.hasta !== null && o.hasta !== "" && !validDate(o.hasta)) return fail("La fecha de fin de la oferta no es válida.");
    oferta = { precio: op, ...(validDate(o.hasta) ? { hasta: o.hasta } : {}) };
  }

  let opciones: string[] | undefined;
  if (Array.isArray(r.opciones)) {
    const set = [...new Set(r.opciones.map((x) => str(x, 30)).filter(Boolean))].slice(0, 12);
    if (set.length) opciones = set;
  }

  let imagen: string | undefined;
  if (typeof r.imagen === "string" && r.imagen) {
    if (!IMG_OK.test(r.imagen) || r.imagen.includes("..")) return fail("La imagen no es válida: súbela desde el panel.");
    imagen = r.imagen;
  }

  const p: Producto = {
    id,
    nombre,
    descripcion: str(r.descripcion, 400),
    moneda: "MXN",
    agotado: r.agotado === true,
    visible: r.visible !== false,
  };
  if (r.destacado === true) p.destacado = true;
  if (precio != null) p.precio = precio;
  if (oferta) p.oferta = oferta;
  if (opciones) {
    p.opciones = opciones;
    const e = str(r.etiqueta, 20);
    if (e) p.etiqueta = e;
  }
  if (imagen) {
    p.imagen = imagen;
    p.alt = str(r.alt, 200) || nombre;
  } else {
    p.forma = FORMAS.find((f) => f === r.forma) ?? "print";
    if (typeof r.color === "string" && HEX.test(r.color)) p.color = r.color;
    if (typeof r.tinta === "string" && HEX.test(r.tinta)) p.tinta = r.tinta;
  }
  return { ok: true, value: p };
}

export function parsePromo(raw: unknown): R<Promo> {
  if (!raw || typeof raw !== "object") return fail("Datos inválidos.");
  const r = raw as Record<string, unknown>;
  const texto = str(r.texto, 100);
  const activo = r.activo === true;
  if (activo && !texto) return fail("Escribe el texto de la oferta o desactívala.");
  if (r.hasta !== undefined && r.hasta !== null && r.hasta !== "" && !validDate(r.hasta)) return fail("La fecha de fin no es válida.");
  return { ok: true, value: { activo, texto, ...(validDate(r.hasta) ? { hasta: r.hasta } : {}) } };
}
