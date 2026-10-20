"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { blip } from "@/lib/audio";
import { scrollToTop } from "@/lib/scroll";

/** Botón flotante «Subir»: aparece después de bajar casi una pantalla y regresa al inicio. */
export default function SubirBtn() {
  const entered = useStore((s) => s.entered);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!entered) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      setShown(window.scrollY > window.innerHeight * 0.8);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [entered]);

  return (
    <button
      type="button"
      onClick={() => {
        blip(880);
        scrollToTop();
      }}
      aria-label="Subir al inicio"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      data-cursor="ARRIBA"
      className={`fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+7.5rem)] right-3 z-[66] sm:bottom-[max(1rem,env(safe-area-inset-bottom))] flex h-14 w-14 -rotate-3 items-center justify-center border-4 border-black bg-taxi text-ink shadow-[5px_5px_0_#000] transition-all duration-300 hover:rotate-2 hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none sm:right-5 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <svg width="26" height="26" viewBox="0 0 28 56" aria-hidden="true">
        <path d="M14 54 V12" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        <path d="M3 22 L14 6 L25 22" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">Subir</span>
    </button>
  );
}
