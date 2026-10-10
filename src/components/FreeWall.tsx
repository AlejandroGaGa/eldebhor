"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PALETTE } from "@/lib/palette";
import { store, useStore } from "@/lib/store";
import { usePaintSurface } from "@/lib/usePaintSurface";
import { animatePath, crownPath, handstyle } from "@/lib/spray";
import { blip, roll, sprayOff, sprayOn } from "@/lib/audio";
import { useFinePointer } from "@/lib/scroll";

const CAPS = [
  { id: "skinny", label: "Skinny", r: 9 },
  { id: "medio", label: "Medio", r: 20 },
  { id: "fat", label: "Fat cap", r: 38 },
] as const;

export default function FreeWall() {
  const color = useStore((s) => s.color);
  const fine = useFinePointer();
  const [cap, setCap] = useState<(typeof CAPS)[number]["id"]>("medio");
  const [drips, setDrips] = useState(true);
  const [busy, setBusy] = useState<"" | "ghost" | "buff" | "placa">("");
  const [status, setStatus] = useState("");
  const [placa, setPlaca] = useState("");
  const [fingerPaint, setFingerPaint] = useState(true);
  const fingerRef = useRef(true);
  useEffect(() => {
    fingerRef.current = fingerPaint;
  }, [fingerPaint]);
  const capRef = useRef(cap);
  useEffect(() => {
    capRef.current = cap;
  }, [cap]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const roller = useRef<HTMLDivElement>(null);
  const painter = usePaintSurface(canvas, {
    touch: true,
    enabled: () => window.matchMedia("(pointer: fine)").matches || fingerRef.current,
    radius: () => {
      const r = CAPS.find((c) => c.id === capRef.current)!.r;
      return window.innerWidth < 640 ? r * 0.75 : r;
    },
  });

  const toggleDrips = () => {
    const next = !drips;
    setDrips(next);
    // eslint-disable-next-line react-hooks/immutability -- the painter lives in a ref
    if (painter.current) painter.current.dripsEnabled = next;
    blip(next ? 700 : 400);
  };

  const ghost = async () => {
    const p = painter.current;
    if (!p || busy) return;
    setBusy("ghost");
    setStatus("El fantasma está pintando…");
    const size = Math.min(p.w / 7.5, p.h / 3.2);
    const x = p.w * 0.08 + Math.random() * Math.max(0, p.w - size * 6.3 - p.w * 0.16);
    const y = p.h * 0.15 + Math.random() * Math.max(0, p.h - size * 1.8 - p.h * 0.3);
    const c = store.get().color;
    const o = { color: c, radius: Math.max(6, size * 0.1) };
    sprayOn(0.7);
    await animatePath(p, crownPath(x - size * 0.1, y - size * 0.15, size * 0.55), { ...o, color: "#ffe600" }, 500);
    for (const s of handstyle("ELDEBHOR", x, y, size)) {
      let len = 0;
      for (let i = 1; i < s.length; i++) len += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
      await animatePath(p, s, o, Math.max(90, len / 1.5));
    }
    sprayOff();
    setBusy("");
    setStatus("Listo: el fantasma firmó la pared.");
  };

  const tirarPlaca = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = painter.current;
    const word = placa.trim().toUpperCase();
    if (!p || busy) return;
    if (!word) {
      setStatus("Escribe tu placa primero.");
      blip(300);
      return;
    }
    setBusy("placa");
    setStatus(`Tirando el tag ${word}…`);
    const n = word.length;
    const size = Math.min(p.w / (n * 0.72 + 1.2), p.h / 3.2);
    const width = n * size * 0.66;
    const x = Math.max(p.w * 0.04, Math.random() * Math.max(0, p.w - width - p.w * 0.08) + p.w * 0.02);
    const y = p.h * 0.18 + Math.random() * Math.max(0, p.h - size * 1.9 - p.h * 0.34);
    const c = store.get().color;
    const o = { color: c, radius: Math.max(5, size * 0.1) };
    sprayOn(0.7);
    await animatePath(p, crownPath(x - size * 0.1, y - size * 0.15, size * 0.5), { ...o, color: "#ffe600" }, 450);
    for (const st of handstyle(word, x, y, size)) {
      let len = 0;
      for (let i = 1; i < st.length; i++) len += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]);
      await animatePath(p, st, o, Math.max(80, len / 1.5));
    }
    sprayOff();
    setBusy("");
    setStatus(`Listo: tu placa ${word} quedó en la pared.`);
  };

  const buff = () => {
    const p = painter.current;
    if (!p || busy) return;
    setBusy("buff");
    setStatus("Buffeando la pared…");
    roll(1.3);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      p.clear();
      setBusy("");
      setStatus("Pared limpia.");
      return;
    }
    const o = { v: 0 };
    let last = 0;
    gsap.set(roller.current, { autoAlpha: 1, y: -60 });
    gsap.to(o, {
      v: 1,
      duration: 1.3,
      ease: "power1.inOut",
      onUpdate: () => {
        const y = o.v * (p.h + 20);
        p.ctx.clearRect(0, last - 2, p.w, y - last + 4);
        last = y;
        gsap.set(roller.current, { y: y - 30 });
      },
      onComplete: () => {
        p.clear();
        gsap.to(roller.current, { autoAlpha: 0, duration: 0.2 });
        setBusy("");
        setStatus("Pared limpia.");
      },
    });
  };

  const save = () => {
    const p = painter.current;
    if (!p) return;
    const out = document.createElement("canvas");
    out.width = p.canvas.width;
    out.height = p.canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#8d8a84";
    ctx.fillRect(0, 0, out.width, out.height);
    for (let i = 0; i < out.width * out.height * 0.02; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.07)";
      ctx.fillRect(Math.random() * out.width, Math.random() * out.height, 2, 2);
    }
    ctx.drawImage(p.canvas, 0, 0);
    const css = getComputedStyle(document.documentElement);
    ctx.font = `${28 * p.dpr}px ${css.getPropertyValue("--ff-marker")}`;
    ctx.fillStyle = "#121110";
    ctx.textAlign = "right";
    ctx.fillText("eldebhor · muro libre", out.width - 20 * p.dpr, out.height - 20 * p.dpr);
    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "eldebhor-muro.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus("Tu pieza se descargó como eldebhor-muro.png");
      blip(1200);
    });
  };

  return (
    <section id="muro-libre" className="concrete relative scroll-mt-4 px-4 py-24 sm:px-10 sm:py-32" aria-labelledby="wall-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="wall-title" className="font-wet text-[clamp(3.5rem,13vw,10rem)] leading-[0.85] text-brand" style={{ textShadow: "6px 6px 0 #ff2e88" }}>
              Tu turno
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-bone">
              Muro libre. {fine ? "Mantén el clic y pinta" : "Pinta con el dedo"}; si te quedas quieto la pintura chorrea, como en la calle.
              Nadie te va a buffear… salvo tú.
            </p>
          </div>
          <p className="font-marker text-xl text-taxi lg:max-w-xs lg:text-right">
            ¿Sin pulso? Deja que el fantasma firme por ti.
          </p>
        </div>

        {/* toolbar */}
        <div className="mt-10 flex flex-col gap-5 rounded-lg border-4 border-black bg-ink p-4 shadow-[8px_8px_0_#000] sm:p-5 lg:flex-row lg:flex-wrap lg:items-center">
          <form onSubmit={tirarPlaca} className="flex w-full flex-wrap items-end gap-2 border-b-2 border-dashed border-bone/30 pb-5">
            <div className="min-w-0 flex-1 basis-56">
              <label htmlFor="placa" className="mb-2 block text-base font-bold uppercase tracking-widest text-bone">
                Tu placa
              </label>
              <input
                id="placa"
                name="placa"
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8))}
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="EJ. DHEBOR"
                data-cursor="ESCRIBE"
                className="font-block min-h-[44px] w-full rounded-md border-[3px] border-bone bg-black px-4 text-lg uppercase tracking-widest text-bone placeholder:text-bone/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-taxi"
              />
            </div>
            <button
              type="submit"
              disabled={!!busy}
              data-cursor="TIRA"
              className="min-h-[44px] rounded-full border-[3px] border-taxi bg-taxi px-5 text-base font-bold text-ink disabled:opacity-50"
            >
              Tirar mi tag
            </button>
            <p className="w-full text-sm text-bone/70">Hasta 8 letras o números. Se pinta con el color que traes elegido.</p>
          </form>
          <fieldset className="min-w-0">
            <legend className="mb-2 text-base font-bold uppercase tracking-widest text-bone">Color</legend>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <label
                  key={p.hex}
                  className={`relative h-11 w-11 cursor-pointer rounded-full border-[3px] border-bone has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-taxi ${p.hex === color ? "ring-4 ring-taxi" : ""}`}
                  style={{ background: p.hex }}
                  data-cursor={p.name.toUpperCase()}
                >
                  <input
                    type="radio"
                    name="wall-color"
                    className="sr-only"
                    checked={p.hex === color}
                    onChange={() => {
                      store.set({ color: p.hex, colorName: p.name });
                      blip(600);
                    }}
                  />
                  <span className="sr-only">{p.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-2 text-base font-bold uppercase tracking-widest text-bone">Boquilla</legend>
            <div className="flex flex-wrap gap-2">
              {CAPS.map((c) => (
                <label
                  key={c.id}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[3px] px-4 text-base has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-taxi ${cap === c.id ? "border-taxi bg-taxi font-bold text-ink" : "border-bone text-bone"}`}
                >
                  <input type="radio" name="cap" className="sr-only" checked={cap === c.id} onChange={() => setCap(c.id)} />
                  <span className="rounded-full bg-current" style={{ width: c.r / 2.5 + 4, height: c.r / 2.5 + 4 }} aria-hidden="true" />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <button
              type="button"
              role="switch"
              aria-checked={drips}
              onClick={toggleDrips}
              className={`min-h-[44px] rounded-full border-[3px] px-4 text-base ${drips ? "border-sky bg-sky font-bold text-ink" : "border-bone text-bone"}`}
            >
              Chorreo: {drips ? "sí" : "no"}
            </button>
            {!fine && (
              <button
                type="button"
                role="switch"
                aria-checked={fingerPaint}
                onClick={() => {
                  setFingerPaint(!fingerPaint);
                  setStatus(fingerPaint ? "Dedo para desplazar la página." : "Dedo para pintar en el muro.");
                  blip(fingerPaint ? 400 : 700);
                }}
                className={`min-h-[44px] rounded-full border-[3px] px-4 text-base ${fingerPaint ? "border-taxi bg-taxi font-bold text-ink" : "border-bone text-bone"}`}
              >
                Dedo: {fingerPaint ? "pinta" : "desplaza"}
              </button>
            )}
            <button
              type="button"
              onClick={ghost}
              disabled={!!busy}
              data-cursor="BOO"
              className="min-h-[44px] rounded-full border-[3px] border-grape bg-grape px-4 text-base font-bold text-white disabled:opacity-50"
            >
              Que pinte el fantasma
            </button>
            <button
              type="button"
              onClick={buff}
              disabled={!!busy}
              data-cursor="BUFF"
              className="min-h-[44px] rounded-full border-[3px] border-bone bg-[#6f6c66] px-4 text-base font-bold text-white disabled:opacity-50"
            >
              Buff (borrar)
            </button>
            <button
              type="button"
              onClick={save}
              data-cursor="PNG"
              className="min-h-[44px] rounded-full border-[3px] border-brand bg-brand px-4 text-base font-bold text-ink"
            >
              Guardar PNG
            </button>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>

        {/* the wall */}
        <div className="relative mt-6 h-[65dvh] min-h-[420px] max-h-[760px] overflow-hidden rounded-md border-4 border-black shadow-[10px_10px_0_#000]">
          <div className="concrete-light absolute inset-0" aria-hidden="true" />
          <canvas
            ref={canvas}
            className={`absolute inset-0 h-full w-full ${!fine && !fingerPaint ? "touch-pan-y" : "touch-none"}`}
            data-cursor="PINTA"
            role="img"
            aria-label="Muro libre para pintar con el mouse o el dedo"
          />
          <div ref={roller} className="pointer-events-none invisible absolute inset-x-0 top-0 opacity-0" aria-hidden="true">
            <div className="h-[60px] w-full rounded-full border-4 border-black bg-[repeating-linear-gradient(90deg,#9b9892_0_6px,#86837d_6px_12px)] shadow-[0_10px_0_rgba(0,0,0,.25)]" />
          </div>
          <span className="pointer-events-none absolute bottom-3 left-4 font-marker text-base text-ink/70" aria-hidden="true">
            muro libre · zona legal (por hoy)
          </span>
        </div>
        {!fine && (
          <p className="mt-4 text-base text-bone/85">Tip: para seguir bajando, apaga &quot;Dedo: pinta&quot; o desliza fuera del muro.</p>
        )}
      </div>
    </section>
  );
}
