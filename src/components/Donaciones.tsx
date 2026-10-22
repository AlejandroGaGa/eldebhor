"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { clabeBonita, DONACION, waLink } from "@/data/site";
import { blip, slap } from "@/lib/audio";
import { Toast, useToast } from "./ProductCard";

gsap.registerPlugin(ScrollTrigger);

/** Sección de donaciones: datos bancarios bien grandes, botón para copiar la CLABE y aviso por WhatsApp. */
export default function Donaciones() {
  const root = useRef<HTMLElement>(null);
  const { toast, say } = useToast();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-dona-title] > span", {
          yPercent: 120,
          rotation: () => gsap.utils.random(-25, 25),
          stagger: 0.06,
          ease: "back.out(2.2)",
          duration: 0.8,
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
        gsap.from("[data-dona-card]", {
          autoAlpha: 0,
          y: 60,
          rotation: -4,
          duration: 1,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: { trigger: root.current, start: "top 65%" },
        });
      });
    },
    { scope: root },
  );

  const copiar = async (texto: string, que: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      slap();
      say(`${que} copiada. ¡Gracias por apoyar!`);
    } catch {
      blip(220);
      say(`No se pudo copiar. ${que}: ${texto}`);
    }
  };

  const filas = [
    { k: "Banco", v: DONACION.banco },
    { k: "Beneficiario", v: DONACION.beneficiario },
  ];

  return (
    <section ref={root} id="donaciones" className="relative scroll-mt-16 overflow-hidden bg-bubble text-white" aria-labelledby="dona-title">
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        aria-hidden="true"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, #121110 0 6px, transparent 6px 22px)", maskImage: "linear-gradient(180deg, transparent, #000 40%, transparent)" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-10 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="font-body text-base font-bold uppercase tracking-[0.35em]">✦ Apoya la causa</p>
            <h2
              id="dona-title"
              data-dona-title
              className="mt-2 flex flex-wrap overflow-hidden pb-3 font-block text-[clamp(3rem,13vw,8.5rem)] uppercase leading-[0.9]"
              style={{ textShadow: "6px 6px 0 #121110" }}
            >
              <span className="sr-only">Donar</span>
              {"Donar".split("").map((c, i) => (
                <span key={i} aria-hidden="true" className="inline-block">
                  {c}
                </span>
              ))}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed">
              Si no quieres merch pero sí quieres echar la mano, puedes donar por transferencia. Copia la CLABE, haz tu depósito desde tu banco y listo.
            </p>
            <p className="mt-3 max-w-xl -rotate-1 font-marker text-xl">Cualquier cantidad suma. Hasta 20 varos son una comida.</p>
            <a
              href={waLink("Hola, acabo de hacer una donación a ELDEBHOR. Te mando mi comprobante:")}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="WA"
              className="mt-8 inline-flex min-h-[52px] items-center gap-2 -rotate-1 border-4 border-black bg-ink px-5 py-3 font-block text-base text-bone shadow-[6px_6px_0_#ffe600] transition-transform hover:rotate-1 hover:scale-105"
            >
              Avisar por WhatsApp
              <span className="sr-only"> (abre el chat en otra pestaña)</span>
            </a>
          </div>

          {/* ficha bancaria */}
          <div data-dona-card className="rotate-1 border-4 border-black bg-bone p-6 text-ink shadow-[10px_10px_0_#121110] sm:p-8">
            <p className="font-body text-sm font-bold uppercase tracking-[0.3em] text-ink/70">Transferencia bancaria</p>
            <dl className="mt-4 space-y-4">
              {filas.map((f) => (
                <div key={f.k}>
                  <dt className="font-body text-sm font-bold uppercase tracking-[0.25em] text-ink/70">{f.k}</dt>
                  <dd className="mt-1 font-block text-2xl leading-tight sm:text-3xl">{f.v}</dd>
                </div>
              ))}
              <div>
                <dt className="font-body text-sm font-bold uppercase tracking-[0.25em] text-ink/70">CLABE interbancaria</dt>
                <dd className="mt-1 break-all font-mono text-2xl font-bold leading-tight tracking-wide sm:text-3xl" aria-label={`CLABE ${DONACION.clabe.split("").join(" ")}`}>
                  {clabeBonita(DONACION.clabe)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => copiar(DONACION.clabe, "CLABE")}
                data-cursor="COPIAR"
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 border-4 border-black bg-taxi px-5 py-3 font-block text-base text-ink shadow-[6px_6px_0_#121110] transition-transform hover:-rotate-1 hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <CopyIcon /> Copiar CLABE
              </button>
              <button
                type="button"
                onClick={() => copiar(DONACION.beneficiario, "Nombre del beneficiario")}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 border-4 border-black bg-bone px-5 py-3 font-body text-base font-bold text-ink shadow-[6px_6px_0_#121110] transition-transform hover:rotate-1 hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Copiar nombre
              </button>
            </div>
            <p className="mt-4 text-sm font-bold text-ink/70">La CLABE sirve desde cualquier banco de México (SPEI).</p>
          </div>
        </div>
      </div>

      <Toast text={toast} />
    </section>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
