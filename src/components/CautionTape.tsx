"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getLenis } from "@/lib/scroll";

const A = "PINTURA FRESCA ✦ HOY COMO CON 20 VAROS ✦ ELDEBHOR ✦ SIN PERMISO ✦ ";
const B = "PRECAUCIÓN ✦ TODO EL VARO SE FUE EN LATAS ✦ BIEN PEDOTE Y BIEN PINTADO ✦ ";

/** Two crossing caution tapes whose speed & direction follow your scroll. */
export default function CautionTape() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-tape-row]", root.current);
      const wrap = gsap.utils.wrap(-50, 0);
      const setters = rows.map((row) => gsap.quickSetter(row, "xPercent"));
      let pos = 0;
      let vel = 1;
      let dir = 1;
      const tick = (_t: number, dt: number) => {
        const v = getLenis()?.velocity ?? 0;
        if (v > 0.2) dir = 1;
        else if (v < -0.2) dir = -1;
        const target = (1 + Math.min(Math.abs(v) * 0.3, 9)) * dir;
        vel += (target - vel) * 0.08;
        pos += vel * dt * 0.0023;
        setters.forEach((set, i) => set(wrap(i ? -pos - 25 : pos)));
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative z-20 -my-14 h-44 overflow-hidden sm:h-56" aria-hidden="true">
      <Tape text={A} a="#ffe600" b="#151515" fg="#151515" className="top-10 -rotate-[4deg]" />
      <Tape text={B} a="#151515" b="#151515" fg="#2ec6ee" className="top-24 rotate-[3deg] sm:top-28" stripes={false} />
    </div>
  );
}

function Tape({ text, a, b, fg, className, stripes = true }: { text: string; a: string; b: string; fg: string; className: string; stripes?: boolean }) {
  return (
    <div
      className={`absolute -left-[10%] w-[120%] border-y-4 border-black py-2 shadow-[0_10px_20px_rgba(0,0,0,.5)] ${className}`}
      style={{ background: a }}
    >
      {stripes && <div className="tape absolute inset-x-0 top-0 h-2" style={{ "--tape-a": a, "--tape-b": b } as React.CSSProperties} />}
      {stripes && <div className="tape absolute inset-x-0 bottom-0 h-2" style={{ "--tape-a": a, "--tape-b": b } as React.CSSProperties} />}
      <div data-tape-row className="flex w-max whitespace-nowrap py-1 font-block text-xl sm:text-3xl" style={{ color: fg }}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="pr-2">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
