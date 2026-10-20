"use client";

import { useEffect, useRef, useState } from "react";
import { store, useStore } from "@/lib/store";
import { PLAYER_COOKIE, readPref, savePref, SOUND_COOKIE } from "@/lib/prefs";
import { sprayOff, unlockAudio } from "@/lib/audio";
import { SONG_SRC, SONG_START, SONG_TITLE } from "@/data/site";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/**
 * Mini reproductor: aparece en cuanto se entra al sitio y arranca la canción (/rolita.mp3)
 * desde el segundo 4 si el visitante entró con sonido (o en cuanto lo active en la barra).
 * Se puede minimizar (la canción sigue sonando) y se recuerda en una cookie.
 * Si el navegador bloquea el audio automático, suena en el primer toque o tecla del visitante.
 */
export default function SpotifyPlayer() {
  const entered = useStore((s) => s.entered);
  const sound = useStore((s) => s.sound);
  const [shown, setShown] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const started = useRef(false);
  const userPaused = useRef(false); // el visitante pausó o cerró: no reanudar solos
  const retryOff = useRef<(() => void) | null>(null);

  // si el navegador bloqueó el play automático, se reintenta en el primer gesto del visitante
  const armRetry = () => {
    if (retryOff.current) return;
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const off = () => {
      events.forEach((e) => window.removeEventListener(e, onGesture));
      retryOff.current = null;
    };
    function onGesture() {
      off();
      const a = audio.current;
      if (a && a.paused && !userPaused.current && store.get().sound) a.play().catch(() => undefined);
    }
    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    retryOff.current = off;
  };
  useEffect(() => () => retryOff.current?.(), []);

  // arranca una sola vez: posiciona en el segundo inicial y solo da play si hay sonido
  const begin = () => {
    const a = audio.current;
    if (!a || started.current) return;
    started.current = true;
    const go = () => {
      if (SONG_START > 0 && SONG_START < (a.duration || Infinity) - 1) a.currentTime = SONG_START;
      if (store.get().sound)
        a.play().catch(() => {
          setPlaying(false);
          armRetry();
        });
    };
    if (a.readyState >= 1) go();
    else a.addEventListener("loadedmetadata", go, { once: true });
  };

  // arranca al entrar al sitio (el botón «Con sonido» de la pantalla de carga ya cuenta como gesto del visitante)
  useEffect(() => {
    if (!entered) return;
    const id = window.setTimeout(() => {
      setMinimized(readPref(PLAYER_COOKIE) !== "max"); // por defecto vive en la barra; abierto solo si así lo dejó
      setShown(true);
      begin();
    }, 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered]);

  // «Sonido no» en la barra pausa la canción; «Sonido sí» la arranca (o la reanuda si no la pausó el visitante)
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (!sound) {
      a.pause();
      return;
    }
    if (!entered) return;
    if (!started.current) begin();
    else if (a.paused && !userPaused.current) a.play().catch(() => armRetry());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound, entered]);

  // Play/pausa es también el interruptor de sonido del sitio (sustituye al «Sonido sí/no» de la barra):
  // al dar play se activan la canción y los efectos; al pausar se apagan y se recuerda en la cookie.
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    unlockAudio();
    if (a.paused) {
      userPaused.current = false;
      if (!started.current) started.current = true;
      if (a.ended || (a.currentTime < 1 && SONG_START > 0)) a.currentTime = SONG_START;
      store.set({ sound: true });
      savePref(SOUND_COOKIE, "si");
      a.play().catch(() => setPlaying(false));
    } else {
      userPaused.current = true;
      a.pause();
      store.set({ sound: false });
      savePref(SOUND_COOKIE, "no");
      sprayOff();
    }
  };

  const setMin = (value: boolean) => {
    setMinimized(value);
    savePref(PLAYER_COOKIE, value ? "min" : "max");
  };

  const visible = shown;

  // Posición: abierto vive abajo a la izquierda; minimizado viaja (animado) a la esquina superior derecha,
  // justo debajo de los botones de la barra, para no estorbar al navegar.
  const box = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ x: 12, y: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const place = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const margen = window.innerWidth >= 640 ? 20 : 12;
      if (minimized) {
        // offsetTop/offsetLeft ignoran la animación de entrada de la barra (que la baja 20 px): así no se mide a medio camino
        const hueco = document.getElementById("hueco-rola") as HTMLElement | null;
        if (hueco) setPos({ x: hueco.offsetLeft + hueco.offsetWidth - w, y: hueco.offsetTop + (hueco.offsetHeight - h) / 2 });
        else setPos({ x: window.innerWidth - w - margen, y: margen });
      } else {
        const safe = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0") || 0;
        setPos({ x: margen, y: window.innerHeight - h - margen - safe });
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [minimized, visible]);

  const playBtn = (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Pausar la canción y apagar el sonido" : "Reproducir la canción y activar el sonido"}
      aria-pressed={playing}
      data-cursor={playing ? "PAUSA" : "PLAY"}
      className={`flex shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-brand text-ink ${minimized ? "h-11 w-11" : "h-12 w-12"}`}
    >
      {playing ? (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <rect x="3" y="2" width="4" height="14" fill="currentColor" />
          <rect x="11" y="2" width="4" height="14" fill="currentColor" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M4 2l12 7-12 7z" fill="currentColor" />
        </svg>
      )}
    </button>
  );

  return (
    <section
      ref={box}
      aria-label="Canción de la tienda"
      aria-hidden={!visible}
      inert={!visible}
      style={{ transform: `translate(${pos.x}px, ${visible ? pos.y : pos.y + 200}px)` }}
      className={`sp-widget fixed left-0 top-0 z-[65] border-4 border-black bg-ink transition-[transform,opacity,box-shadow,border-radius] duration-700 ease-[cubic-bezier(.2,.9,.3,1.1)] motion-reduce:transition-none ${
        minimized ? "rounded-full p-1 shadow-[3px_3px_0_#2ec6ee]" : "w-[min(340px,calc(100vw-1.5rem))] p-3 shadow-[6px_6px_0_#2ec6ee]"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {/* el <audio> queda siempre montado: minimizar no corta la música.
          Solo se descarga si el visitante tiene sonido (o cuando le dé play): sin sonido no gasta datos. */}
      <audio
        ref={audio}
        src={entered ? SONG_SRC : undefined}
        preload={entered && sound ? "auto" : "none"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />

      {minimized ? (
        <div className="flex items-center gap-1">
          {playBtn}
          <span className={`hidden whitespace-nowrap px-1 font-block text-sm text-brand sm:inline ${playing ? "animate-pulse motion-reduce:animate-none" : "opacity-70"}`}>
            <span aria-hidden="true">♪ </span>
            {playing ? "Sonido sí" : "Sonido no"}
          </span>
          <button
            type="button"
            onClick={() => setMin(false)}
            aria-label="Mostrar el reproductor"
            data-cursor="ABRIR"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-bone text-bone"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11l5-5 5 5" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {playBtn}
          <div className="min-w-0 flex-1">
            <p className="truncate font-block text-sm uppercase tracking-wide text-brand">
              ♪ {playing ? "Suena ahora" : "Pausa"}
              <span className="max-[379px]:hidden"> · {SONG_TITLE}</span>
            </p>
            <label className="block">
              <span className="sr-only">Posición de la canción</span>
              <input
                type="range"
                min={0}
                max={dur || 1}
                step={0.5}
                value={Math.min(time, dur || 1)}
                onChange={(e) => {
                  const a = audio.current;
                  if (a) a.currentTime = Number(e.target.value);
                }}
                aria-valuetext={`${fmt(time)} de ${fmt(dur)}`}
                className="mt-1 h-6 w-full cursor-pointer accent-[#2ec6ee]"
              />
            </label>
            <p className="text-xs text-bone/80" aria-hidden="true">
              {fmt(time)} / {fmt(dur)}
            </p>
          </div>
          <div className="flex shrink-0 self-start">
            <button
              type="button"
              onClick={() => setMin(true)}
              aria-label="Minimizar el reproductor (la canción sigue sonando)"
              data-cursor="MINIMIZAR"
              className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-bone text-bone"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7l5 5 5-5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
