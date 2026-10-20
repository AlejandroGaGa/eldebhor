"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const LINES: [string, string][] = [
  ["Latas de aerosol x14", "$2,380"],
  ["Boquillas fat cap x6", "$180"],
  ["Marcadores y tinta", "$260"],
  ["Ponerme bien pedote", "$1,150"],
  ["Taxi de regreso (4 AM)", "$120"],
];

/** Brand piece: the monthly "receipt" that explains the 20 varos. */
export default function Ticket() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 75%" } });
        tl.fromTo("[data-paper]", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "steps(14)" })
          .fromTo("[data-ring]", { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" })
          .fromTo("[data-coin]", { scale: 0, rotation: -200 }, { scale: 1, rotation: 12, duration: 0.8, ease: "back.out(2.5)" }, "<");
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto mt-24 grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <div>
        <h3 className="font-tag text-[clamp(2.6rem,8vw,5.5rem)] leading-[0.9] text-bone">
          ¿A dónde se fue el <span className="text-brand">varo</span>?
        </h3>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-bone/90">
          Cuentas claras: casi todo se fue en latas y en la peda. Para comer hoy quedaron{" "}
          <strong className="text-taxi">20 varos</strong>. Ni modo, la pared estaba primero.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-sm">
        <div
          data-paper
          className="relative rotate-2 bg-[#f7f5ef] px-6 pb-10 pt-6 font-body text-[15px] text-ink shadow-[10px_12px_0_rgba(0,0,0,.5)]"
          style={{
            maskImage: "radial-gradient(circle at 10px 100%, transparent 9px, #000 9.5px)",
            maskSize: "20px 100%",
            maskPosition: "bottom",
            WebkitMaskImage: "radial-gradient(circle at 10px 100%, transparent 9px, #000 9.5px)",
            WebkitMaskSize: "20px 100%",
          }}
        >
          <p className="text-center font-bold uppercase tracking-widest">Eldebhor</p>
          <p className="text-center text-sm uppercase">Corte de caja del mes</p>
          <p className="mt-1 text-center text-sm">Caja 01 · Atendió: yo mero</p>
          <hr className="my-3 border-dashed border-ink/50" />
          <dl>
            {LINES.map(([k, v]) => (
              <div key={k} className="flex gap-2 py-0.5">
                <dt className="min-w-0 flex-1 truncate">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <hr className="my-3 border-dashed border-ink/50" />
          <div className="flex justify-between font-bold">
            <span>Gastado</span>
            <span>$4,090</span>
          </div>
          <div className="relative mt-3 flex justify-between text-lg font-bold">
            <span>Para comer hoy</span>
            <span className="relative">
              $20.00
              <svg viewBox="0 0 160 70" className="pointer-events-none absolute -left-6 -top-4 h-[180%] w-[190%]" aria-hidden="true">
                <path
                  data-ring
                  d="M10 40 C8 12 140 4 150 30 C158 56 40 70 16 52 C4 42 30 20 70 16"
                  fill="none"
                  stroke="#ff2e88"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="600"
                  strokeDashoffset="0"
                />
              </svg>
            </span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Saldo</span>
            <span>$0.00</span>
          </div>
          <hr className="my-3 border-dashed border-ink/50" />
          <p className="text-center text-sm uppercase">¡Gracias por su visita!</p>
          <p className="text-center text-sm">vuelva pronto con más latas</p>
          <p className="mt-2 overflow-hidden whitespace-nowrap text-center tracking-[0.3em]" aria-hidden="true">
            ||| || ||| | || |||| | ||
          </p>
        </div>

        {/* generic 20 coin (not a real currency design) */}
        <div
          data-coin
          aria-hidden="true"
          className="absolute -bottom-8 -left-6 flex h-28 w-28 flex-col items-center justify-center rounded-full border-[5px] border-black text-ink shadow-[5px_5px_0_#000] sm:-left-12"
          style={{ background: "radial-gradient(circle, #e7c35a 0 55%, #c9ced6 56% 100%)", rotate: "12deg" }}
        >
          <span className="font-block text-4xl leading-none">20</span>
          <span className="font-body text-[11px] font-bold uppercase">varos</span>
        </div>
      </div>
    </div>
  );
}
