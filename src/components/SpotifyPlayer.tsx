"use client";

import { useEffect, useRef, useState } from "react";
import { store, useStore } from "@/lib/store";
import { PLAYER_COOKIE, readPref, savePref } from "@/lib/prefs";
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
  const [closed, setClosed] = useState(false);
  const [minimized, setMinimized] = useState(false);
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
      setMinimized(readPref(PLAYER_COOKIE) === "min");
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

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      userPaused.current = false;
      if (!started.current) started.current = true;
      if (a.ended || (a.currentTime < 1 && SONG_START > 0)) a.currentTime = SONG_START;
      a.play().catch(() => setPlaying(false));
    } else {
      userPaused.current = true;
      a.pause();
    }
  };

  const setMin = (value: boolean) => {
    setMinimized(value);
    savePref(PLAYER_COOKIE, value ? "min" : "max");
  };

  const visible = shown && !closed;

  const playBtn = (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Pausar canción" : "Reproducir canción"}
      data-cursor={playing ? "PAUSA" : "PLAY"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-brand text-ink"
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
      aria-label="Canción de la tienda"
      aria-hidden={!visible}
      inert={!visible}
      className={`sp-widget fixed bottom-3 left-3 z-[65] border-4 border-black bg-ink transition-all duration-500 ${
        minimized
          ? "rounded-full p-1.5 shadow-[4px_4px_0_#2ec6ee]"
          : "w-[min(340px,calc(100vw-1.5rem))] -rotate-1 p-3 shadow-[6px_6px_0_#2ec6ee]"
      } ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"}`}
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
          <span aria-hidden="true" className={`px-1 font-block text-xl text-brand ${playing ? "animate-pulse motion-reduce:animate-none" : "opacity-60"}`}>
            ♪
          </span>
          <button
            type="button"
            onClick={() => setMin(false)}
            aria-label="Mostrar el reproductor"
            data-cursor="ABRIR"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-bone text-bone"
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
          <div className="flex shrink-0 flex-col gap-1 self-start">
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
            <button
              type="button"
              onClick={() => {
                userPaused.current = true;
                audio.current?.pause();
                setClosed(true);
              }}
              aria-label="Cerrar reproductor y pausar la canción"
              className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-bone font-block text-sm text-bone"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
