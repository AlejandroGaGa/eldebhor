"use client";

export async function api<T>(url: string, opts: { method?: string; json?: unknown; raw?: Blob; rawType?: string } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.json !== undefined || opts.raw ? "POST" : "GET"),
    headers: opts.json !== undefined ? { "Content-Type": "application/json" } : opts.raw ? { "Content-Type": opts.rawType ?? "image/jpeg" } : undefined,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.raw,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Algo salió mal. Intenta de nuevo."), { status: res.status });
  return data;
}

/** Reduce la foto a máx. 900 px y la convierte a JPG (≈100–200 KB) antes de subirla. */
export async function fotoAJpg(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Elige una imagen (JPG, PNG o WebP).");
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("No se pudo leer esa imagen.");
  });
  let max = 900;
  for (let attempt = 0; attempt < 4; attempt++) {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", [0.82, 0.7, 0.6, 0.5][attempt]));
    if (blob && blob.size <= 450_000) return blob;
    max = Math.round(max * 0.8);
  }
  throw new Error("La foto es muy pesada. Prueba con otra.");
}

const VIDEO_MAX = 8 * 1024 * 1024;
const VIDEO_PART = 600 * 1024;
const VIDEO_TIPOS = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Sube un clip corto por trozos (Upstash y Vercel limitan el tamaño de cada petición) y devuelve la
 * URL /api/vid/<id>. `onProgress` recibe 0–1. Si el mismo archivo ya se subió, termina al primer trozo.
 */
export async function subirVideo(file: File, onProgress: (p: number) => void): Promise<string> {
  const tipo = file.type || (/\.mov$/i.test(file.name) ? "video/quicktime" : /\.webm$/i.test(file.name) ? "video/webm" : "video/mp4");
  if (!VIDEO_TIPOS.includes(tipo)) throw new Error("Elige un video MP4, MOV o WebM.");
  if (file.size > VIDEO_MAX) throw new Error(`El video pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 8 MB. Recórtalo o bájale la calidad (con el celular: «Guardar como 720p»).`);
  if (!file.size) throw new Error("El archivo está vacío.");
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const id = [...new Uint8Array(hash)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  const partes = Math.ceil(file.size / VIDEO_PART);
  for (let n = 0; n < partes; n++) {
    const trozo = file.slice(n * VIDEO_PART, (n + 1) * VIDEO_PART);
    const q = new URLSearchParams({ id, parte: String(n), partes: String(partes), bytes: String(file.size), tipo });
    const r = await api<{ url?: string; listo: boolean }>(`/api/estudio/video?${q}`, { raw: trozo, rawType: "application/octet-stream" });
    onProgress((n + 1) / partes);
    if (r.listo && r.url) return r.url;
  }
  throw new Error("La subida no terminó. Intenta de nuevo.");
}

export const money = (n: number) => `$${n.toLocaleString("es-MX")}`;

/** Estilos compartidos del panel (letra grande, contraste alto, botones de 48 px). */
export const ui = {
  input: "min-h-[48px] w-full rounded-md border-2 border-bone/50 bg-concrete px-3 py-2 text-base text-bone placeholder:text-bone/60 focus:border-brand",
  label: "mb-1 block text-base font-bold",
  hint: "mt-1 text-sm text-bone/80",
  primary: "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border-2 border-black bg-brand px-5 font-block text-base text-ink disabled:opacity-60",
  secondary: "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border-2 border-bone/60 bg-transparent px-4 text-base font-bold text-bone hover:bg-bone/10 disabled:opacity-60",
  danger: "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border-2 border-black bg-[#c10f24] px-5 text-base font-bold text-white disabled:opacity-60",
  card: "rounded-lg border-2 border-bone/30 bg-concrete p-4 sm:p-5",
  error: "rounded-md border-2 border-[#ff8095] bg-[#3a0f16] px-3 py-2 text-base font-bold text-[#ffd1d8]",
  ok: "rounded-md border-2 border-acid bg-[#1d2a00] px-3 py-2 text-base font-bold text-acid",
};
