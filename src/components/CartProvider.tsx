"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/shopify-types";

type CartCtx = {
  /** false cuando Shopify no está configurado: no hay carrito */
  enabled: boolean;
  cart: Cart | null;
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  busy: boolean;
  error: string;
  add: (variantId: string, quantity?: number) => Promise<Cart | null>;
  setQty: (lineId: string, quantity: number) => Promise<Cart | null>;
  remove: (lineId: string) => Promise<Cart | null>;
};

const none = async () => null;
const Ctx = createContext<CartCtx>({
  enabled: false,
  cart: null,
  count: 0,
  open: false,
  setOpen: () => {},
  busy: false,
  error: "",
  add: none,
  setQty: none,
  remove: none,
});

export const useCart = () => useContext(Ctx);

export function CartProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // recupera el carrito de la visita anterior (la cookie vive en el servidor)
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d: { cart: Cart | null }) => alive && setCart(d.cart ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);

  const call = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { cart?: Cart; error?: string };
      if (!res.ok || !data.cart) throw new Error(data.error ?? "No pudimos actualizar el carrito.");
      setCart(data.cart);
      return data.cart;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos actualizar el carrito.");
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      enabled,
      cart,
      count: cart?.totalQuantity ?? 0,
      open,
      setOpen,
      busy,
      error,
      add: (variantId, quantity = 1) => call({ action: "add", variantId, quantity }),
      setQty: (lineId, quantity) => call({ action: "update", lineId, quantity }),
      remove: (lineId) => call({ action: "remove", lineId }),
    }),
    [enabled, cart, open, busy, error, call],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
