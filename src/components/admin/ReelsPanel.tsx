"use client";

import { useEffect, useState } from "react";
import { api, ui } from "./client";

const MAX = 12;
const REEL = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(reels?|p)\/([\w-]{5,40})\/?(?:[?#].*)?$/i;
const normalizar = (raw: string) => {
  const m = raw.trim().match(REEL);
  return m ? `https://www.instagram.com/${m[1].toLowerCase() === "p" ? "p" : "reel"}/${m[2]}/` : null;
};

/** Reels de Instagram del carrusel: pegar el enlace, ordenar con ↑ ↓, quitar, guardar. */
export default function ReelsPanel() {
  const [reels, setReels] = useState<string[] | null>(null);
  const [nuevo, setNuevo] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api<{ reels: string[] }>("/api/estudio/reels")
      .then((r) => setReels(r.reels))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (!reels) return error ? <p className={ui.error} role="alert">{error}</p> : <p role="status">Cargando…</p>;

  const set = (next: string[]) => {
    setReels(next);
    setDirty(true);
    setSaved(false);
    setError("");
  };
  const agregar = () => {
    const n = normalizar(nuevo);
    if (!n) return setError("Ese enlace no parece un reel. Copia el enlace desde Instagram (Compartir → Copiar enlace): se ve como instagram.com/reel/…");
    if (reels.includes(n)) return setError("Ese reel ya está en la lista.");
    if (reels.length >= MAX) return setError(`Máximo ${MAX} reels. Quita alguno para agregar otro.`);
    set([...reels, n]);
    setNuevo("");
  };
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= reels.length) return;
    const next = [...reels];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  const guardar = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ reels: string[] }>("/api/estudio/reels", { json: { reels } });
      setReels(r.reels);
      setDirty(false);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <section className="space-y-4" aria-labelledby="reels-title">
      <div className={`${ui.card} space-y-4`}>
        <div>
          <h1 id="reels-title" className="font-block text-xl">
            Reels de Instagram {reels.length > 0 && <span className="text-bone/70">({reels.length})</span>}
          </h1>
          <p className={ui.hint}>
            Salen en el carrusel «Reels del debhor», debajo de la tienda, en este orden. Solo funcionan reels de una cuenta pública. Máximo {MAX}.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            agregar();
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="reel-url" className={ui.label}>
              Enlace del reel
            </label>
            <input id="reel-url" value={nuevo} onChange={(e) => setNuevo(e.target.value)} inputMode="url" placeholder="https://www.instagram.com/reel/XXXXXXXX/" className={ui.input} />
            <p className={ui.hint}>En Instagram: abre el reel → Compartir → Copiar enlace, y pégalo aquí.</p>
          </div>
          <button type="submit" className={`${ui.primary} sm:mt-7 sm:self-start`}>
            + Agregar
          </button>
        </form>
      </div>

      {reels.length === 0 ? (
        <p className="text-base text-bone/80">Todavía no hay reels. Agrega el primero arriba.</p>
      ) : (
        <ol className="space-y-3">
          {reels.map((u, i) => (
            <li key={u} className={`${ui.card} flex flex-col gap-3 sm:flex-row sm:items-center`}>
              <span className="font-block text-xl text-bone/70">{i + 1}</span>
              <a href={u} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 break-all text-base font-bold underline decoration-brand decoration-2 underline-offset-4">
                {u.replace("https://www.instagram.com/", "")}
                <span className="sr-only"> (abre Instagram en otra pestaña)</span>
              </a>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} className={`${ui.secondary} min-w-[48px]`} aria-label={`Subir el reel ${i + 1}`}>
                  ↑
                </button>
                <button type="button" disabled={i === reels.length - 1} onClick={() => mover(i, 1)} className={`${ui.secondary} min-w-[48px]`} aria-label={`Bajar el reel ${i + 1}`}>
                  ↓
                </button>
                <button type="button" onClick={() => set(reels.filter((_, k) => k !== i))} className={ui.secondary} aria-label={`Quitar el reel ${i + 1}`}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && <p className={ui.error} role="alert">{error}</p>}
      {saved && <p className={ui.ok} role="status">Guardado. Ya se ve en el sitio.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={busy || !dirty} className={ui.primary}>
          {busy ? "Guardando…" : "Guardar carrusel"}
        </button>
        {dirty && !busy && <span className="text-base font-bold text-taxi">Hay cambios sin guardar.</span>}
      </div>
    </section>
  );
}
