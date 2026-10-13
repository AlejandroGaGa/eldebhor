"use client";

import { useEffect, useState } from "react";
import { fechaLarga, type Promo } from "@/lib/offers";
import { api, ui } from "./client";

export default function PromoPanel() {
  const [promo, setPromo] = useState<Promo | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ promo: Promo }>("/api/admin/promo")
      .then((r) => setPromo(r.promo))
      .catch((e) => setError((e as Error).message));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promo) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const r = await api<{ promo: Promo }>("/api/admin/promo", { json: promo });
      setPromo(r.promo);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  if (!promo) return error ? <p className={ui.error} role="alert">{error}</p> : <p role="status">Cargando…</p>;
  const set = (patch: Partial<Promo>) => {
    setPromo({ ...promo, ...patch });
    setSaved(false);
  };

  return (
    <form onSubmit={save} className={`${ui.card} space-y-4`} aria-labelledby="promo-title">
      <div>
        <h1 id="promo-title" className="font-block text-xl">
          Oferta del sitio
        </h1>
        <p className={ui.hint}>
          Sale como una franja rosa arriba de los productos y en la cinta que se mueve. Para rebajar un producto en específico, edítalo en la pestaña Productos.
        </p>
      </div>

      <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-base font-bold">
        <input type="checkbox" checked={promo.activo} onChange={(e) => set({ activo: e.target.checked })} className="h-6 w-6 accent-[#2ec6ee]" />
        Mostrar la oferta en el sitio
      </label>

      <div>
        <label htmlFor="promo-texto" className={ui.label}>
          Texto de la oferta
        </label>
        <input id="promo-texto" value={promo.texto} maxLength={100} onChange={(e) => set({ texto: e.target.value })} placeholder="Ej. 20% en playeras esta semana" className={ui.input} />
      </div>

      <div>
        <label htmlFor="promo-hasta" className={ui.label}>
          Termina el (opcional)
        </label>
        <input id="promo-hasta" type="date" value={promo.hasta ?? ""} onChange={(e) => set({ hasta: e.target.value || undefined })} className={`${ui.input} sm:max-w-xs`} />
        <p className={ui.hint}>Se quita sola al acabar ese día. Si lo dejas vacío, se queda hasta que la desactives.</p>
      </div>

      {promo.activo && promo.texto && (
        <div className="rotate-1 border-4 border-black bg-bubble px-5 py-4 text-white" aria-label="Vista previa">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.25em]">✦ Oferta</p>
          <p className="mt-1 font-block text-2xl leading-tight">{promo.texto}</p>
          {promo.hasta && <p className="mt-1 text-base font-bold">Hasta el {fechaLarga(promo.hasta)}</p>}
        </div>
      )}

      {error && <p className={ui.error} role="alert">{error}</p>}
      {saved && <p className={ui.ok} role="status">Guardado. Ya se ve en el sitio.</p>}
      <button type="submit" disabled={busy} className={ui.primary}>
        {busy ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
