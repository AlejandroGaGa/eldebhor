import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Cart } from "@/lib/shopify-types";
import { addLine, createCart, getCart, removeLine, shopifyConfigured, updateLine } from "@/lib/shopify";

const COOKIE = "eldebhor_cart";
const MAX_QTY = 20;
const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const LINE_ID = /^gid:\/\/shopify\/CartLine\/\S{1,200}$/;
const CART_ID = /^gid:\/\/shopify\/Cart\/\S{1,200}$/;

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}

async function cartCookie() {
  const id = (await cookies()).get(COOKIE)?.value;
  return id && CART_ID.test(id) ? id : undefined;
}

export async function GET() {
  if (!shopifyConfigured) return NextResponse.json({ cart: null });
  const id = await cartCookie();
  if (!id) return NextResponse.json({ cart: null });
  try {
    return NextResponse.json({ cart: await getCart(id, await clientIp()) });
  } catch (e) {
    console.error("[carrito] GET:", e instanceof Error ? e.message : e);
    return NextResponse.json({ cart: null });
  }
}

type Body = { action?: string; variantId?: string; lineId?: string; quantity?: number };

export async function POST(req: NextRequest) {
  if (!shopifyConfigured) return fail("La tienda no está disponible por ahora.", 503);

  // solo desde nuestro propio sitio
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail("Solicitud no permitida.", 403);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail("Solicitud inválida.", 400);
  }
  const ip = await clientIp();
  const qty = Number.isInteger(body.quantity) ? (body.quantity as number) : 1;

  try {
    let cartId = await cartCookie();
    let cart: Cart;

    if (body.action === "add") {
      if (!body.variantId || !VARIANT_ID.test(body.variantId)) return fail("Producto inválido.", 400);
      if (qty < 1 || qty > MAX_QTY) return fail("Cantidad inválida.", 400);
      const existing = cartId ? await getCart(cartId, ip) : null;
      cart = existing ? await addLine(existing.id, body.variantId, qty, ip) : await createCart(body.variantId, qty, ip);
    } else if (body.action === "update" || body.action === "remove") {
      if (!cartId) return fail("No hay carrito.", 400);
      if (!body.lineId || !LINE_ID.test(body.lineId)) return fail("Producto inválido.", 400);
      if (body.action === "remove" || qty === 0) {
        cart = await removeLine(cartId, body.lineId, ip);
      } else {
        if (qty < 1 || qty > MAX_QTY) return fail("Cantidad inválida.", 400);
        cart = await updateLine(cartId, body.lineId, qty, ip);
      }
    } else {
      return fail("Acción desconocida.", 400);
    }

    cartId = cart.id;
    const res = NextResponse.json({ cart });
    res.cookies.set(COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  } catch (e) {
    console.error("[carrito] POST:", e instanceof Error ? e.message : e);
    return fail("No pudimos actualizar el carrito. Intenta de nuevo.", 502);
  }
}
