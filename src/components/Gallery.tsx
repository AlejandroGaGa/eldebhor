"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { OBRAS, TIPOS, type Obra, type Tipo } from "@/data/obras";
import { blip, slap } from "@/lib/audio";
import { getLenis } from "@/lib/scroll";
import ArtPlaceholder from "./ArtPlaceholder";

gsap.registerPlugin(Flip, ScrollTrigger);

const TILTS = [-3, 2, -1.5, 3.5, -2.5, 1.5, -4, 2.5];
const ASPECT: Record<Obra["formato"], string> = { v: "aspect-[4/5]", h: "aspect-[16/10]", c: "aspect-square" };
const SPAN: Record<Obra["formato"], string> = { v: "", h: "lg:col-span-2", c: "" };

export default function Gallery() {
  const [filtro, setFiltro] = useState<Tipo | "Todas">("Todas");
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const visibles = OBRAS.filter((o) => filtro === "Todas" || o.tipo === filtro);

  // cards get "slapped" onto the wall as they scroll in
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-gal-title] > span", {
          yPercent: 110,
          rotation: () => gsap.utils.random(-20, 20),
          stagger: 0.06,
          ease: "back.out(2)",
          duration: 0.8,
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
        ScrollTrigger.batch("[data-slap]", {
          start: "top 88%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { autoAlpha: 0, scale: 1.6, rotation: () => gsap.utils.random(-25, 25) },
              { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(1.8)", stagger: 0.08, onStart: () => slap(0.25) },
            ),
        });
      });
    },
    { scope: root },
  );

  // animate the re-layout when the filter changes
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Flip.from(state, {
      duration: 0.65,
      ease: "power3.inOut",
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.4, rotation: -20 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.4, duration: 0.35 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filtro]);

  const choose = (t: Tipo | "Todas") => {
    if (t === filtro) return;
    flipState.current = Flip.getState(gsap.utils.toArray<HTMLElement>("[data-obra]", grid.current));
    setFiltro(t);
    blip(700);
  };

  const show = (idx: number, el: HTMLElement) => {
    opener.current = el;
    setOpen(idx);
    dialog.current?.showModal();
    getLenis()?.stop();
    blip(900);
  };
  const close = () => {
    dialog.current?.close();
  };
  const onClosed = () => {
    setOpen(null);
    getLenis()?.start();
    opener.current?.focus();
  };
  const step = (d: number) => {
    if (open === null) return;
    const i = visibles.findIndex((o) => o.id === OBRAS[open].id);
    const next = visibles[(i + d + visibles.length) % visibles.length];
    setOpen(OBRAS.indexOf(next));
    blip(800);
  };

  const current = open !== null ? OBRAS[open] : null;

  return (
    <section ref={root} id="obras" className="concrete relative scroll-mt-4 overflow-x-clip px-4 py-24 sm:px-10 sm:py-32" aria-labelledby="gal-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-base uppercase tracking-[0.35em] text-taxi">✦ Galería</p>
            <h2 id="gal-title" data-gal-title className="mt-2 flex overflow-hidden pb-2 font-wet text-[clamp(3.5rem,14vw,10rem)] leading-[0.85] text-bone" style={{ textShadow: "6px 6px 0 #9b5cff" }}>
              <span className="sr-only">Obras</span>
              {"Obras".split("").map((c, i) => (
                <span key={i} aria-hidden="true" className="inline-block">
                  {c}
                </span>
              ))}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-bone/90">
              Muros, bocetos y tags digitales. Toca una pieza para verla en grande.
            </p>
          </div>
          <div role="group" aria-label="Filtrar obras por tipo" className="flex flex-wrap gap-2">
            {(["Todas", ...TIPOS.filter((t) => OBRAS.some((o) => o.tipo === t))] as const).map((t) => {
              const n = t === "Todas" ? OBRAS.length : OBRAS.filter((o) => o.tipo === t).length;
              const active = filtro === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(t)}
                  data-cursor={t.toUpperCase()}
                  className={`min-h-[44px] rounded-full border-[3px] px-4 text-base transition-transform hover:-rotate-2 ${active ? "border-brand bg-brand font-bold text-ink" : "border-bone text-bone"}`}
                >
                  {t} <span className={active ? "text-ink/70" : "text-bone/70"}>({n})</span>
                </button>
              );
            })}
          </div>
        </div>

        <ul ref={grid} className="mt-12 grid grid-flow-dense grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {OBRAS.map((o, idx) => {
            const hidden = !(filtro === "Todas" || o.tipo === filtro);
            return (
              <li key={o.id} data-obra className={`${SPAN[o.formato]} ${hidden ? "hidden" : ""}`}>
                <div data-slap>
                  <button
                    type="button"
                    onClick={(e) => show(idx, e.currentTarget)}
                    data-cursor="VER"
                    aria-label={`Ver ${o.titulo}, ${o.tipo.toLowerCase()}${o.anio ? ` de ${o.anio}` : ""}`}
                    className="group relative block w-full bg-[#f6f3ea] p-3 pb-14 text-left shadow-[6px_8px_0_rgba(0,0,0,.55)] transition-transform duration-300 hover:z-10 hover:scale-[1.03] hover:rotate-0!"
                    style={{ rotate: `${TILTS[idx % TILTS.length]}deg` }}
                  >
                    {/* masking tape */}
                    <span aria-hidden="true" className="absolute -top-3 left-6 h-6 w-20 -rotate-6 bg-[#e8dcb0]/90 shadow-sm" />
                    <span aria-hidden="true" className="absolute -top-3 right-6 h-6 w-16 rotate-6 bg-[#e8dcb0]/90 shadow-sm" />
                    <span className={`relative block w-full overflow-hidden bg-ink ${ASPECT[o.formato]}`}>
                      {o.imagen ? (
                        <Image src={o.imagen} alt={o.alt ?? o.titulo} fill sizes="(min-width:1024px) 40vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <ArtPlaceholder obra={o} />
                      )}
                    </span>
                    <span className="absolute inset-x-3 bottom-3 flex items-baseline justify-between gap-2 text-ink">
                      <span className="min-w-0 truncate font-marker text-xl">{o.titulo}</span>
                      {o.anio && <span className="shrink-0 font-mono text-sm font-bold">{o.anio}</span>}
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* lightbox */}
      <dialog
        ref={dialog}
        onClose={onClosed}
        onClick={(e) => e.target === dialog.current && close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        aria-labelledby="lb-title"
        className="m-auto max-h-[100dvh] w-full max-w-5xl bg-transparent p-3 text-bone backdrop:bg-black/85 backdrop:backdrop-blur-sm sm:p-6"
      >
        {current && (
          <div className="relative flex flex-col border-4 border-black bg-ink shadow-[10px_10px_0_#9b5cff] [@media(max-height:520px)]:flex-row [@media(max-height:520px)]:shadow-[6px_6px_0_#9b5cff]">
            <div className={`relative w-full ${current.formato === "v" ? "aspect-[4/5] max-h-[58dvh]" : current.formato === "c" ? "aspect-square max-h-[58dvh]" : "aspect-[16/10] max-h-[58dvh]"} mx-auto shrink-0 overflow-hidden bg-black [@media(max-height:520px)]:aspect-auto [@media(max-height:520px)]:h-[calc(100dvh-1.5rem-8px)] [@media(max-height:520px)]:max-h-none [@media(max-height:520px)]:w-[55%]`}>
              {current.imagen ? (
                <Image src={current.imagen} alt={current.alt ?? current.titulo} fill sizes="100vw" className="object-contain" />
              ) : (
                <ArtPlaceholder obra={current} big />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6 [@media(max-height:520px)]:max-h-[calc(100dvh-1.5rem-8px)] [@media(max-height:520px)]:flex-col [@media(max-height:520px)]:items-stretch [@media(max-height:520px)]:justify-between [@media(max-height:520px)]:gap-3 [@media(max-height:520px)]:overflow-y-auto [@media(max-height:520px)]:p-3">
              <div className="min-w-0">
                <h3 id="lb-title" className="font-marker text-3xl text-brand [@media(max-height:520px)]:text-2xl">{current.titulo}</h3>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-base">
                  {current.anio && (
                    <>
                      <dt className="text-bone/70">Año</dt>
                      <dd>{current.anio}</dd>
                    </>
                  )}
                  <dt className="text-bone/70">Tipo</dt>
                  <dd>{current.tipo}</dd>
                  {current.lugar && (
                    <>
                      <dt className="text-bone/70">Lugar</dt>
                      <dd>{current.lugar}</dd>
                    </>
                  )}
                  {current.tecnica && (
                    <>
                      <dt className="text-bone/70">Técnica</dt>
                      <dd>{current.tecnica}</dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => step(-1)} aria-label="Obra anterior" className="h-12 w-12 rounded-full border-[3px] border-bone font-block text-xl">
                  ←
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Obra siguiente" className="h-12 w-12 rounded-full border-[3px] border-bone font-block text-xl">
                  →
                </button>
                <button type="button" onClick={close} className="min-h-[48px] rounded-full border-[3px] border-brand bg-brand px-5 font-bold text-ink">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
