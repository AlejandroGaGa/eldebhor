"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Producto } from "@/data/merch";
import { fechaLarga, type Promo } from "@/lib/offers";
import { igProfile, INSTAGRAM } from "@/data/site";
import ProductCard, { Toast, useToast } from "./ProductCard";

gsap.registerPlugin(ScrollTrigger);

export default function Merch({ products, promo }: { products: Producto[]; promo: Promo | null }) {
  const root = useRef<HTMLElement>(null);
  const { toast, say } = useToast();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-merch-title] > span", {
          yPercent: 120,
          rotation: () => gsap.utils.random(-30, 30),
          stagger: 0.07,
          ease: "back.out(2.2)",
          duration: 0.8,
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
        // products swing in from their hooks
        ScrollTrigger.batch("[data-hang]", {
          start: "top 90%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: -80, rotation: () => gsap.utils.random(-28, 28) },
              { autoAlpha: 1, y: 0, rotation: 0, duration: 1.4, ease: "elastic.out(1, 0.35)", stagger: 0.1, transformOrigin: "50% 0%" },
            ),
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="merch" className="relative scroll-mt-16 overflow-hidden bg-taxi text-ink" aria-labelledby="merch-title">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(circle, #121110 1.6px, transparent 2px)", backgroundSize: "14px 14px", maskImage: "linear-gradient(180deg, #000, transparent 60%)" }}
      />
      {/* drop strip */}
      <div className="relative -rotate-1 overflow-hidden border-y-4 border-black bg-ink py-2" aria-hidden="true">
        <div className="flex w-max animate-[marquee_18s_linear_infinite] whitespace-nowrap font-block text-xl text-brand motion-reduce:animate-none sm:text-2xl">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="pr-6">
              {promo ? `OFERTA ✦ ${promo.texto.toUpperCase()} ✦ PIDE POR WHATSAPP ✦` : "DROP 001 ✦ HECHO A MANO ✦ PIDE POR WHATSAPP ✦ EDICIÓN LIMITADA ✦"}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-10 sm:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-body text-base font-bold uppercase tracking-[0.35em]">✦ Tienda</p>
            <h2 id="merch-title" data-merch-title className="mt-2 flex overflow-hidden pb-3 font-block text-[clamp(3.5rem,15vw,10rem)] uppercase leading-[0.9]" style={{ textShadow: "6px 6px 0 #ff2e88" }}>
              <span className="sr-only">Merch</span>
              {"Merch".split("").map((c, i) => (
                <span key={i} aria-hidden="true" className="inline-block">
                  {c}
                </span>
              ))}
            </h2>
            <p className="mt-2 max-w-xl text-lg leading-relaxed">
              Todo se pide por WhatsApp, sin registros ni carrito. Elige tu pieza, toca <strong>Pedir por WhatsApp</strong> y se abre el chat con tu pedido ya escrito.
            </p>
            <p className="mt-3 max-w-xl -rotate-1 font-marker text-xl">Cada compra es una comida que ya no sale de 20 varos.</p>
            {promo && (
              <div className="mt-6 max-w-xl rotate-1 border-4 border-black bg-bubble px-5 py-4 text-white shadow-[6px_6px_0_#121110]" role="note">
                <p className="font-body text-sm font-bold uppercase tracking-[0.25em]">✦ Oferta</p>
                <p className="mt-1 font-block text-2xl leading-tight sm:text-3xl">{promo.texto}</p>
                {promo.hasta && <p className="mt-1 text-base font-bold">Hasta el {fechaLarga(promo.hasta)}</p>}
              </div>
            )}
          </div>
          <a
            href={igProfile}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="IG"
            className="inline-flex min-h-[52px] items-center gap-2 self-start -rotate-2 border-4 border-black bg-ink px-5 py-3 font-block text-base text-bone shadow-[6px_6px_0_#ff2e88] transition-transform hover:rotate-1 hover:scale-105 lg:self-auto"
          >
            <IgIcon /> @{INSTAGRAM}
            <span className="sr-only">(abre Instagram en otra pestaña)</span>
          </a>
        </div>

        {/* rack */}
        <div className="relative mt-14">
          <div className="absolute inset-x-0 top-0 hidden h-4 rounded-full border-4 border-black bg-[linear-gradient(180deg,#f2f2f2,#8d8d8d)] lg:block" aria-hidden="true" />
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id} data-hang>
                <ProductCard p={p} onToast={say} />
              </li>
            ))}
          </ul>
          {products.length === 0 && <p className="py-10 font-marker text-2xl">Pronto hay piezas nuevas. Escríbenos por WhatsApp.</p>}
        </div>
      </div>

      <Toast text={toast} />
    </section>
  );
}

function IgIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
