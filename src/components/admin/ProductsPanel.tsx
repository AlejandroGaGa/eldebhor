"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Producto } from "@/data/merch";
import { descuento, fechaLarga, ofertaVigente } from "@/lib/offers";
import { api, money, ui } from "./client";
import ProductEditor from "./ProductEditor";

export default function ProductsPanel() {
  const [list, setList] = useState<Producto[] | null>(null);
  const [editing, setEditing] = useState<Producto | "nuevo" | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ahora] = useState(() => Date.now());

  useEffect(() => {
    api<{ productos: Producto[] }>("/api/admin/products")
      .then((r) => setList(r.productos))
      .catch((e) => setError((e as Error).message));
  }, []);

  const move = async (i: number, dir: -1 | 1) => {
    if (!list) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((p) => p.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setBusy(true);
    setError("");
    try {
      const r = await api<{ productos: Producto[] }>("/api/admin/products", { json: { action: "reorder", ids } });
      setList(r.productos);
      setMsg(`«${list[i].nombre}» se movió ${dir < 0 ? "arriba" : "abajo"}.`);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  if (editing && list) {
    return (
      <ProductEditor
        producto={editing === "nuevo" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(productos, nombre) => {
          setList(productos);
          setEditing(null);
          setMsg(`«${nombre}» se guardó. Ya se ve en el sitio.`);
        }}
        onDeleted={(productos, nombre) => {
          setList(productos);
          setEditing(null);
          setMsg(`«${nombre}» se eliminó.`);
        }}
      />
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="prod-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="prod-title" className="font-block text-xl">
          Productos {list && <span className="text-bone/70">({list.length})</span>}
        </h1>
        <button type="button" onClick={() => { setMsg(""); setEditing("nuevo"); }} className={ui.primary} disabled={!list}>
          + Nuevo producto
        </button>
      </div>

      {error && <p className={ui.error} role="alert">{error}</p>}
      <p className={msg ? ui.ok : "sr-only"} role="status">
        {msg}
      </p>
      {!list && !error && <p role="status">Cargando…</p>}

      <ul className="space-y-3">
        {list?.map((p, i) => {
          const oferta = ofertaVigente(p, ahora);
          return (
            <li key={p.id} className={`${ui.card} flex flex-col gap-3 sm:flex-row sm:items-center`}>
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 border-bone/30 bg-ink">
                {p.imagen ? (
                  <Image src={p.imagen} alt="" fill sizes="80px" unoptimized={p.imagen.startsWith("/api/img/")} className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center text-xs text-bone/70">Sin foto</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-lg font-bold leading-tight">{p.nombre}</h2>
                <p className="mt-1 text-base">
                  {p.precio == null ? (
                    <span className="text-bone/80">Sin precio (muestra «Consultar»)</span>
                  ) : oferta && p.oferta ? (
                    <>
                      <s className="text-bone/70">{money(p.precio)}</s> <strong className="text-taxi">{money(p.oferta.precio)}</strong> MXN
                    </>
                  ) : (
                    <>{money(p.precio)} MXN</>
                  )}
                </p>
                <p className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
                  {oferta && (
                    <span className="rounded bg-[#c10f24] px-2 py-0.5 text-white">
                      Oferta −{descuento(p)}%{p.oferta?.hasta ? ` · hasta ${fechaLarga(p.oferta.hasta)}` : ""}
                    </span>
                  )}
                  {p.oferta && !oferta && <span className="rounded bg-bone/20 px-2 py-0.5">Oferta vencida</span>}
                  {p.agotado && <span className="rounded bg-bone px-2 py-0.5 text-ink">Agotado</span>}
                  {p.visible === false && <span className="rounded bg-bone/20 px-2 py-0.5">Oculto en el sitio</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setMsg(""); setEditing(p); }} className={ui.primary}>
                  Editar<span className="sr-only"> {p.nombre}</span>
                </button>
                <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className={`${ui.secondary} min-w-[48px]`} aria-label={`Subir ${p.nombre}`}>
                  ↑
                </button>
                <button type="button" disabled={busy || i === list.length - 1} onClick={() => move(i, 1)} className={`${ui.secondary} min-w-[48px]`} aria-label={`Bajar ${p.nombre}`}>
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
