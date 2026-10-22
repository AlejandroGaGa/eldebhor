"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useStore } from "@/lib/store";
import { blip } from "@/lib/audio";
import { scrollToId, scrollToTop } from "@/lib/scroll";

export default function Hud({ conReels = false }: { conReels?: boolean }) {
  const entered = useStore((s) => s.entered);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entered) return;
    gsap.fromTo(root.current, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.6, ease: "back.out(2)" });
  }, [entered]);

  // el tag de la esquina lleva al inicio (Lenis si hay; si no, salto suave del navegador)
  const irArriba = () => {
    blip(880);
    scrollToTop();
  };

  return (
    <div ref={root} id="hud" className="invisible pointer-events-none fixed inset-x-0 top-0 z-[60] opacity-0">
      <div className="flex items-start justify-between gap-2 p-3 sm:p-5">
        <button
          type="button"
          onClick={irArriba}
          data-cursor="ARRIBA"
          aria-label="ELDEBHOR, volver al inicio"
          className="pointer-events-auto flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-ink/80 px-3 backdrop-blur-sm"
        >
          <Image src="/brand/logo-tag.webp" alt="" width={880} height={669} priority className="h-9 w-auto" />
        </button>
        <div className="pointer-events-auto flex items-center gap-2">
          <nav aria-label="Secciones" className="hidden items-center gap-2 md:flex">
            <a href="#obras" data-cursor="OBRAS" className="flex min-h-[48px] items-center rounded-full bg-ink/80 px-4 text-sm font-bold text-bone backdrop-blur-sm hover:text-brand">
              Obras
            </a>
            <a href="#merch" data-cursor="MERCH" className="flex min-h-[48px] items-center rounded-full bg-ink/80 px-4 text-sm font-bold text-bone backdrop-blur-sm hover:text-brand">
              Merch
            </a>
            <a href="#donaciones" data-cursor="DONAR" className="flex min-h-[48px] items-center rounded-full bg-ink/80 px-4 text-sm font-bold text-bone backdrop-blur-sm hover:text-brand">
              Donar
            </a>
            {conReels && (
              <a href="#reels" data-cursor="IG" className="flex min-h-[48px] items-center rounded-full bg-ink/80 px-4 text-sm font-bold text-bone backdrop-blur-sm hover:text-brand">
                Reels
              </a>
            )}
          </nav>
          {/* atajo directo al merch en celular (en pantallas grandes ya está en la barra) */}
          <a
            href="#merch"
            onClick={(e) => {
              e.preventDefault();
              blip(880);
              scrollToId("merch");
            }}
            data-cursor="MERCH"
            className="flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-full border-2 border-black bg-taxi px-4 text-sm font-bold text-ink shadow-[3px_3px_0_#000] md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            Merch
            <span className="sr-only"> (ir directo a la tienda)</span>
          </a>
          {/* aquí se acomoda el reproductor minimizado (SpotifyPlayer): es el control de sonido del sitio */}
          <span id="hueco-rola" aria-hidden="true" className="block h-12 w-[7rem] shrink-0 sm:w-[13.5rem]" />
        </div>
      </div>
    </div>
  );
}
