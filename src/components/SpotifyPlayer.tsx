"use client";

import { useEffect, useRef, useState } from "react";
import { store, useStore } from "@/lib/store";
import { SONG_SRC, SONG_START, SONG_TITLE } from "@/data/site";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/**
 * Mini reproductor: aparece cuando el «Manifiesto 001» entra en pantalla y arranca
 * la canción (/rolita.mp3) desde el segundo 4 si el visitante entró con sonido.
 * Si el navegador bloquea el audio automático, queda listo con el botón de play.
 */
export default function SpotifyPlayer() {
  const entered = useStore((s) => s.entered);
  const sound = useStore((s) => s.sound);
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const started = useRef(false);

  // arranca una sola vez: posiciona en el segundo inicial y solo da play si hay sonido
  const begin = () => {
    const a = audio.current;
    if (!a || started.current) return;
    started.current = true;
    const go = () => {
      if (SONG_START > 0 && SONG_START < (a.duration || Infinity) - 1) a.currentTime = SONG_START;
      if (store.get().sound) a.play().catch(() => setPlaying(false));
    };
    if (a.readyState >= 1) go();
    else a.addEventListener("loadedmetadata", go, { once: true });
  };

  // appear when «Manifiesto 001» enters the screen (first time only)
  useEffect(() => {
    if (!entered) return;
    const el = document.getElementById("manifiesto");
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setShown(true);
        begin();
      },
      // el manifiesto es alto en celular: basta con que asome en el 60% superior de la pantalla
      { threshold: 0, rootMargin: "0px 0px -40% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [entered]);

  // «Sonido no» in the HUD also silences the song
  useEffect(() => {
    if (!sound) audio.current?.pause();
  }, [sound]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      if (!started.current) started.current = true;
      if (a.ended || (a.currentTime < 1 && SONG_START > 0)) a.currentTime = SONG_START;
      a.play().catch(() => setPlaying(false));
    } else a.pause();
  };

  const visible = shown && !closed;

  return (
    <section
      aria-label="Canción del manifiesto"
      aria-hidden={!visible}
      inert={!visible}
      className={`sp-widget fixed bottom-3 left-3 z-[65] w-[min(340px,calc(100vw-1.5rem))] -rotate-1 border-4 border-black bg-ink p-3 shadow-[6px_6px_0_#2ec6ee] transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"}`}
    >
      <audio
        ref={audio}
        src={entered ? SONG_SRC : undefined}
        preload={entered ? "auto" : "none"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />
      <div className="flex items-center gap-3">
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
        <div className="min-w-0 flex-1">
          <p className="truncate font-block text-sm uppercase tracking-wide text-brand">♪ {playing ? "Suena ahora" : "Pausa"}<span className="max-[379px]:hidden"> · {SONG_TITLE}</span></p>
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
        <button
          type="button"
          onClick={() => {
            audio.current?.pause();
            setClosed(true);
          }}
          aria-label="Cerrar reproductor y pausar la canción"
          className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full border-[3px] border-bone font-block text-sm text-bone"
        >
          ✕
        </button>
      </div>
    </section>
  );
}
