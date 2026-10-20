"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Ticket from "./Ticket";

type W = { w: string; c?: string; k?: boolean };
const TEXT: W[] = [
  { w: "Hoy" }, { w: "quiero" }, { w: "ver" }, { w: "a" }, { w: "mi" }, { w: "morrita,", c: "#ff2e88", k: true },
  { w: "así" }, { w: "que" }, { w: "si" }, { w: "quieres" }, { w: "que" }, { w: "hagamos" }, { w: "un" },
  { w: "video", c: "#2ec6ee", k: true }, { w: "nuevo" },
  { w: "compra", c: "#ffe600" }, { w: "los" }, { w: "productos," }, { w: "carnal.", c: "#b6ff00", k: true },
];

const STATS = [
  { n: 3, suffix: " AM", label: "hora oficial de trabajo", c: "#00c2ff", r: -4 },
  { n: 0, suffix: "", label: "permisos pedidos", c: "#ff2e88", r: 3 },
  { n: 400, suffix: " ml", label: "de presión por lata", c: "#b6ff00", r: -2 },
];

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words = gsap.utils.toArray<HTMLElement>(".mword", root.current);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-mtext]", start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        });
        words.forEach((w, i) => {
          const keyword = w.dataset.k === "1";
          tl.fromTo(
            w,
            { color: "rgba(0,0,0,0)", y: 30, rotation: 0, scale: 0.9 },
            {
              color: w.style.getPropertyValue("--c") || "#f4f1ea",
              "--stroke": "rgba(244,241,234,0)",
              y: 0,
              rotation: keyword ? gsap.utils.random(-6, 6) : gsap.utils.random(-1.5, 1.5),
              scale: keyword ? 1.12 : 1,
              ease: "back.out(3)",
              duration: 0.5,
            },
            i * 0.18,
          );
        });
        tl.fromTo("[data-circle]", { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.4, ease: "none" }, ">-1.4");

        // stats count up
        gsap.utils.toArray<HTMLElement>("[data-count]", root.current).forEach((el) => {
          const target = Number(el.dataset.count);
          const o = { v: target === 0 ? 99 : 0 };
          gsap.to(o, {
            v: target,
            duration: 1.6,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
            onUpdate: () => (el.textContent = String(Math.round(o.v))),
          });
        });
        gsap.from("[data-slogan]", {
          autoAlpha: 0,
          y: 50,
          rotation: -4,
          duration: 0.8,
          ease: "back.out(2)",
          scrollTrigger: { trigger: "[data-slogan]", start: "top 88%" },
        });
        gsap.from("[data-stat]", {
          scale: 0,
          rotation: () => gsap.utils.random(-30, 30),
          stagger: 0.12,
          ease: "back.out(2.5)",
          duration: 0.7,
          scrollTrigger: { trigger: "[data-stats]", start: "top 85%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="manifiesto" className="concrete relative overflow-x-clip px-4 pb-24 pt-40 sm:px-10 sm:pb-36 sm:pt-56" aria-labelledby="manifesto-title">
      <h2 id="manifesto-title" className="mx-auto mb-8 max-w-6xl font-body text-base uppercase tracking-[0.35em] text-taxi">
        ✦ Manifiesto 001
      </h2>
      <p data-mtext className="relative mx-auto max-w-6xl font-block text-[clamp(2.1rem,7.4vw,6.2rem)] uppercase leading-[1.08]">
        {TEXT.map((t, i) => (
          <span
            key={i}
            data-k={t.k ? "1" : "0"}
            className={`mword relative ${t.k ? "font-tag normal-case" : ""}`}
            style={{ "--c": t.c ?? "#f4f1ea" } as React.CSSProperties}
          >
            {t.w}
            {t.w === "morrita," && (
              <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-[12%] -inset-y-[22%] h-[144%] w-[124%]" aria-hidden="true">
                <path
                  data-circle
                  d="M20 70 C10 20 120 6 200 14 C280 22 300 70 250 98 C190 124 60 118 24 86 C8 72 30 40 80 30"
                  fill="none"
                  stroke="#ffe600"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset="0"
                />
              </svg>
            )}
          </span>
        ))}
      </p>

      <figure
        data-slogan
        className="relative mx-auto mt-16 max-w-4xl -rotate-1 border-4 border-black bg-bone p-6 text-ink shadow-[10px_10px_0_#2ec6ee] sm:mt-24 sm:p-10"
      >
        <span aria-hidden="true" className="absolute -top-3 left-8 h-6 w-24 -rotate-3 bg-[#e8dcb0]/90 shadow-sm" />
        <p className="font-block text-sm uppercase tracking-[0.3em] text-ink/70">✦ Slogan</p>
        <blockquote className="mt-3 font-marker text-[clamp(1.7rem,4.8vw,3.4rem)] leading-[1.15]">
          «Hoy voy a comer con estos <mark className="rounded-sm bg-brand px-2 text-ink">20 varos</mark>, porque todo mi dinero que tenía, me lo gasté
          pintando y poniéndome bien pedote.»
        </blockquote>
        <figcaption className="mt-5 font-body text-base font-bold uppercase">— ELDEBHOR</figcaption>
      </figure>

      <ul data-stats className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {STATS.map((s) => (
          <li
            key={s.label}
            data-stat
            className="border-4 border-black p-5 text-ink shadow-[8px_8px_0_#000]"
            style={{ background: s.c, transform: `rotate(${s.r}deg)` }}
          >
            <p className="font-wet text-6xl leading-none">
              <span data-count={s.n}>{s.n}</span>
              {s.suffix}
            </p>
            <p className="mt-2 font-body text-base font-bold uppercase">{s.label}</p>
          </li>
        ))}
      </ul>

      <Ticket />
    </section>
  );
}
