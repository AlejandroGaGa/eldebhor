"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useStore } from "@/lib/store";
import { usePaintSurface } from "@/lib/usePaintSurface";
import { blip } from "@/lib/audio";
import { scrollToId, useFinePointer, useReducedMotion } from "@/lib/scroll";
import type { Producto } from "@/data/merch";
import { descuento, fechaLarga, type Promo } from "@/lib/offers";
import { BotonPedir, destacada, money, Opciones, Toast, usePedido, useToast, VideoDemo } from "./ProductCard";
import Fachada from "./Fachada";


/**
 * Portada = la tienda. Arriba el tag, a la izquierda el marco con las dos fotos de los chorreadores
 * (las pinturas chorreando arriba y las botellas abajo) y a la derecha la ficha de la pieza destacada,
 * lista para pedir por WhatsApp.
 * El muro sigue siendo el de siempre: se puede pintar con el clic y el logo salpica al tocarlo.
 */
export default function Hero({ products, promo }: { products: Producto[]; promo: Promo | null }) {
  const entered = useStore((s) => s.entered);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // el muro se puede pintar con el clic / el dedo
  usePaintSurface(canvas, {
    radius: () => (window.innerWidth < 640 ? 18 : 30),
  });
  const { toast, say } = useToast();
  const pieza = destacada(products);
  // La foto de las botellas que va debajo de las salpicaduras: la del chorreador destacado si lo hay, si no la del catálogo.
  const esChorreador = (p: Producto) => /chorreador/i.test(p.id) || /chorreador/i.test(p.nombre) || p.id === "tintas-colores";
  const botellas = pieza && esChorreador(pieza) && pieza.imagen ? pieza : products.find((p) => esChorreador(p) && p.imagen);
  const fotoBotellas = botellas?.imagen ?? "/merch/tintas-colores.webp";
  const altBotellas = botellas?.alt ?? "Vista desde arriba de muchas botellas gotero con tapa blanca en colores azul, rosa, negro, morado, menta, rojo y blanco";

  // Intro: la foto se pega al muro y la ficha cuelga
  useGSAP(
    () => {
      if (!entered) return;
      const foto = section.current!.querySelector<HTMLElement>("[data-hero-foto]");
      const ficha = section.current!.querySelector<HTMLElement>("[data-hero-ficha]");
      if (reduced) {
        gsap.set([foto, ficha], { autoAlpha: 1 });
        return;
      }
      const tl = gsap.timeline({ delay: 0.3 });
      tl.fromTo(foto, { autoAlpha: 0, x: -90, rotation: -12, scale: 0.9 }, { autoAlpha: 1, x: 0, rotation: 0, scale: 1, duration: 0.8, ease: "back.out(1.8)", clearProps: "transform" })
        .fromTo(ficha, { autoAlpha: 0, y: -120, rotation: 10 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 1.3, ease: "elastic.out(1, 0.4)", transformOrigin: "50% 0%", clearProps: "transform" }, "-=0.55");
    },
    { scope: section, dependencies: [entered, reduced] },
  );

  return (
    <section ref={section} className="bricks relative isolate overflow-x-clip overflow-y-hidden" aria-label="Tienda: pieza de portada">
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

      <div className="pointer-events-none relative z-10 mx-auto flex max-w-7xl flex-col justify-center gap-6 px-4 pb-14 pt-28 sm:px-10 sm:pt-24 lg:gap-8">
        {/* foto grande + ficha */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10">
          <figure data-hero-foto className="invisible relative mx-auto w-full max-w-[36rem] border-4 border-black bg-white shadow-[6px_6px_0_#121110] sm:-rotate-2 sm:shadow-[10px_10px_0_#121110] lg:max-w-none">
            <span aria-hidden="true" className="absolute -top-4 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-3 border-2 border-black/60 bg-taxi/90 shadow-[2px_2px_0_#000]" />
            {/* arriba: las pinturas chorreando; abajo: las botellas de donde salen. Van juntas en el mismo marco. */}
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
            <p className="flex items-center justify-between gap-3 border-y-4 border-black bg-ink px-4 py-1.5 font-marker text-base text-bone sm:text-lg">
              <span>↑ así chorrean</span>
              <span>las botellas ↓</span>
            </p>
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#f4f1ea]">
              <Image
                src={fotoBotellas}
                alt={altBotellas}
                fill
                sizes="(min-width: 1024px) 680px, 92vw"
                unoptimized={fotoBotellas.startsWith("/api/img/")}
                className="object-cover"
                draggable={false}
              />
            </div>
            <figcaption className="flex items-center justify-between gap-3 border-t-4 border-black bg-bone px-4 py-2 font-marker text-base text-ink sm:text-lg">
              <span>Chorreadores: la pintura y la botella</span>
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
    <article data-hero-ficha className="pointer-events-auto invisible relative mx-auto w-full max-w-[36rem] border-4 border-black bg-white text-ink shadow-[6px_6px_0_#121110] sm:rotate-1 sm:shadow-[10px_10px_0_#121110] lg:max-w-none" aria-labelledby="pieza-name">
      {/* gancho */}
      <svg viewBox="0 0 40 46" className="absolute -top-11 left-1/2 h-12 w-10 -translate-x-1/2" aria-hidden="true">
        <path d="M20 44 V22 C20 10 34 10 34 20 C34 28 26 28 26 24" fill="none" stroke="#0b0b0b" strokeWidth="5" strokeLinecap="round" />
      </svg>
      {/* sello de oferta */}
      {!p.agotado && (
        <span className="absolute left-2 -top-5 z-10 -rotate-6 border-4 border-black bg-bubble px-3 py-1 font-block text-lg text-white shadow-[4px_4px_0_#000] sm:-left-3 sm:text-xl">
          {oferta ? `Oferta −${descuento(p)}%` : "¡Oferta!"}
        </span>
      )}
      {p.agotado && (
        <span className="absolute left-2 -top-5 z-10 -rotate-6 border-4 border-[#e3122b] bg-white sm:-left-3 px-3 py-1 font-block text-lg text-[#c10f24] shadow-[4px_4px_0_#000]">
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

        <VideoDemo p={p} big />

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
