"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PALETTE } from "@/lib/palette";
import { store, useStore } from "@/lib/store";
import { blip, rattle, sprayOff, sprayOn } from "@/lib/audio";
import { hexToRgb } from "@/lib/color";
import SplitWords from "./SplitWords";

const CanScene = dynamic(() => import("./CanScene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center font-body text-base">cargando lata 3D…</div>,
});

function inkFor(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.18 ? "#121110" : "#f4f1ea";
}

export default function CanLab() {
  const color = useStore((s) => s.color);
  const colorName = useStore((s) => s.colorName);
  const [shake, setShake] = useState(0);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const spraying = useRef(false);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ink = inkFor(color);

  useEffect(() => {
    // mount the WebGL scene only when it gets close, run it only while visible
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: "900px" });
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    if (stage.current) {
      near.observe(stage.current);
      io.observe(stage.current);
    }
    return () => {
      near.disconnect();
      io.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-can-l]", {
          yPercent: 120,
          rotation: () => gsap.utils.random(-25, 25),
          stagger: 0.06,
          ease: "back.out(2)",
          duration: 0.8,
          scrollTrigger: { trigger: section.current, start: "top 70%" },
        });
      });
    },
    { scope: section },
  );

  const choose = (hex: string, name: string, i: number) => {
    store.set({ color: hex, colorName: name });
    blip(520 + i * 90);
  };

  const startSpray = () => {
    spraying.current = true;
    sprayOn(0.9);
  };
  const stopSpray = () => {
    spraying.current = false;
    sprayOff();
  };

  return (
    <section
      ref={section}
      className="relative overflow-hidden transition-colors duration-700"
      style={{ background: color, color: ink }}
      aria-labelledby="can-title"
    >
      {/* halftone dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        aria-hidden="true"
        style={{ backgroundImage: `radial-gradient(circle, ${ink} 1.6px, transparent 2px)`, backgroundSize: "16px 16px", maskImage: "linear-gradient(135deg, #000, transparent 70%)" }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-24 sm:px-10 lg:grid-cols-2 lg:py-32">
        <div>
          <h2 id="can-title" className="overflow-hidden pb-2 font-block text-[clamp(3rem,10vw,7.5rem)] uppercase leading-[0.95]">
            <SplitWords text="Elige tu lata" charProps={{ "data-can-l": "" }} />
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed">
            El color que escojas va contigo: el cursor, los stickers y el muro libre pintan con esta lata.
            <strong className="font-bold"> Mantén presionada la lata para rociar.</strong>
          </p>

          <fieldset className="mt-8">
            <legend className="mb-3 font-body text-base font-bold uppercase tracking-widest">Color · {colorName}</legend>
            <div className="flex flex-wrap gap-3">
              {PALETTE.map((p, i) => {
                const checked = p.hex === color;
                return (
                  <label
                    key={p.hex}
                    data-cursor={p.name.toUpperCase()}
                    className={`group relative flex min-h-[56px] min-w-[56px] cursor-pointer items-center justify-center rounded-full border-4 border-black transition-transform hover:-translate-y-1 hover:rotate-6 has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-offset-4 ${checked ? "scale-110 shadow-[0_0_0_4px_#fff,0_0_0_8px_#000]" : "shadow-[4px_4px_0_#000]"}`}
                    style={{ background: p.hex, outlineColor: ink }}
                  >
                    <input
                      type="radio"
                      name="paint"
                      value={p.hex}
                      checked={checked}
                      onChange={() => choose(p.hex, p.name, i)}
                      className="sr-only"
                    />
                    <span className="sr-only">{p.name}</span>
                    {checked && (
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 12l5 5L20 6" fill="none" stroke={inkFor(p.hex)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              data-cursor="CLACK"
              onClick={() => {
                setShake((n) => n + 1);
                rattle(10, 0.85);
              }}
              className="min-h-[52px] -rotate-2 border-4 border-black bg-black px-6 py-3 font-block text-base text-white shadow-[6px_6px_0_rgba(0,0,0,.35)] transition-transform hover:-rotate-3 hover:scale-105 active:scale-95"
            >
              Agitar lata
            </button>
            <button
              type="button"
              data-cursor="PSSSH"
              onPointerDown={startSpray}
              onPointerUp={stopSpray}
              onPointerLeave={stopSpray}
              onPointerCancel={stopSpray}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && startSpray()}
              onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stopSpray()}
              onBlur={stopSpray}
              className="min-h-[52px] rotate-1 border-4 border-black bg-white px-6 py-3 font-block text-base text-black shadow-[6px_6px_0_rgba(0,0,0,.35)] transition-transform hover:rotate-2 hover:scale-105 active:scale-95"
            >
              Rociar (mantén)
            </button>
          </div>
        </div>

        <div
          ref={stage}
          data-cursor="MANTÉN"
          className="relative h-[60dvh] min-h-[380px] select-none lg:h-[80dvh]"
          onPointerDown={startSpray}
          onPointerUp={stopSpray}
          onPointerLeave={stopSpray}
          onPointerCancel={stopSpray}
          aria-hidden="true"
        >
          {mounted && <CanScene color={color} colorName={colorName} shake={shake} spraying={spraying} active={active} />}
        </div>
      </div>
    </section>
  );
}
