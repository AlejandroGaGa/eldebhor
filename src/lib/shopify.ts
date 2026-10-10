/**
 * Cliente mínimo de la Storefront API de Shopify (solo servidor).
 * Los tokens viven en .env.local y NUNCA salen al navegador: el carrito se maneja
 * desde /api/cart y los productos se leen en el servidor.
 */
import type { Cart, ShopImage, ShopProduct } from "./shopify-types";

const API_VERSION = "2026-07";
const domain = (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();
const publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN?.trim();
// localhost solo para pruebas con una tienda simulada
const protocol = /^(localhost|127\.0\.0\.1)(:|$)/.test(domain) ? "http" : "https";

export const shopifyConfigured = Boolean(domain && (privateToken || publicToken));

type Gql<T> = { data?: T; errors?: { message: string }[] };

async function storefront<T>(query: string, variables: Record<string, unknown> = {}, buyerIp?: string): Promise<T> {
  if (!shopifyConfigured) throw new Error("Shopify no está configurado");
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (privateToken) {
    headers["Shopify-Storefront-Private-Token"] = privateToken;
    if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = publicToken as string;
  }
  const res = await fetch(`${protocol}://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Shopify respondió ${res.status}`);
  const json = (await res.json()) as Gql<T>;
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("Shopify no devolvió datos");
  return json.data;
}

/* ---------- normalización ---------- */

type RawImage = { url: string; width?: number | null; height?: number | null; altText?: string | null } | null | undefined;
type RawMoney = { amount: string; currencyCode: string } | null | undefined;

const img = (i: RawImage): ShopImage | null => (i ? { url: i.url, width: i.width ?? 800, height: i.height ?? 800, alt: i.altText ?? "" } : null);
const num = (m: RawMoney) => (m ? Number(m.amount) : 0);

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  options: { name: string; values: string[] }[];
  images: { nodes: RawImage[] };
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      price: RawMoney;
      compareAtPrice: RawMoney;
      selectedOptions: { name: string; value: string }[];
      image: RawImage;
    }[];
  };
};

const mapProduct = (p: RawProduct): ShopProduct => ({
  id: p.id,
  handle: p.handle,
  title: p.title,
  description: p.description,
  available: p.availableForSale,
  currency: p.variants.nodes[0]?.price?.currencyCode ?? "MXN",
  options: p.options.map((o) => ({ name: o.name, values: o.values })),
  images: p.images.nodes.map(img).filter((i): i is ShopImage => !!i),
  variants: p.variants.nodes.map((v) => ({
    id: v.id,
    title: v.title,
    available: v.availableForSale,
    price: num(v.price),
    compareAt: v.compareAtPrice ? num(v.compareAtPrice) : null,
    options: v.selectedOptions.map((o) => ({ name: o.name, value: o.value })),
    image: img(v.image),
  })),
});

type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: RawMoney };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      merchandise: {
        id?: string;
        title?: string;
        price?: RawMoney;
        image?: RawImage;
        product?: { handle: string; title: string; featuredImage?: RawImage };
      };
    }[];
  };
};

const mapCart = (c: RawCart): Cart => ({
  id: c.id,
  checkoutUrl: c.checkoutUrl,
  totalQuantity: c.totalQuantity,
  subtotal: num(c.cost.subtotalAmount),
  currency: c.cost.subtotalAmount?.currencyCode ?? "MXN",
  lines: c.lines.nodes
    .filter((l) => l.merchandise?.id)
    .map((l) => ({
      id: l.id,
      quantity: l.quantity,
      variantId: l.merchandise.id as string,
      productTitle: l.merchandise.product?.title ?? "Producto",
      variantTitle: l.merchandise.title ?? "",
      handle: l.merchandise.product?.handle ?? "",
      price: num(l.merchandise.price),
      image: img(l.merchandise.image) ?? img(l.merchandise.product?.featuredImage),
    })),
});

/* ---------- productos ---------- */

const PRODUCTS = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first) {
      nodes {
        id
        handle
        title
        description
        availableForSale
        options {
          name
          values
        }
        images(first: 4) {
          nodes {
            url
            width
            height
            altText
          }
        }
        variants(first: 50) {
          nodes {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            image {
              url
              width
              height
              altText
            }
          }
        }
      }
    }
  }
`;

export async function fetchProducts(): Promise<ShopProduct[]> {
  const data = await storefront<{ products: { nodes: RawProduct[] } }>(PRODUCTS, { first: 50 });
  return data.products.nodes.map(mapProduct);
}

/* ---------- carrito ---------- */

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            image {
              url
              width
              height
              altText
            }
            product {
              handle
              title
              featuredImage {
                url
                width
                height
                altText
              }
            }
          }
        }
      }
    }
  }
`;

type UserError = { message: string };
type CartResult = { cart: RawCart | null; userErrors: UserError[] };

async function cartMutation(name: string, query: string, variables: Record<string, unknown>, ip?: string): Promise<Cart> {
  const data = await storefront<Record<string, CartResult>>(query, variables, ip);
  const r = data[name];
  if (r.userErrors?.length) throw new Error(r.userErrors.map((e) => e.message).join("; "));
  if (!r.cart) throw new Error("Shopify no devolvió el carrito");
  return mapCart(r.cart);
}

export async function getCart(id: string, ip?: string): Promise<Cart | null> {
  const data = await storefront<{ cart: RawCart | null }>(
    `${CART_FIELDS} query GetCart($id: ID!) { cart(id: $id) { ...CartFields } }`,
    { id },
    ip,
  );
  return data.cart ? mapCart(data.cart) : null;
}

export const createCart = (variantId: string, quantity: number, ip?: string) =>
  cartMutation(
    "cartCreate",
    `${CART_FIELDS} mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { ...CartFields } userErrors { message } } }`,
    { lines: [{ merchandiseId: variantId, quantity }] },
    ip,
  );

export const addLine = (cartId: string, variantId: string, quantity: number, ip?: string) =>
  cartMutation(
    "cartLinesAdd",
    `${CART_FIELDS} mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } } }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
    ip,
  );

export const updateLine = (cartId: string, lineId: string, quantity: number, ip?: string) =>
  cartMutation(
    "cartLinesUpdate",
    `${CART_FIELDS} mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } } }`,
    { cartId, lines: [{ id: lineId, quantity }] },
    ip,
  );

export const removeLine = (cartId: string, lineId: string, ip?: string) =>
  cartMutation(
    "cartLinesRemove",
    `${CART_FIELDS} mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } userErrors { message } } }`,
    { cartId, lineIds: [lineId] },
    ip,
  );
