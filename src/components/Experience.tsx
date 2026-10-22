"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { setLenis } from "@/lib/scroll";
import { store, useStore } from "@/lib/store";
import { blip, unlockAudio } from "@/lib/audio";
import { readPref, SOUND_COOKIE } from "@/lib/prefs";
import Loader from "./Loader";
import Cursor from "./Cursor";
import Hud from "./Hud";
import SpotifyPlayer from "./SpotifyPlayer";
import Hero from "./Hero";
import CautionTape from "./CautionTape";
import Manifesto from "./Manifesto";
import dynamic from "next/dynamic";
import Gallery from "./Gallery";
import Merch from "./Merch";
import Reels from "./Reels";
import Donaciones from "./Donaciones";
import LazySection from "./LazySection";
import Footer from "./Footer";
import SubirBtn from "./SubirBtn";
import { ToldoFijo } from "./Fachada";
import type { Producto } from "@/data/merch";
import type { Promo } from "@/lib/offers";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Secciones pesadas (canvas, three.js, matter-js): su JS se descarga solo cuando el visitante se acerca.
const Train = dynamic(() => import("./Train"), { ssr: false });
const CanLab = dynamic(() => import("./CanLab"), { ssr: false });
const StickerBomb = dynamic(() => import("./StickerBomb"), { ssr: false });
const FreeWall = dynamic(() => import("./FreeWall"), { ssr: false });

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export default function Experience({ products, promo, reels }: { products: Producto[]; promo: Promo | null; reels: string[] }) {
  const entered = useStore((s) => s.entered);

  // Smooth scroll, synced with GSAP's ticker
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.4, anchors: true });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if (!store.get().entered) lenis.stop();
    const unsub = store.subscribe(() => {
      if (store.get().entered) lenis.start();
    });
    return () => {
      unsub();
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // Visitante que ya eligió sonido: entra directo. El navegador no deja sonar nada hasta el primer toque o tecla,
  // así que se desbloquea el audio en ese primer gesto.
  useEffect(() => {
    const pref = readPref(SOUND_COOKIE);
    if (pref !== "si" && pref !== "no") return;
    const sound = pref === "si";
    store.set({ sound, entered: true });
    if (!sound) return;
    const events = ["pointerdown", "keydown", "touchend"] as const;
    function off() {
      events.forEach((e) => window.removeEventListener(e, unlock));
    }
    function unlock() {
      unlockAudio();
      off();
    }
    events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    return off;
  }, []);

  // Custom cursor class (only for fine pointers; CSS guards the rest)
  useEffect(() => {
    document.documentElement.classList.add("custom-cursor");
    return () => document.documentElement.classList.remove("custom-cursor");
  }, []);

  // Easter egg: Konami code -> chaos mode
  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === KONAMI[i] ? i + 1 : k === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) {
        i = 0;
        const chaos = !store.get().chaos;
        store.set({ chaos });
        document.documentElement.classList.toggle("chaos", chaos);
        blip(chaos ? 1320 : 440);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tab title gets needy when you leave
  useEffect(() => {
    const original = document.title;
    const onVis = () => {
      document.title = document.hidden ? "¡VUELVE! la pintura se seca…" : original;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Recalculate pins once the loader is gone and fonts are in
  useEffect(() => {
    if (!entered) return;
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, [entered]);

  return (
    <>
      <a
        href="#muro-libre"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-taxi focus:px-4 focus:py-3 focus:font-block focus:text-ink"
      >
        Saltar al muro libre
      </a>
      <SvgDefs />
      <Loader />
      <Hud conReels={reels.length > 0} />
      <SpotifyPlayer />
      <main id="main" inert={!entered} aria-hidden={!entered}>
        {/* la portada y la tienda van primero: el resto de la experiencia sigue abajo */}
        <Hero products={products} promo={promo} />
        <Merch products={products} promo={promo} />
        {reels.length > 0 && (
          <LazySection id="reels" className="min-h-[70dvh] bg-[#0b0b0c]" margen="600px">
            <Reels reels={reels} />
          </LazySection>
        )}
        <Donaciones />
        <CautionTape />
        <Manifesto />
        <LazySection className="min-h-[100dvh] bg-[#0b0b0c]">
          <Train />
        </LazySection>
        <Gallery />
        <LazySection className="concrete min-h-[100dvh]">
          <CanLab />
        </LazySection>
        <LazySection className="concrete-light min-h-[100dvh]">
          <StickerBomb />
        </LazySection>
        <LazySection id="muro-libre" className="concrete min-h-[80dvh] scroll-mt-4">
          <FreeWall />
        </LazySection>
        <Footer />
      </main>
      <ToldoFijo />
      <SubirBtn />
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

/** Shared SVG filters: "line boil" (hand-drawn jitter) and rough paper edges. */
function SvgDefs() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const turb = document.getElementById("boil-turb");
    if (!turb) return;
    let seed = 1;
    const id = window.setInterval(() => {
      seed = (seed % 7) + 1;
      turb.setAttribute("seed", String(seed));
    }, 130);
    return () => window.clearInterval(id);
  }, []);
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="boil" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence id="boil-turb" type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" />
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="10" />
        </filter>
      </defs>
    </svg>
  );
}
