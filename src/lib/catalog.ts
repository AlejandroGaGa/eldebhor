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
  if (!shopifyConfigured) return { source: "local" };
  try {
    const products = await getShopProducts();
    if (!products.length) return { source: "local" };
    return { source: "shopify", products };
  } catch (e) {
    console.error("[shopify] no se pudo cargar el catálogo:", e instanceof Error ? e.message : e);
    return { source: "local" };
  }
}
