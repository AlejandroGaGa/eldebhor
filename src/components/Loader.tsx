"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { store } from "@/lib/store";
import { rattle, unlockAudio } from "@/lib/audio";
import { PALETTE } from "@/lib/palette";
import SprayCanIcon from "./SprayCanIcon";

const WORDS = ["CLACK", "CLACK!", "SHAKE", "TSSS", "CLAK", "PSSHH"];

export default function Loader() {
  const [gone, setGone] = useState(false);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const can = useRef<HTMLDivElement>(null);
  const pops = useRef<HTMLDivElement>(null);
  const stripes = useRef<HTMLDivElement>(null);
  const firstBtn = useRef<HTMLButtonElement>(null);

  // fake-ish progress that also waits for fonts
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = { p: 0 };
    let fontsDone = false;
    document.fonts?.ready.then(() => (fontsDone = true));
    const shake = reduced
      ? null
      : gsap.to(can.current, { rotation: 16, y: -14, duration: 0.09, yoyo: true, repeat: -1, ease: "power1.inOut", transformOrigin: "50% 60%" });
    let lastPop = 0;
    const tw = gsap.to(state, {
      p: 100,
      duration: reduced ? 0.6 : 2.6,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(state.p);
        if (v >= 99 && !fontsDone) return;
        setPct(v);
        if (!reduced && v - lastPop > 9) {
          lastPop = v;
          pop(pops.current);
        }
      },
      onComplete: () => {
        setPct(100);
        shake?.kill();
        gsap.to(can.current, { rotation: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
        setReady(true);
      },
    });
    return () => {
      tw.kill();
      shake?.kill();
    };
  }, []);

  useEffect(() => {
    if (ready) firstBtn.current?.focus();
  }, [ready]);

  function enter(sound: boolean) {
    unlockAudio();
    store.set({ sound });
    rattle(8, 0.7);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      store.set({ entered: true });
      gsap.to(root.current, { opacity: 0, duration: 0.3, onComplete: () => setGone(true) });
      return;
    }
    const bars = stripes.current?.children ?? [];
    gsap.set(bars, { xPercent: -130 });
    gsap.set(stripes.current, { opacity: 1 });
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to(can.current, { rotation: 20, y: -20, duration: 0.07, yoyo: true, repeat: 9, ease: "none" })
      .to(bars, { xPercent: 0, duration: 0.55, stagger: 0.06, ease: "power3.in" }, "<0.2")
      .add(() => {
        store.set({ entered: true });
        gsap.set(root.current?.querySelector("[data-loader-body]") ?? null, { autoAlpha: 0 });
      })
      .to(bars, { xPercent: 130, duration: 0.6, stagger: 0.06, ease: "power3.out" }, "+=0.05");
  }

  if (gone) return null;

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loader-title"
      className="fixed inset-0 z-[100] overflow-hidden"
    >
      <div data-loader-body className="concrete absolute inset-0 flex flex-col items-center justify-center gap-6 px-4 pb-[env(safe-area-inset-bottom)]">
        <div ref={pops} className="pointer-events-none absolute inset-0" aria-hidden="true" />
        <Image
          src="/brand/logo-tag.png"
          alt="ELDEBHOR"
          width={880}
          height={669}
          priority
          className="h-auto w-36 sm:w-56 [@media(max-height:720px)]:hidden"
        />
        <div ref={can} className="w-24 sm:w-32" style={{ transformOrigin: "50% 60%" }}>
          <SprayCanIcon color="#2ec6ee" className="h-auto w-full drop-shadow-[8px_10px_0_rgba(0,0,0,.6)]" />
        </div>
        <h1 id="loader-title" className="text-center font-mono text-base uppercase tracking-[0.3em] text-bone">
          {ready ? "La lata está lista" : "Agitando la lata"}
        </h1>
        <p
          className="font-wet text-7xl leading-none text-brand sm:text-9xl"
          style={{ textShadow: "5px 5px 0 #ff2e88, 10px 10px 0 #000" }}
          aria-live="polite"
        >
          {pct}%
        </p>
        <div className={`flex w-full max-w-md flex-col gap-3 transition-opacity duration-300 sm:flex-row ${ready ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <button
            ref={firstBtn}
            type="button"
            disabled={!ready}
            onClick={() => enter(true)}
            data-cursor="VAMOS"
            className="min-h-[52px] flex-1 -rotate-2 border-4 border-black bg-brand px-5 py-3 font-block text-base text-ink shadow-[6px_6px_0_#000] transition-transform hover:-rotate-3 hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Entrar con sonido
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => enter(false)}
            data-cursor="SHH"
            className="min-h-[52px] flex-1 rotate-1 border-4 border-black bg-bone px-5 py-3 font-block text-base text-ink shadow-[6px_6px_0_#000] transition-transform hover:rotate-2 hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Sin sonido
          </button>
        </div>
        <p className="max-w-sm text-center text-sm text-bone/80">
          Experiencia interactiva hecha con 20 varos. Mejor con audífonos y con el mouse en la mano.
        </p>
      </div>
      <div ref={stripes} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
        {PALETTE.slice(0, 6).map((p, i) => (
          <div key={p.hex} className="absolute -inset-y-10 w-[46%]" style={{ left: `${i * 18 - 12}%` }}>
            <div className="h-full w-full -skew-x-12" style={{ background: p.hex }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function pop(host: HTMLElement | null) {
  if (!host) return;
  const el = document.createElement("span");
  el.textContent = WORDS[Math.floor(Math.random() * WORDS.length)];
  el.className = "absolute font-block pointer-events-none";
  const c = PALETTE[Math.floor(Math.random() * 6)].hex;
  Object.assign(el.style, {
    left: `${15 + Math.random() * 70}%`,
    top: `${15 + Math.random() * 60}%`,
    color: c,
    fontSize: `${1.2 + Math.random() * 2.4}rem`,
    textShadow: "3px 3px 0 #000",
    WebkitTextStroke: "1px #000",
  });
  host.appendChild(el);
  gsap.fromTo(
    el,
    { scale: 0, rotation: gsap.utils.random(-40, 40) },
    {
      scale: 1,
      duration: 0.35,
      ease: "back.out(3)",
      onComplete: () => {
        gsap.to(el, { opacity: 0, y: 30, duration: 0.5, delay: 0.25, onComplete: () => el.remove() });
      },
    },
  );
}
