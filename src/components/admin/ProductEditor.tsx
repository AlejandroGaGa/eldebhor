"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { Producto } from "@/data/merch";
import { api, fotoAJpg, subirVideo, ui } from "./client";

type Props = {
  producto: Producto | null;
  onCancel: () => void;
  onSaved: (productos: Producto[], nombre: string) => void;
  onDeleted: (productos: Producto[], nombre: string) => void;
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "producto";
const newId = (nombre: string) => `${slug(nombre)}-${Math.random().toString(36).slice(2, 6)}`;
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const round = (n: number) => Math.round(n * 100) / 100;

export default function ProductEditor({ producto, onCancel, onSaved, onDeleted }: Props) {
  const uid = useId();
  const f = (n: string) => `${uid}-${n}`;
  const p = producto;

  const [nombre, setNombre] = useState(p?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(p?.descripcion ?? "");
  const [precio, setPrecio] = useState(p?.precio != null ? String(p.precio) : "");
  const [opciones, setOpciones] = useState((p?.opciones ?? []).join(", "));
  const [etiqueta, setEtiqueta] = useState(p?.etiqueta ?? "");
  const [agotado, setAgotado] = useState(p?.agotado === true);
  const [visible, setVisible] = useState(p?.visible !== false);
  const [destacado, setDestacado] = useState(p?.destacado === true);
  const [imagen, setImagen] = useState(p?.imagen ?? "");
  const [alt, setAlt] = useState(p?.alt ?? "");
  const [video, setVideo] = useState(p?.video ?? "");
  const [videoPct, setVideoPct] = useState<number | null>(null);
  const [enOferta, setEnOferta] = useState(!!p?.oferta);
  const [ofPrecio, setOfPrecio] = useState(p?.oferta ? String(p.oferta.precio) : "");
  const [ofPct, setOfPct] = useState(p?.oferta && p.precio ? String(Math.round((1 - p.oferta.precio / p.precio) * 100)) : "");
  const [ofHasta, setOfHasta] = useState(p?.oferta?.hasta ?? "");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const precioN = num(precio);

  const onPrecio = (v: string) => {
    setPrecio(v);
    const pn = num(v);
    const on = num(ofPrecio);
    if (pn > 0 && on > 0) setOfPct(String(Math.round((1 - on / pn) * 100)));
  };
  const onOfPrecio = (v: string) => {
    setOfPrecio(v);
    const on = num(v);
    if (precioN > 0 && on > 0) setOfPct(String(Math.round((1 - on / precioN) * 100)));
  };
  const onOfPct = (v: string) => {
    setOfPct(v);
    const pc = num(v);
    if (precioN > 0 && pc > 0 && pc < 100) setOfPrecio(String(round(precioN * (1 - pc / 100))));
  };

  const subirFoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const blob = await fotoAJpg(file);
      const r = await api<{ url: string }>("/api/estudio/image", { raw: blob });
      setImagen(r.url);
      if (!alt) setAlt(nombre);
    } catch (e) {
      setError((e as Error).message);
    }
    setUploading(false);
  };

  const subirClip = async (file: File | undefined) => {
    if (!file) return;
    setVideoPct(0);
    setError("");
    try {
      setVideo(await subirVideo(file, setVideoPct));
    } catch (e) {
      setError((e as Error).message);
    }
    setVideoPct(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const on = num(ofPrecio);
    if (enOferta && !(precioN > 0)) return setError("Para poner oferta, primero escribe el precio normal.");
    if (enOferta && !(on > 0 && on < precioN)) return setError("El precio de oferta debe ser menor al precio normal.");
    const body: Producto = {
      ...(p ?? {}),
      id: p?.id ?? newId(nombre),
      nombre,
      descripcion,
      precio: Number.isFinite(precioN) ? precioN : undefined,
      moneda: "MXN",
      opciones: opciones.split(",").map((s) => s.trim()).filter(Boolean),
      etiqueta: etiqueta.trim() || undefined,
      agotado,
      visible,
      destacado,
      imagen: imagen || undefined,
      alt: alt || undefined,
      video: video || undefined,
      oferta: enOferta ? { precio: on, ...(ofHasta ? { hasta: ofHasta } : {}) } : undefined,
    };
    setBusy(true);
    try {
      const r = await api<{ productos: Producto[] }>("/api/estudio/products", { json: { action: "save", producto: body } });
      onSaved(r.productos, nombre);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!p) return;
    setBusy(true);
    setError("");
    try {
      const r = await api<{ productos: Producto[] }>("/api/estudio/products", { json: { action: "delete", id: p.id } });
      onDeleted(r.productos, p.nombre);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
      setConfirmDel(false);
    }
  };

  const hayOpciones = opciones.split(",").some((s) => s.trim());

  return (
    <form onSubmit={save} className="space-y-6" aria-labelledby={f("title")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id={f("title")} className="font-block text-xl">
          {p ? "Editar producto" : "Nuevo producto"}
        </h1>
        <button type="button" onClick={onCancel} className={ui.secondary}>
          ← Volver a la lista
        </button>
      </div>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="px-2 font-block text-base">Foto</legend>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-md border-2 border-bone/30 bg-ink">
            {imagen ? (
              <Image src={imagen} alt="Foto actual del producto" fill sizes="144px" unoptimized={imagen.startsWith("/api/img/")} className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center px-2 text-center text-sm text-bone/80">Sin foto</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor={f("foto")} className={ui.label}>
              {imagen ? "Cambiar la foto" : "Subir una foto"}
            </label>
            <input
              id={f("foto")}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                void subirFoto(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="block w-full text-base file:mr-3 file:min-h-[48px] file:cursor-pointer file:rounded-md file:border-2 file:border-black file:bg-brand file:px-4 file:font-bold file:text-ink"
            />
            <p className={ui.hint} role="status">
              {uploading ? "Subiendo…" : "Se reduce sola para que cargue rápido. Funciona con fotos del celular."}
            </p>
            {imagen && (
              <button type="button" onClick={() => setImagen("")} className={`${ui.secondary} mt-2`}>
                Quitar la foto
              </button>
            )}
          </div>
        </div>
        {imagen && (
          <div>
            <label htmlFor={f("alt")} className={ui.label}>
              Descripción de la foto
            </label>
            <input id={f("alt")} value={alt} maxLength={200} onChange={(e) => setAlt(e.target.value)} className={ui.input} />
            <p className={ui.hint}>La leen los lectores de pantalla y se ve si la foto no carga. Ej. «Playera negra con el payaso arcoíris al frente».</p>
          </div>
        )}
      </fieldset>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="px-2 font-block text-base">Video de cómo funciona (opcional)</legend>
        <p className="text-base">
          Un clip corto que muestre el artículo en uso. En la tienda sale el botón «Ver cómo funciona» en la tarjeta de <strong>este</strong> producto; si el mismo clip sirve para otro, súbelo también ahí.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative w-full max-w-[18rem] shrink-0 overflow-hidden rounded-md border-2 border-bone/30 bg-ink">
            {video ? (
              <video src={video} controls playsInline preload="metadata" className="block aspect-video w-full bg-black" aria-label="Video actual del producto">
                Tu navegador no reproduce este video.
              </video>
            ) : (
              <span className="flex aspect-video items-center justify-center px-2 text-center text-sm text-bone/80">Sin video</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor={f("video")} className={ui.label}>
              {video ? "Cambiar el video" : "Subir un video"}
            </label>
            <input
              id={f("video")}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm"
              disabled={videoPct !== null}
              onChange={(e) => {
                void subirClip(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="block w-full text-base file:mr-3 file:min-h-[48px] file:cursor-pointer file:rounded-md file:border-2 file:border-black file:bg-brand file:px-4 file:font-bold file:text-ink"
            />
            {videoPct !== null ? (
              <div className="mt-2" role="status" aria-live="polite">
                <p className="text-base font-bold">Subiendo… {Math.round(videoPct * 100)}%</p>
                <progress value={videoPct} max={1} className="mt-1 h-3 w-full accent-[#2ec6ee]" aria-label="Avance de la subida" />
              </div>
            ) : (
              <p className={ui.hint}>MP4, MOV o WebM de hasta 8 MB (unos 10–20 segundos en 720p). Si pesa más, recórtalo o bájale la calidad desde el celular.</p>
            )}
            {video && videoPct === null && (
              <button type="button" onClick={() => setVideo("")} className={`${ui.secondary} mt-2`}>
                Quitar el video
              </button>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="px-2 font-block text-base">Datos</legend>
        <div>
          <label htmlFor={f("nombre")} className={ui.label}>
            Nombre
          </label>
          <input id={f("nombre")} required maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label htmlFor={f("desc")} className={ui.label}>
            Descripción
          </label>
          <textarea id={f("desc")} rows={3} maxLength={400} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label htmlFor={f("precio")} className={ui.label}>
            Precio normal (MXN)
          </label>
          <input id={f("precio")} type="number" inputMode="decimal" min={0} step="any" value={precio} onChange={(e) => onPrecio(e.target.value)} className={`${ui.input} sm:max-w-xs`} />
          <p className={ui.hint}>Si lo dejas vacío, la tarjeta dice «Consultar».</p>
        </div>
        <div>
          <label htmlFor={f("opc")} className={ui.label}>
            Tallas, colores o modelos (opcional)
          </label>
          <input id={f("opc")} value={opciones} onChange={(e) => setOpciones(e.target.value)} placeholder="S, M, L, XL" className={ui.input} />
          <p className={ui.hint}>Sepáralos con coma. El cliente tiene que elegir uno antes de pedir.</p>
        </div>
        {hayOpciones && (
          <div>
            <label htmlFor={f("etq")} className={ui.label}>
              ¿Qué se está eligiendo?
            </label>
            <input id={f("etq")} list={f("etq-list")} value={etiqueta} maxLength={20} onChange={(e) => setEtiqueta(e.target.value)} placeholder="Talla" className={`${ui.input} sm:max-w-xs`} />
            <datalist id={f("etq-list")}>
              <option value="Talla" />
              <option value="Color" />
              <option value="Modelo" />
            </datalist>
          </div>
        )}
      </fieldset>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="px-2 font-block text-base">Oferta</legend>
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-base font-bold">
          <input type="checkbox" checked={enOferta} onChange={(e) => setEnOferta(e.target.checked)} className="h-6 w-6 accent-[#2ec6ee]" />
          Este producto está en oferta
        </label>
        {enOferta && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={f("ofp")} className={ui.label}>
                  Precio de oferta (MXN)
                </label>
                <input id={f("ofp")} type="number" inputMode="decimal" min={0} step="any" value={ofPrecio} onChange={(e) => onOfPrecio(e.target.value)} className={ui.input} />
              </div>
              <div>
                <label htmlFor={f("ofc")} className={ui.label}>
                  o porcentaje de descuento
                </label>
                <input id={f("ofc")} type="number" inputMode="numeric" min={1} max={99} step={1} value={ofPct} onChange={(e) => onOfPct(e.target.value)} className={ui.input} />
              </div>
            </div>
            <p className={ui.hint}>Escribe uno y el otro se calcula solo, con base en el precio normal.</p>
            <div>
              <label htmlFor={f("ofh")} className={ui.label}>
                Termina el (opcional)
              </label>
              <input id={f("ofh")} type="date" value={ofHasta} onChange={(e) => setOfHasta(e.target.value)} className={`${ui.input} sm:max-w-xs`} />
              <p className={ui.hint}>La oferta se quita sola al acabar ese día. Vacío = hasta que la desactives.</p>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className={`${ui.card} space-y-1`}>
        <legend className="px-2 font-block text-base">Disponibilidad</legend>
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-base font-bold">
          <input type="checkbox" checked={agotado} onChange={(e) => setAgotado(e.target.checked)} className="h-6 w-6 accent-[#2ec6ee]" />
          Agotado (se ve el sello y no se puede pedir)
        </label>
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-base font-bold">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-6 w-6 accent-[#2ec6ee]" />
          Mostrar en el sitio
        </label>
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-base font-bold">
          <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} className="h-6 w-6 accent-[#2ec6ee]" />
          Pieza de portada (se vende arriba de todo, junto a la foto grande)
        </label>
        <p className={ui.hint}>Si varias lo tienen marcado, sale la primera de la lista.</p>
      </fieldset>

      {error && <p className={ui.error} role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || uploading || videoPct !== null} className={ui.primary}>
          {busy ? "Guardando…" : "Guardar producto"}
        </button>
        <button type="button" onClick={onCancel} className={ui.secondary}>
          Cancelar
        </button>
        {p && !confirmDel && (
          <button type="button" onClick={() => setConfirmDel(true)} className={`${ui.secondary} sm:ml-auto`}>
            Eliminar…
          </button>
        )}
        {p && confirmDel && (
          <span className="flex flex-wrap items-center gap-2 sm:ml-auto" role="alert">
            <span className="text-base font-bold">¿Eliminar «{p.nombre}» para siempre?</span>
            <button type="button" onClick={remove} disabled={busy} className={ui.danger}>
              Sí, eliminar
            </button>
            <button type="button" onClick={() => setConfirmDel(false)} className={ui.secondary}>
              No
            </button>
          </span>
        )}
      </div>
    </form>
  );
}
