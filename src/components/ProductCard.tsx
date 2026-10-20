"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import type { Producto } from "@/data/merch";
import { descuento, ofertaValida } from "@/lib/offers";
import { waLink } from "@/data/site";
import { blip, slap } from "@/lib/audio";
import ProductArt from "./ProductArt";

export const money = (n: number, cur: string) => `$${n.toLocaleString("es-MX")} ${cur}`;

/** La pieza que se vende en la portada: la primera visible marcada como destacada; si no hay, la primera del catálogo. */
export const destacada = (products: Producto[]) => products.find((p) => p.destacado && !p.agotado) ?? products.find((p) => p.destacado) ?? products[0] ?? null;

/** Aviso abajo de la pantalla («Abriendo WhatsApp…»). */
export function useToast() {
  const [toast, setToast] = useState("");
  const timer = useRef<number>(0);
  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 6000);
  }, []);
  return { toast, say };
}

export function Toast({ text }: { text: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md border-4 border-black bg-ink p-4 text-base text-bone shadow-[6px_6px_0_#2ec6ee] transition-all duration-300 ${text ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
    >
      {text}
    </div>
  );
}

/**
 * Lo que comparten la tarjeta de la tienda y la ficha de portada: elegir opción,
 * armar el mensaje y abrir WhatsApp con el pedido ya escrito.
 */
export function usePedido(p: Producto, onToast: (m: string) => void) {
  const [opcion, setOpcion] = useState("");
  const [error, setError] = useState(false);
  const enOferta = ofertaValida(p);
  const etiqueta = p.etiqueta ?? "Talla";
  const cur = p.moneda ?? "MXN";

  const elegir = (t: string) => {
    setOpcion(t);
    setError(false);
    blip(600);
  };

  const pedir = () => {
    if (p.opciones && !opcion) {
      setError(true);
      blip(220);
      return;
    }
    const opc = opcion ? ` (${etiqueta.toLowerCase()} ${opcion})` : "";
    const costo = enOferta && p.oferta && p.precio != null ? ` — ${money(p.oferta.precio, cur)} (oferta, antes ${money(p.precio, cur)})` : p.precio != null ? ` — ${money(p.precio, cur)}` : "";
    const msg = `Hola ELDEBHOR, quiero: ${p.nombre}${opc}${costo}. ¿Está disponible?`;
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
    slap(0.4);
    onToast(`Abriendo WhatsApp con tu pedido: «${msg}»`);
  };

  return { opcion, elegir, error, pedir, enOferta, etiqueta, cur };
}

/** Botones de talla / color / modelo. */
export function Opciones({ p, etiqueta, opcion, elegir, error, big }: { p: Producto; etiqueta: string; opcion: string; elegir: (t: string) => void; error: boolean; big?: boolean }) {
  if (!p.opciones || p.agotado) return null;
  const groupName = `opcion-${p.id}`;
  return (
    <fieldset aria-describedby={error ? `${p.id}-err` : undefined}>
      <legend className={`mb-2 font-bold ${big ? "text-lg" : "text-base"}`}>{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {p.opciones.map((t) => (
          <label
            key={t}
            className={`flex min-w-11 cursor-pointer items-center justify-center rounded-md border-[3px] border-black px-3 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${big ? "h-12 text-lg" : "h-11"} ${opcion === t ? "bg-ink text-bone" : "bg-white text-ink"}`}
          >
            <input type="radio" name={groupName} value={t} checked={opcion === t} onChange={() => elegir(t)} className="sr-only" />
            {t}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${p.id}-err`} className="mt-2 font-bold text-[#b00020]" role="alert">
          ⚠ Elige {etiqueta.toLowerCase()} antes de pedir.
        </p>
      )}
    </fieldset>
  );
}

/** Botón «Pedir por WhatsApp» (o «Agotado»). */
export function BotonPedir({ p, pedir, big }: { p: Producto; pedir: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={pedir}
      disabled={p.agotado}
      data-cursor={p.agotado ? "NOPE" : "WHATSAPP"}
      className={`inline-flex items-center justify-center gap-2 border-4 border-black bg-brand px-5 font-block text-ink shadow-[5px_5px_0_#000] transition-transform hover:-rotate-1 hover:scale-[1.02] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-[#d8d4c8] disabled:text-ink/70 disabled:shadow-none ${big ? "min-h-[60px] w-full text-lg sm:text-xl" : "min-h-[52px] text-base"}`}
    >
      {p.agotado ? (
        "Agotado"
      ) : (
        <>
          <WaIcon /> Pedir por WhatsApp
        </>
      )}
    </button>
  );
}

/** Tarjeta de la tienda (cuelga del rack). */
export default function ProductCard({ p, onToast }: { p: Producto; onToast: (m: string) => void }) {
  const { opcion, elegir, error, pedir, enOferta, etiqueta, cur } = usePedido(p, onToast);

  return (
    <article className="group relative" aria-labelledby={`${p.id}-name`}>
      {/* hook */}
      <svg viewBox="0 0 40 46" className="relative z-10 mx-auto -mb-2 h-12 w-10" aria-hidden="true">
        <path d="M20 44 V22 C20 10 34 10 34 20 C34 28 26 28 26 24" fill="none" stroke="#0b0b0b" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className="relative border-4 border-black bg-white shadow-[8px_8px_0_#121110] transition-transform duration-300 group-hover:-rotate-1">
        <div className="relative aspect-square overflow-hidden border-b-4 border-black" style={{ background: p.forma === "playera" ? "#e9e4d6" : "#f4f1ea" }}>
          {p.imagen ? (
            <Image
              src={p.imagen}
              alt={p.alt ?? p.nombre}
              fill
              sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw"
              unoptimized={p.imagen.startsWith("/api/img/")}
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <div className="absolute inset-[8%] origin-top transition-transform duration-500 group-hover:animate-[sway_1.2s_ease-in-out_infinite] motion-reduce:!animate-none">
              <ProductArt p={p} />
            </div>
          )}
          {!p.imagen && <span className="absolute bottom-2 left-2 rounded-sm bg-ink/85 px-1.5 py-0.5 font-body text-[11px] text-bone">imagen de ejemplo</span>}
          {enOferta && !p.agotado && (
            <span className="absolute left-2 top-2 -rotate-3 border-4 border-black bg-[#c10f24] px-3 py-1 font-block text-lg text-white shadow-[3px_3px_0_#000]">
              Oferta −{descuento(p)}%
            </span>
          )}
          {p.agotado && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-[#e3122b] bg-white/90 px-4 py-1 font-block text-3xl text-[#c10f24]">
              Agotado
            </span>
          )}
        </div>
        {/* price tag */}
        <p className="absolute -right-3 -top-3 rotate-6 border-4 border-black bg-bubble px-3 py-1 font-block text-lg text-ink shadow-[4px_4px_0_#000]">
          {enOferta && p.oferta && p.precio != null ? (
            <>
              <span className="sr-only">Precio de oferta: {money(p.oferta.precio, cur)}. Precio normal: {money(p.precio, cur)}.</span>
              <span aria-hidden="true" className="flex flex-col items-end leading-none">
                <s className="text-sm font-bold opacity-80">{money(p.precio, cur)}</s>
                <span>{money(p.oferta.precio, cur)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="sr-only">Precio: </span>
              {p.precio != null ? money(p.precio, cur) : "Consultar"}
            </>
          )}
        </p>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <h3 id={`${p.id}-name`} className="font-marker text-2xl leading-tight">
              {p.nombre}
            </h3>
            <p className="mt-1 text-base text-ink/80">{p.descripcion}</p>
          </div>
          <Opciones p={p} etiqueta={etiqueta} opcion={opcion} elegir={elegir} error={error} />
          <BotonPedir p={p} pedir={pedir} />
        </div>
      </div>
    </article>
  );
}

export function WaIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.13 15.07l-.3-.17-3.1.82.83-3.02-.2-.31A8.1 8.1 0 0 1 12.04 3.8Zm-3.2 3.9c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.35 5.2 4.56 2.57 1.01 3.1.8 3.65.75.56-.05 1.8-.74 2.05-1.45.25-.7.25-1.32.18-1.45-.08-.12-.28-.2-.58-.35-.3-.15-1.8-.89-2.07-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.17.2-.35.23-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.8-1.68-2.1-.17-.3-.02-.46.13-.6.14-.13.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.65-.93-2.25-.24-.58-.49-.5-.68-.51h-.58Z" />
    </svg>
  );
}
