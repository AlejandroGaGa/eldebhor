"use client";

import { useEffect, useState } from "react";
import type Lenis from "lenis";

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const getLenis = () => lenis;

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/** Salta a una sección por su id (con Lenis si hay; si no, salto nativo) y corrige si el layout se movió al llegar. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!lenis) {
    el.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }
  const fix = () => {
    // fotos que cargan tarde pueden mover la sección: se reajusta una vez al llegar
    const top = el.getBoundingClientRect().top;
    if (Math.abs(top) > 12) lenis?.scrollTo(el, { immediate: true });
  };
  lenis.scrollTo(el, { duration: 1.4, onComplete: fix });
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}
