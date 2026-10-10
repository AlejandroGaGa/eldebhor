import { cacheLife, cacheTag } from "next/cache";
import { fetchProducts, shopifyConfigured } from "./shopify";
import type { Catalog, ShopProduct } from "./shopify-types";

/** Productos de Shopify, guardados unos minutos para no pegarle a la API en cada visita. */
async function getShopProducts(): Promise<ShopProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shopify-products");
  return fetchProducts();
}

/**
 * Catálogo para la página. Si Shopify no está configurado, falla o no tiene productos
 * publicados, se usa el catálogo local (src/data/merch.ts) para que el sitio nunca se rompa.
 */
export async function loadCatalog(): Promise<Catalog> {
  if (!shopifyConfigured) {
    console.warn("[shopify] faltan variables en .env.local (SHOPIFY_STORE_DOMAIN y un token); reinicia `npm run dev` después de editarlo. Se usa el catálogo local.");
    return { source: "local" };
  }
  try {
    const products = await getShopProducts();
    if (!products.length) {
      console.warn("[shopify] la tienda respondió pero sin productos: publícalos en el canal de ventas «Headless» (Productos → Disponibilidad). Se usa el catálogo local.");
      return { source: "local" };
    }
    return { source: "shopify", products };
  } catch (e) {
    console.error("[shopify] no se pudo cargar el catálogo (401/403 = token incorrecto o sin permisos; 404 = dominio incorrecto):", e instanceof Error ? e.message : e);
    return { source: "local" };
  }
}
