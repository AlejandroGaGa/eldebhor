"use client";

import { useEffect, useRef, useState } from "react";
import { igProfile, INSTAGRAM } from "@/data/site";
import { blip } from "@/lib/audio";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_JS = "https://www.instagram.com/embed.js";

/** Carga embed.js de Instagram una sola vez y devuelve true cuando está listo. */
function useEmbedJs() {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (window.instgrm) {
      queueMicrotask(() => setListo(true));
      return;
    }
    let s = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_JS}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = EMBED_JS;
      s.async = true;
      document.body.appendChild(s);
    }
    const on = () => setListo(true);
    s.addEventListener("load", on);
    return () => s?.removeEventListener("load", on);
  }, []);
  return listo;
}

/**
 * Carrusel de reels de Instagram del debhor. Cada reel es el embed oficial (blockquote + embed.js), así
 * se reproduce ahí mismo y con el conteo real de likes. Se desliza con el dedo (scroll-snap) o con las
 * flechas; la sección entera se monta tarde (LazySection) para no cargar Instagram si nadie baja hasta aquí.
 */
export default function Reels({ reels }: { reels: string[] }) {
  const pista = useRef<HTMLUListElement>(null);
  const listo = useEmbedJs();
  const [idx, setIdx] = useState(0);

  // que Instagram convierta los blockquotes en iframes (también si cambia la lista)
  useEffect(() => {
    if (listo) window.instgrm?.Embeds.process();
  }, [listo, reels]);

  // qué tarjeta está centrada, para las flechas y los puntitos
  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.firstElementChild?.clientWidth ?? 1;
      setIdx(Math.round(el.scrollLeft / (w + 24)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const ir = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const k = Math.max(0, Math.min(reels.length - 1, i));
    const slide = el.children[k] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", inline: "center", block: "nearest" });
    blip(520 + k * 40);
  };

  return (
    <section id="reels" className="relative overflow-hidden bg-[#0b0b0c] py-20 text-bone sm:py-28" aria-labelledby="reels-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-body text-base font-bold uppercase tracking-[0.35em]">✦ Instagram</p>
            <h2 id="reels-title" className="mt-2 font-block text-[clamp(3rem,12vw,8rem)] uppercase leading-[0.9]" style={{ textShadow: "6px 6px 0 #2ec6ee" }}>
              Reels
            </h2>
            <p className="mt-3 -rotate-1 font-marker text-xl sm:text-2xl">Lo que el debhor anda pintando, en video.</p>
          </div>
          <a
            href={igProfile}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="IG"
            className="inline-flex min-h-[52px] items-center gap-2 self-start -rotate-2 border-4 border-black bg-bone px-5 py-3 font-block text-base text-ink shadow-[6px_6px_0_#2ec6ee] transition-transform hover:rotate-1 hover:scale-105 sm:self-auto"
          >
            Seguir a @{INSTAGRAM}
            <span className="sr-only">(abre Instagram en otra pestaña)</span>
          </a>
        </div>
      </div>

      {/* pista */}
      <ul
        ref={pista}
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1rem,calc(50vw-10.5rem))] pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Reels de Instagram"
      >
        {reels.map((u, i) => (
          <li key={u} className="w-[21rem] shrink-0 snap-center" aria-label={`Reel ${i + 1} de ${reels.length}`}>
            <div className="-rotate-1 border-4 border-black bg-white shadow-[8px_8px_0_#2ec6ee] even:rotate-1">
              <blockquote className="instagram-media !m-0 !min-w-0 !max-w-none !border-0 !shadow-none" data-instgrm-permalink={u} data-instgrm-version="14" style={{ width: "100%" }}>
                <a href={u} target="_blank" rel="noopener noreferrer" className="block min-h-[32rem] p-4 font-marker text-xl text-ink">
                  Ver este reel en Instagram
                  <span className="sr-only"> (abre en otra pestaña)</span>
                </a>
              </blockquote>
            </div>
          </li>
        ))}
      </ul>

      {/* flechas + puntitos */}
      {reels.length > 1 && (
        <div className="mx-auto mt-2 flex max-w-7xl items-center justify-center gap-4 px-4">
          <button type="button" onClick={() => ir(idx - 1)} disabled={idx === 0} className="inline-flex h-14 w-14 items-center justify-center border-4 border-black bg-taxi font-block text-2xl text-ink shadow-[4px_4px_0_#000] disabled:opacity-40" aria-label="Reel anterior">
            ←
          </button>
          <ol className="flex items-center gap-2" aria-label="Posición en el carrusel">
            {reels.map((u, i) => (
              <li key={u}>
                <button
                  type="button"
                  onClick={() => ir(i)}
                  aria-label={`Ir al reel ${i + 1}`}
                  aria-current={i === idx ? "true" : undefined}
                  className={`h-4 w-4 rounded-full border-2 border-bone ${i === idx ? "bg-brand" : "bg-transparent"}`}
                />
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => ir(idx + 1)} disabled={idx === reels.length - 1} className="inline-flex h-14 w-14 items-center justify-center border-4 border-black bg-taxi font-block text-2xl text-ink shadow-[4px_4px_0_#000] disabled:opacity-40" aria-label="Siguiente reel">
            →
          </button>
        </div>
      )}
    </section>
  );
}
