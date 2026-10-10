/** Tipos compartidos entre servidor y cliente para la tienda de Shopify. */

export type ShopImage = { url: string; width: number; height: number; alt: string };

export type ShopVariant = {
  id: string;
  title: string;
  available: boolean;
  price: number;
  compareAt: number | null;
  options: { name: string; value: string }[];
  image: ShopImage | null;
};

export type ShopProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  available: boolean;
  currency: string;
  options: { name: string; values: string[] }[];
  variants: ShopVariant[];
  images: ShopImage[];
};

/** `local` = Shopify sin configurar (o sin productos): se usa el catálogo de src/data/merch.ts */
export type Catalog = { source: "shopify"; products: ShopProduct[] } | { source: "local" };

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  handle: string;
  price: number;
  image: ShopImage | null;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  currency: string;
  lines: CartLine[];
};
