"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { scrollToTop } from "@/lib/scroll";
import { useStore } from "@/lib/store";
import SplitWords from "./SplitWords";

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const color = useStore((s) => s.color);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-foot-l]",
          { yPercent: 110, rotation: () => gsap.utils.random(-30, 30) },
          {
            yPercent: 0,
            rotation: () => gsap.utils.random(-6, 6),
            stagger: 0.05,
            ease: "back.out(2)",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 35%", scrub: 1 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden bg-ink px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24 sm:px-10">
      <p className="overflow-hidden pb-4 text-center font-wet text-[clamp(3rem,12vw,11rem)] uppercase leading-[0.95]">
        <SplitWords text="Sigue pintando" charProps={{ "data-foot-l": "" }} charStyle={(i) => ({ color: i % 3 === 0 ? color : "#f4f1ea" })} />
      </p>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-6 border-t-4 border-dashed border-bone/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base text-bone/85">
          <Image src="/brand/logo-tag.png" alt="ELDEBHOR" width={880} height={669} className="mb-4 h-24 w-auto" />
          <p className="font-bold text-bone">© 2026 ELDEBHOR</p>
          <p>Hecho con 20 varos, latas de sobra y cero permisos.</p>
          <p>Ninguna pared fue lastimada durante la creación de este sitio. Bueno, casi.</p>
          <nav aria-label="Secciones" className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <a href="#obras" className="inline-flex min-h-[44px] items-center font-bold text-brand underline underline-offset-4">Obras</a>
            <a href="#merch" className="inline-flex min-h-[44px] items-center font-bold text-brand underline underline-offset-4">Merch</a>
            <a href="#muro-libre" className="inline-flex min-h-[44px] items-center font-bold text-brand underline underline-offset-4">Muro libre</a>
          </nav>
          <p className="mt-2 text-sm text-bone/70">
            Pista: ↑ ↑ ↓ ↓ ← → ← → B A
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToTop}
          data-cursor="ARRIBA"
          className="min-h-[52px] self-start -rotate-2 border-4 border-black bg-taxi px-6 py-3 font-block text-base text-ink shadow-[6px_6px_0_#000] transition-transform hover:rotate-2 hover:scale-105 sm:self-auto"
        >
          Volver a la pared ↑
        </button>
      </div>
    </footer>
  );
}
