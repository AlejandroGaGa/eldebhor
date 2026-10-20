"use client";

import { useEffect, useState } from "react";

/** El toldo de rayas con su orilla ondulada (se usa en la fachada y en la copia fija de arriba). */
export function Toldo({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-12 border-b-4 border-black sm:h-16 ${className}`} style={{ backgroundImage: "repeating-linear-gradient(90deg, #2ec6ee 0 48px, #f4f1ea 48px 96px)", boxShadow: "inset 0 -14px 24px rgba(0,0,0,.35)" }}>
      <svg viewBox="0 0 960 24" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[22px] h-6 w-full">
        <path d="M0 0 H960 V4 C940 24 920 24 900 4 C880 24 860 24 840 4 C820 24 800 24 780 4 C760 24 740 24 720 4 C700 24 680 24 660 4 C640 24 620 24 600 4 C580 24 560 24 540 4 C520 24 500 24 480 4 C460 24 440 24 420 4 C400 24 380 24 360 4 C340 24 320 24 300 4 C280 24 260 24 240 4 C220 24 200 24 180 4 C160 24 140 24 120 4 C100 24 80 24 60 4 C40 24 20 24 0 4Z" fill="#2ec6ee" stroke="#000" strokeWidth="4" />
      </svg>
    </div>
  );
}

/**
 * Fachada de miscelánea de esquina, grafiteada: cortina de acero medio subida, rótulo pintado a mano
 * «MISCELÁNEA EL DEBHOR», toldo de rayas y el letrero de ABIERTO colgando. Corona la portada para que
 * se entienda de entrada que esto es la tienda del debhor.
 */
export default function Fachada() {
  return (
    <div className="relative z-10 select-none" aria-label="Miscelánea EL DEBHOR, la tienda del debhor. Abierto: pide por WhatsApp.">
      {/* cortina de acero enrollada (solo los primeros pliegues asoman) */}
      <div aria-hidden="true" className="h-16 border-b-4 border-black bg-[#3a3835] sm:h-20" style={{ backgroundImage: "repeating-linear-gradient(180deg, #4a4744 0 7px, #2b2927 7px 9px, #5a5754 9px 11px, #3a3835 11px 16px)" }} />
      {/* rodillo */}
      <div aria-hidden="true" className="h-3 border-b-4 border-black bg-[linear-gradient(180deg,#8a8884,#55534f)]" />

      {/* rótulo pintado */}
      <div className="relative overflow-hidden border-b-4 border-black bg-bone px-4 pb-4 pt-3 text-ink sm:px-10">
        {/* tags encima del rótulo */}
        <span aria-hidden="true" className="pointer-events-none absolute -left-2 top-1 rotate-[-10deg] font-tag text-5xl text-bubble/70 sm:text-7xl" style={{ filter: "url(#rough)" }}>
          dbh
        </span>
        <span aria-hidden="true" className="pointer-events-none absolute right-[6%] -top-1 rotate-[8deg] font-marker text-2xl text-navy/70 sm:text-4xl" style={{ filter: "url(#rough)" }}>
          nadie ✦ crew
        </span>
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[6%] hidden rotate-[-6deg] font-tag text-5xl text-brand/80 sm:block lg:left-[12%]" style={{ filter: "url(#rough)" }}>
          sin permiso
        </span>
        {/* chorreado desde el rótulo */}
        <svg aria-hidden="true" viewBox="0 0 40 60" className="pointer-events-none absolute left-[22%] top-0 h-14 w-9 text-bubble/80">
          <path d="M20 0 C14 10 14 28 20 44 C26 28 26 10 20 0Z M18 44 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" fill="currentColor" />
        </svg>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
          <p className="-rotate-1 font-marker text-lg uppercase tracking-[0.35em] text-[#c10f24] sm:text-2xl" style={{ textShadow: "1px 1px 0 #000" }}>
            Miscelánea
          </p>
          <p
            className="font-block text-[clamp(2.4rem,11vw,6.5rem)] uppercase leading-[0.9] text-brand"
            style={{ textShadow: "0.06em 0.06em 0 #241b51, 0.1em 0.1em 0 #000", filter: "url(#rough)" }}
          >
            El Debhor
          </p>
          <p className="mt-2 rotate-[0.5deg] font-marker text-base text-ink sm:text-xl">
            Pintura ✦ Chorreadores ✦ Estampas ✦ Merch <span className="text-[#c10f24]">— la tienda del debhor</span>
          </p>
        </div>
      </div>

      {/* toldo de rayas con orilla ondulada */}
      <div id="toldo">
        <Toldo />
      </div>

      {/* letrero colgando */}
      <div className="pointer-events-none absolute right-3 top-full z-20 sm:right-[8%]">
        <div className="origin-top animate-[sway_3.2s_ease-in-out_infinite] motion-reduce:animate-none">
          <svg aria-hidden="true" viewBox="0 0 120 34" className="mx-auto block h-8 w-28">
            <path d="M10 0 L60 30 L110 0" fill="none" stroke="#0b0b0b" strokeWidth="4" strokeDasharray="5 3" strokeLinecap="round" />
          </svg>
          <p className="-mt-1 rotate-[-2deg] border-4 border-black bg-taxi px-4 py-2 text-center font-block text-base leading-tight text-ink shadow-[5px_5px_0_#000] sm:text-lg">
            Abierto
            <span className="block font-marker text-sm normal-case tracking-normal sm:text-base">pide por WhatsApp</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Copia fija del toldo: cuando el de la fachada sale por arriba de la pantalla, esta baja y se queda
 * de fondo bajo la barra, como si siguieras bajo la tienda. Va fuera de <main> para quedar sobre todas
 * las secciones.
 */
export function ToldoFijo() {
  const [fijo, setFijo] = useState(false);
  useEffect(() => {
    const el = document.getElementById("toldo");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFijo(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[55] transition-transform duration-500 ease-out motion-reduce:transition-none ${fijo ? "translate-y-0" : "-translate-y-[calc(100%_+_24px)]"}`}
    >
      <Toldo />
    </div>
  );
}
