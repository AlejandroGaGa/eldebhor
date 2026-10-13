import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MERCH, type Producto } from "@/data/merch";
import { kv } from "./db";
import { finDelDia, ofertaVigente, type Promo } from "./offers";

const K_PRODUCTS = "merch:products";
const K_PROMO = "merch:promo";

/** Productos tal como se guardaron; si nunca se ha guardado nada, el catálogo de src/data/merch.ts. */
export async function readProducts(): Promise<Producto[]> {
  const raw = await kv.get(K_PRODUCTS);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Producto[];
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

/** Ids de las fotos subidas (/api/img/<id>) que siguen en uso. */
export const imageIds = (list: Producto[]) => new Set(list.map((p) => p.imagen?.match(/^\/api\/img\/([a-f0-9]{16})$/)?.[1]).filter(Boolean) as string[]);

/**
 * Lo que ve el público. Se guarda unos minutos en caché y se invalida al guardar desde el panel
 * (etiqueta «catalogo»). Las ofertas con fecha vencida se quitan aquí.
 */
export async function loadStorefront(): Promise<{ products: Producto[]; promo: Promo | null }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogo");
  try {
    const [all, promo] = await Promise.all([readProducts(), readPromo()]);
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
    return { products, promo: vigente ? promo : null };
  } catch (e) {
    console.error("[admin] no se pudo leer el catálogo guardado, se usa el base:", e instanceof Error ? e.message : e);
    return { products: MERCH, promo: null };
  }
}
