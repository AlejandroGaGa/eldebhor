"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { store, useStore } from "@/lib/store";
import { blip, sprayOff, unlockAudio } from "@/lib/audio";
import { scrollToId, scrollToTop } from "@/lib/scroll";
import { savePref, SOUND_COOKIE } from "@/lib/prefs";

export default function Hud() {
  const entered = useStore((s) => s.entered);
  const sound = useStore((s) => s.sound);
  const color = useStore((s) => s.color);
  const colorName = useStore((s) => s.colorName);
  const root = useRef<HTMLDivElement>(null);
  const level = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!entered) return;
    gsap.fromTo(root.current, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.6, ease: "back.out(2)" });
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        // the can empties as you scroll: you are "spending" paint
        gsap.set(level.current, { scaleY: 1 - self.progress });
        if (pctRef.current) pctRef.current.textContent = `${Math.round((1 - self.progress) * 100)}%`;
      },
    });
    return () => st.kill();
  }, [entered]);

  const toggleSound = () => {
    unlockAudio();
    const next = !store.get().sound;
    store.set({ sound: next });
    savePref(SOUND_COOKIE, next ? "si" : "no");
    if (!next) sprayOff();
    else blip(990);
  };

  return (
    <div ref={root} className="invisible pointer-events-none fixed inset-x-0 top-0 z-[60] opacity-0">
      <div className="flex items-start justify-between gap-2 p-3 sm:p-5">
        <button
          type="button"
          onClick={scrollToTop}
          data-cursor="ARRIBA"
          aria-label="ELDEBHOR, volver al inicio"
          className="pointer-events-auto flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-ink/80 px-3 backdrop-blur-sm"
        >
          <Image src="/brand/logo-tag.png" alt="" width={880} height={669} priority className="h-9 w-auto" />
        </button>
        <div className="pointer-events-auto flex items-center gap-2">
          <nav aria-label="Secciones" className="hidden items-center gap-2 md:flex">
            <a href="#obras" data-cursor="OBRAS" className="flex min-h-[48px] items-center rounded-full bg-ink/80 px-4 text-sm font-bold text-bone backdrop-blur-sm hover:text-brand">
              Obras
            </a>
            <a href="#merch" data-cursor="MERCH" className="flex min-h-[48px] items-center rounded-full bg-ink/80 px-4 text-sm font-bold text-bone backdrop-blur-sm hover:text-brand">
              Merch
            </a>
          </nav>
          {/* atajo directo al merch en celular (en pantallas grandes ya está en la barra) */}
          <a
            href="#merch"
            onClick={(e) => {
              e.preventDefault();
              blip(880);
              scrollToId("merch");
            }}
            data-cursor="MERCH"
            className="flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-full border-2 border-black bg-taxi px-4 text-sm font-bold text-ink shadow-[3px_3px_0_#000] md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            Merch
            <span className="sr-only"> (ir directo a la tienda)</span>
          </a>
          <p className="flex min-h-[48px] items-center gap-2 whitespace-nowrap rounded-full bg-ink/80 px-3 text-sm text-bone backdrop-blur-sm" aria-live="polite">
            <span className="h-5 w-5 rounded-full border-2 border-bone" style={{ background: color }} aria-hidden="true" />
            <span className="hidden min-[680px]:inline">Lata:</span> <span className="font-bold max-[559px]:sr-only">{colorName}</span>
          </p>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Sonido sí" : "Sonido no"}
            data-cursor={sound ? "MUTE" : "SONIDO"}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-full bg-ink/80 px-3 text-sm text-bone backdrop-blur-sm"
          >
            <SoundBars on={sound} />
            <span className="hidden whitespace-nowrap min-[560px]:inline">{sound ? "Sonido sí" : "Sonido no"}</span>
          </button>
        </div>
      </div>
      {/* paint level */}
      <div className="absolute right-3 top-[calc(100dvh-13rem)] hidden flex-col items-center gap-1 sm:flex" aria-hidden="true">
        <div className="relative h-24 w-7 overflow-hidden rounded-md border-[3px] border-bone bg-ink/80">
          <div ref={level} className="absolute inset-0 origin-bottom" style={{ background: color }} />
        </div>
        <span ref={pctRef} className="font-mono text-xs text-bone">100%</span>
      </div>
    </div>
  );
}

function SoundBars({ on }: { on: boolean }) {
  return (
    <span className="flex h-5 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          data-eq
          className="w-[4px] rounded-sm bg-bone"
          style={{
            height: on ? undefined : "4px",
            animation: on ? `eq 0.${5 + i}s ease-in-out ${i * 0.1}s infinite alternate` : "none",
          }}
        />
      ))}
      <style>{`@keyframes eq{from{height:4px}to{height:20px}}`}</style>
    </span>
  );
}
