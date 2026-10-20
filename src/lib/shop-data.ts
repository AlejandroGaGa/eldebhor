import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MERCH, type Producto } from "@/data/merch";
import { kv } from "./db";
import { finDelDia, ofertaVigente, type Promo } from "./offers";

const K_PRODUCTS = "merch:products";
const K_PROMO = "merch:promo";
const K_REELS = "merch:reels";

/**
 * Las fotos de /public ahora son WebP. Un catálogo guardado antes del cambio todavía apunta a
 * «/merch/foto.jpg»: se traduce a «.webp» al leerlo (las subidas desde el panel, /api/img/…, no cambian).
 */
export const fotoActual = (ruta?: string) => ruta?.replace(/^(\/(?:merch|obras|brand|stickers)\/[\w.\-/]+)\.(?:jpe?g|png)$/i, "$1.webp");

/** Productos tal como se guardaron; si nunca se ha guardado nada, el catálogo de src/data/merch.ts. */
export async function readProducts(): Promise<Producto[]> {
  const raw = await kv.get(K_PRODUCTS);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return (arr as Producto[]).map((p) => (p.imagen ? { ...p, imagen: fotoActual(p.imagen) } : p));
    } catch {
      /* usa el catálogo base */
    }
  }
  return MERCH;
}
export const writeProducts = (list: Producto[]) => kv.set(K_PRODUCTS, JSON.stringify(list));

export async function readPromo(): Promise<Promo> {
  const raw = await kv.get(K_PROMO);
  try {
    if (raw) return JSON.parse(raw) as Promo;
  } catch {
    /* sin oferta */
  }
  return { activo: false, texto: "" };
}
export const writePromo = (p: Promo) => kv.set(K_PROMO, JSON.stringify(p));

/** Reels de Instagram que se muestran en el carrusel (URLs ya normalizadas), en orden. */
export async function readReels(): Promise<string[]> {
  const raw = await kv.get(K_REELS);
  try {
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((u): u is string => typeof u === "string");
    }
  } catch {
    /* sin reels */
  }
  return [];
}
export const writeReels = (urls: string[]) => kv.set(K_REELS, JSON.stringify(urls));

/** Ids de las fotos subidas (/api/img/<id>) que siguen en uso. */
export const imageIds = (list: Producto[]) => new Set(list.map((p) => p.imagen?.match(/^\/api\/img\/([a-f0-9]{16})$/)?.[1]).filter(Boolean) as string[]);

/** Ids de los videos subidos (/api/vid/<id>) que siguen en uso. */
export const videoIds = (list: Producto[]) => new Set(list.map((p) => p.video?.match(/^\/api\/vid\/([a-f0-9]{16})$/)?.[1]).filter(Boolean) as string[]);

/**
 * Lo que ve el público. Se guarda en caché por días (así casi no se consulta Upstash) y se invalida
 * al guardar desde el panel (etiqueta «catalogo»). Las ofertas con fecha vencida se quitan aquí; como
 * la caché dura días, una oferta con fecha de fin puede verse hasta un día más: si urge, basta con
 * guardar cualquier cosa en el panel para refrescar.
 */
export async function loadStorefront(): Promise<{ products: Producto[]; promo: Promo | null; reels: string[] }> {
  "use cache";
  cacheLife("days");
  cacheTag("catalogo");
  try {
    const [all, promo, reels] = await Promise.all([readProducts(), readPromo(), readReels()]);
    const ahora = Date.now();
    const products = all
      .filter((p) => p.visible !== false)
      .map((p) => {
        if (!p.oferta || ofertaVigente(p, ahora)) return p;
        const { oferta, ...rest } = p;
        void oferta;
        return rest;
      });
    const vigente = promo.activo && promo.texto && (!promo.hasta || finDelDia(promo.hasta) >= ahora);
    return { products, promo: vigente ? promo : null, reels };
  } catch (e) {
    console.error("[admin] no se pudo leer el catálogo guardado, se usa el base:", e instanceof Error ? e.message : e);
    return { products: MERCH, promo: null, reels: [] };
  }
}
