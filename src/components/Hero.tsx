"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { store, useStore } from "@/lib/store";
import { usePaintSurface } from "@/lib/usePaintSurface";
import { animatePath, blobFillPath, ringPath } from "@/lib/spray";
import { pieceFill } from "@/lib/color";
import { blip, slap } from "@/lib/audio";
import { PALETTE } from "@/lib/palette";
import { scrollToId, useFinePointer, useReducedMotion } from "@/lib/scroll";
import type { Producto } from "@/data/merch";
import { descuento, fechaLarga, type Promo } from "@/lib/offers";
import { BotonPedir, destacada, money, Opciones, Toast, usePedido, useToast } from "./ProductCard";
import Fachada from "./Fachada";

const SPARKS = [
  { l: "-6%", t: "-14%", s: 44, d: 0 },
  { l: "92%", t: "-10%", s: 30, d: 0.7 },
  { l: "100%", t: "60%", s: 36, d: 1.3 },
  { l: "-8%", t: "70%", s: 28, d: 0.4 },
];

/**
 * Portada = la tienda. Arriba el tag, a la izquierda la foto grande (las salpicaduras de los
 * chorreadores) y a la derecha la ficha de la pieza destacada, lista para pedir por WhatsApp.
 * El muro sigue siendo el de siempre: se puede pintar con el clic y el logo salpica al tocarlo.
 */
export default function Hero({ products, promo }: { products: Producto[]; promo: Promo | null }) {
  const entered = useStore((s) => s.entered);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const painter = usePaintSurface(canvas, {
    radius: () => (window.innerWidth < 640 ? 18 : 30),
  });
  const { toast, say } = useToast();
  const pieza = destacada(products);

  // Intro: el fantasma rocía una nube detrás del tag, el tag cae, la foto se pega y la ficha cuelga
  useGSAP(
    () => {
      if (!entered) return;
      const logo = title.current!;
      const extras = gsap.utils.toArray<HTMLElement>("[data-hero-extra]", section.current);
      const foto = section.current!.querySelector<HTMLElement>("[data-hero-foto]");
      const ficha = section.current!.querySelector<HTMLElement>("[data-hero-ficha]");
      const sub = section.current!.querySelector<HTMLElement>("[data-hero-sub]");
      if (reduced) {
        gsap.set([logo, extras, foto, ficha, sub], { autoAlpha: 1 });
        return;
      }
      const signal = { cancelled: false };
      const p = painter.current;
      const tr = logo.getBoundingClientRect();
      const sr = section.current!.getBoundingClientRect();
      const cx = tr.left - sr.left + tr.width / 2;
      const cy = tr.top - sr.top + tr.height / 2;
      if (p) {
        const r = Math.max(18, tr.height * 0.16);
        void animatePath(p, blobFillPath(cx, cy, tr.width * 0.62, tr.height * 0.95, r * 0.9), { color: "#2ec6ee", radius: r }, 900, signal).then(() =>
          animatePath(p, ringPath(cx, cy, tr.width * 0.64, tr.height * 1.0), { color: "#141414", radius: r * 0.5 }, 600, signal),
        );
      }
      const tl = gsap.timeline({ delay: 0.4 });
      tl.fromTo(
        logo,
        { autoAlpha: 0, scale: 2.6, y: -120, rotation: -14, filter: "blur(16px)" },
        { autoAlpha: 1, scale: 1, y: 0, rotation: -2, filter: "blur(0px)", duration: 0.7, ease: "back.out(2.2)", clearProps: "filter" },
      )
        .add(() => {
          const pp = painter.current;
          if (!pp) return;
          const r = logo.getBoundingClientRect();
          const s = section.current!.getBoundingClientRect();
          for (let j = 0; j < 4; j++) pp.drip(r.left - s.left + r.width * gsap.utils.random(0.15, 0.85), r.bottom - s.top - r.height * 0.2, "#2ec6ee", gsap.utils.random(4, 9));
        })
        .fromTo(sub, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.25")
        .fromTo(foto, { autoAlpha: 0, x: -90, rotation: -12, scale: 0.9 }, { autoAlpha: 1, x: 0, rotation: -2, scale: 1, duration: 0.8, ease: "back.out(1.8)" }, "-=0.3")
        .fromTo(ficha, { autoAlpha: 0, y: -120, rotation: 10 }, { autoAlpha: 1, y: 0, rotation: 1, duration: 1.3, ease: "elastic.out(1, 0.4)", transformOrigin: "50% 0%" }, "-=0.55")
        .fromTo(extras, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, stagger: 0.06, duration: 0.5, ease: "back.out(3)" }, "-=1");
      return () => {
        signal.cancelled = true;
      };
    },
    { scope: section, dependencies: [entered, reduced] },
  );

  // Tocar el tag: se aplasta, cambia de color y salpica el muro
  const hitLogo = (el: HTMLElement) => {
    const inner = el.querySelector<HTMLElement>(".tag-inner")!;
    const color = store.get().color;
    const under = PALETTE[Math.floor(Math.random() * PALETTE.length)].hex;
    inner.style.setProperty("--fill", pieceFill(color, under === color ? "#ff2e88" : under));
    slap(0.7);
    if (!reduced) gsap.fromTo(inner, { scaleX: 1.3, scaleY: 0.65 }, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1.2,0.3)" });
    const p = painter.current;
    const s = section.current!.getBoundingClientRect();
    const lr = el.getBoundingClientRect();
    if (p) p.splat(lr.left - s.left + lr.width * gsap.utils.random(0.1, 0.9), lr.bottom - s.top - lr.height * gsap.utils.random(0, 0.15), color, gsap.utils.random(50, 90));
  };

  return (
    <section ref={section} className="bricks relative isolate overflow-hidden" aria-labelledby="hero-title">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-pan-y" data-cursor={fine ? "PINTA" : undefined} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.55))]" aria-hidden="true" />

      <Fachada />

      {/* handstyles alrededor del muro */}
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[10%] right-[4%] rotate-[-8deg] font-marker text-xl text-taxi opacity-90 sm:text-3xl" style={{ textShadow: "2px 2px 0 #000" }}>
        dbh &apos;26
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[4%] left-[4%] hidden rotate-[6deg] font-marker text-lg text-bone opacity-80 sm:block sm:text-2xl">
        x crew: nadie x
      </span>

      <div className="pointer-events-none relative z-10 mx-auto flex max-w-7xl flex-col justify-center gap-6 px-4 pb-14 pt-16 sm:px-10 sm:pt-20 lg:gap-8">
        {/* tag + línea de venta */}
        <div className="flex flex-col items-start gap-3 text-left sm:items-center sm:text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="relative">
            <h1 id="hero-title" ref={title} aria-label="ELDEBHOR" className="tag-l invisible select-none">
              <span
                aria-hidden="true"
                className="pointer-events-auto block"
                onPointerDown={(e) => e.pointerType === "mouse" && hitLogo(e.currentTarget)}
                onClick={(e) => {
                  if ((e.nativeEvent as PointerEvent).pointerType !== "mouse") hitLogo(e.currentTarget);
                }}
                data-cursor="¡REVIENTA!"
              >
                <span className="tag-inner relative block">
                  <Image
                    src="/brand/logo-tag.webp"
                    alt=""
                    width={880}
                    height={669}
                    priority
                    sizes="(min-width: 1024px) 340px, 60vw"
                    className="h-auto w-[min(52vw,14rem)] drop-shadow-[5px_6px_0_rgba(0,0,0,.45)] sm:w-[16rem] lg:w-[21rem]"
                    draggable={false}
                  />
                </span>
              </span>
            </h1>
            {SPARKS.map((s, i) => (
              <svg key={i} data-hero-extra viewBox="0 0 40 40" width={s.s} height={s.s} aria-hidden="true" className="invisible absolute" style={{ left: s.l, top: s.t }}>
                <path className="twinkle" style={{ animationDelay: `${s.d}s`, transformOrigin: "20px 20px" }} d="M20 0 C22 14 26 18 40 20 C26 22 22 26 20 40 C18 26 14 22 0 20 C14 18 18 14 20 0Z" fill="#fff" stroke="#000" strokeWidth="2" />
              </svg>
            ))}
          </div>
          <p data-hero-sub className="invisible max-w-[30ch] -rotate-1 font-marker text-lg leading-snug text-bone sm:text-2xl" style={{ textShadow: "2px 2px 0 #000, 4px 4px 0 rgba(0,0,0,.4)" }}>
            Chorreadores, estampas y despalilladores <span className="text-brand">hechos a mano</span>.
            <span className="mt-1 block text-base text-taxi sm:text-lg">— pide por WhatsApp · {fine ? "mantén el clic y pinta el muro" : "toca el muro y píntalo"}</span>
          </p>
        </div>

        {/* foto grande + ficha */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10">
          <figure data-hero-foto className="invisible relative -rotate-2 border-4 border-black bg-white shadow-[10px_10px_0_#121110]">
            <span aria-hidden="true" className="absolute -top-4 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-3 border-2 border-black/60 bg-taxi/90 shadow-[2px_2px_0_#000]" />
            <Image
              src="/merch/chorreadores-salpicaduras.webp"
              alt="Doce salpicaduras de pintura chorreando sobre blanco: azul, menta, azul rey, rosa, rojo, naranja, amarillo, verde, morado, lila, negro y blanco"
              width={1290}
              height={645}
              priority
              sizes="(min-width: 1024px) 680px, 92vw"
              className="h-auto w-full"
              draggable={false}
            />
            <figcaption className="flex items-center justify-between gap-3 border-t-4 border-black bg-bone px-4 py-2 font-marker text-base text-ink sm:text-lg">
              <span>así chorrean →</span>
              <span className="font-body text-sm font-bold uppercase tracking-[0.2em]">12 colores</span>
            </figcaption>
          </figure>

          {pieza ? (
            <FichaPortada p={pieza} promo={promo} onToast={say} />
          ) : (
            <div data-hero-ficha className="invisible border-4 border-black bg-white p-6 font-marker text-2xl text-ink shadow-[8px_8px_0_#121110]">
              Pronto hay piezas nuevas. Escríbenos por WhatsApp.
            </div>
          )}
        </div>

        <a
          href="#merch"
          onClick={(e) => {
            e.preventDefault();
            blip(880);
            scrollToId("merch");
          }}
          data-cursor="MERCH"
          className="pointer-events-auto mx-auto inline-flex min-h-[48px] items-center gap-2 rounded-sm bg-ink px-4 font-body text-sm font-bold uppercase tracking-[0.25em] text-bone"
        >
          Ver todo el merch
          <svg width="18" height="22" viewBox="0 0 28 56" className="wobble" aria-hidden="true">
            <path d="M14 2 V44" stroke="#ffe600" strokeWidth="6" strokeLinecap="round" />
            <path d="M3 34 L14 50 L25 34" fill="none" stroke="#ffe600" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <Toast text={toast} />
    </section>
  );
}

/** La ficha grande de la pieza destacada, con sello de oferta y botón de pedido. */
function FichaPortada({ p, promo, onToast }: { p: Producto; promo: Promo | null; onToast: (m: string) => void }) {
  const { opcion, elegir, error, pedir, enOferta, etiqueta, cur } = usePedido(p, onToast);
  const oferta = enOferta && p.oferta && p.precio != null;

  return (
    <article data-hero-ficha className="pointer-events-auto invisible relative rotate-1 border-4 border-black bg-white text-ink shadow-[10px_10px_0_#121110]" aria-labelledby="pieza-name">
      {/* gancho */}
      <svg viewBox="0 0 40 46" className="absolute -top-11 left-1/2 h-12 w-10 -translate-x-1/2" aria-hidden="true">
        <path d="M20 44 V22 C20 10 34 10 34 20 C34 28 26 28 26 24" fill="none" stroke="#0b0b0b" strokeWidth="5" strokeLinecap="round" />
      </svg>
      {/* sello de oferta */}
      {!p.agotado && (
        <span className="absolute -left-3 -top-5 z-10 -rotate-6 border-4 border-black bg-bubble px-3 py-1 font-block text-lg text-white shadow-[4px_4px_0_#000] sm:text-xl">
          {oferta ? `Oferta −${descuento(p)}%` : "¡Oferta!"}
        </span>
      )}
      {p.agotado && (
        <span className="absolute -left-3 -top-5 z-10 -rotate-6 border-4 border-[#e3122b] bg-white px-3 py-1 font-block text-lg text-[#c10f24] shadow-[4px_4px_0_#000]">
          Agotado
        </span>
      )}

      <div className="flex flex-col gap-4 p-5 pt-7 sm:p-7 sm:pt-8">
        <p className="font-body text-sm font-bold uppercase tracking-[0.3em] text-ink/80">✦ {oferta ? "Oferta por tiempo limitado" : "Descuento especial"} ✦</p>
        <div>
          <h2 id="pieza-name" className="font-marker text-3xl leading-tight sm:text-4xl">
            {p.nombre}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-ink/80 sm:text-lg">{p.descripcion}</p>
        </div>

        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {oferta ? (
            <>
              <span className="sr-only">Precio de oferta: {money(p.oferta!.precio, cur)}. Precio normal: {money(p.precio!, cur)}.</span>
              <s aria-hidden="true" className="font-block text-xl text-ink/60">{money(p.precio!, cur)}</s>
              <span aria-hidden="true" className="font-block text-5xl leading-none sm:text-6xl" style={{ textShadow: "4px 4px 0 #ffe600" }}>
                {money(p.oferta!.precio, cur)}
              </span>
            </>
          ) : (
            <>
              <span className="sr-only">Precio: </span>
              <span className="font-block text-5xl leading-none sm:text-6xl" style={{ textShadow: "4px 4px 0 #ffe600" }}>
                {p.precio != null ? money(p.precio, cur) : "Consultar"}
              </span>
            </>
          )}
          {p.precio != null && <span className="font-body text-sm font-bold uppercase tracking-[0.2em] text-ink/70">por pieza</span>}
          {oferta && p.oferta?.hasta && <span className="w-full text-base font-bold">Hasta el {fechaLarga(p.oferta.hasta)}</span>}
        </p>

        <Opciones p={p} etiqueta={etiqueta} opcion={opcion} elegir={elegir} error={error} big />

        <BotonPedir p={p} pedir={pedir} big />

        <p className="font-body text-sm leading-relaxed text-ink/80">
          Se abre el chat con tu pedido ya escrito. Sin registro ni carrito: te contesta eldebhor.
        </p>

        {promo && (
          <div className="-rotate-1 border-4 border-black bg-ink px-4 py-3 text-bone shadow-[5px_5px_0_#2ec6ee]" role="note">
            <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-taxi">✦ Promo</p>
            <p className="mt-1 font-block text-lg leading-tight">{promo.texto}</p>
            {promo.hasta && <p className="mt-1 text-sm font-bold">Hasta el {fechaLarga(promo.hasta)}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
