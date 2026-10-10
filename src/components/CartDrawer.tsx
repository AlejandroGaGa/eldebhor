"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { getLenis } from "@/lib/scroll";
import { blip } from "@/lib/audio";
import { useCart } from "./CartProvider";

const money = (n: number, cur: string) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} ${cur}`;

const MAX_QTY = 20;

/** Cajón del carrito: se abre desde el botón de la barra superior o al agregar un producto. */
export default function CartDrawer() {
  const { enabled, cart, open, setOpen, busy, error, setQty, remove } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      getLenis()?.stop();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  if (!enabled) return null;

  const onClosed = () => {
    setOpen(false);
    getLenis()?.start();
    opener.current?.focus();
  };
  const lines = cart?.lines ?? [];

  return (
    <dialog
      ref={dialog}
      onClose={onClosed}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-labelledby="cart-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-transparent p-0 text-bone backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="cart-panel flex h-full flex-col border-l-4 border-black bg-ink shadow-[-10px_0_0_#2ec6ee]">
        <div className="flex items-center justify-between gap-3 border-b-4 border-black bg-taxi px-4 py-3 text-ink">
          <h2 id="cart-title" className="font-block text-2xl uppercase">
            Tu carrito
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="min-h-[48px] rounded-full border-[3px] border-black bg-white px-5 font-bold"
          >
            Cerrar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" aria-busy={busy}>
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="font-marker text-2xl text-brand">Aquí no hay nada… todavía.</p>
              <p className="text-base text-bone/85">Elige algo de merch y se queda guardado aquí.</p>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="min-h-[48px] rounded-full border-[3px] border-brand bg-brand px-6 font-bold text-ink"
              >
                Seguir viendo
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map((l) => {
                const detail = l.variantTitle && l.variantTitle !== "Default Title" ? l.variantTitle : "";
                return (
                  <li key={l.id} className="flex gap-3 border-b-2 border-dashed border-bone/25 pb-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden border-[3px] border-black bg-white">
                      {l.image && <Image src={l.image.url} alt={l.image.alt || l.productTitle} fill sizes="96px" className="object-cover" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div>
                        <p className="font-marker text-xl leading-tight">{l.productTitle}</p>
                        {detail && <p className="text-base text-bone/80">{detail}</p>}
                        <p className="text-base font-bold text-brand">{money(l.price, cart?.currency ?? "MXN")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div role="group" aria-label={`Cantidad de ${l.productTitle}`} className="flex items-center">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              blip(500);
                              void setQty(l.id, l.quantity - 1);
                            }}
                            aria-label={`Quitar una unidad de ${l.productTitle}`}
                            className="flex h-11 w-11 items-center justify-center rounded-l-md border-[3px] border-bone font-block text-xl disabled:opacity-50"
                          >
                            −
                          </button>
                          <span aria-live="polite" className="flex h-11 min-w-11 items-center justify-center border-y-[3px] border-bone px-2 font-bold">
                            {l.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={busy || l.quantity >= MAX_QTY}
                            onClick={() => {
                              blip(700);
                              void setQty(l.id, l.quantity + 1);
                            }}
                            aria-label={`Agregar una unidad de ${l.productTitle}`}
                            className="flex h-11 w-11 items-center justify-center rounded-r-md border-[3px] border-bone font-block text-xl disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            blip(300);
                            void remove(l.id);
                          }}
                          aria-label={`Quitar ${l.productTitle} del carrito`}
                          className="min-h-[44px] rounded-md px-3 text-base underline underline-offset-4 disabled:opacity-50"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && cart && (
          <div className="flex flex-col gap-3 border-t-4 border-black bg-[#17151a] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="flex items-baseline justify-between font-block text-xl">
              <span>Subtotal</span>
              <span>{money(cart.subtotal, cart.currency)}</span>
            </p>
            <p className="text-sm text-bone/80">El envío y los impuestos se calculan al pagar.</p>
            {error && (
              <p role="alert" className="font-bold text-[#ff8a8a]">
                ⚠ {error}
              </p>
            )}
            <a
              href={cart.checkoutUrl}
              data-cursor="PAGAR"
              className="inline-flex min-h-[56px] items-center justify-center border-4 border-black bg-brand px-5 font-block text-lg text-ink shadow-[5px_5px_0_#000] transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Pagar ahora
            </a>
          </div>
        )}
        {lines.length === 0 && error && (
          <p role="alert" className="border-t-4 border-black p-4 font-bold text-[#ff8a8a]">
            ⚠ {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
