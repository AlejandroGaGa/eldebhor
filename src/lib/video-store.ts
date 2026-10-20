import "server-only";
import { kv } from "./db";

/**
 * Videos de «cómo funciona» subidos desde /estudio.
 *
 * Upstash (plan gratis) acepta peticiones de máx. 1 MB y Vercel cuerpos de máx. 4.5 MB, así que el
 * navegador parte el video en trozos de ~600 KB y cada uno se guarda aparte:
 *   vid:<id>        → JSON { partes, bytes, tipo }  (se escribe al final; mientras no exista, el video no está)
 *   vid:<id>:<n>    → trozo n en base64
 * El id es el SHA-256 del archivo (16 hex), así que subir dos veces el mismo video no duplica nada.
 */
export const VIDEO_MAX_BYTES = 8 * 1024 * 1024; // 8 MB: para un clip de 10–20 s basta y sobra
export const VIDEO_PART_BYTES = 600 * 1024;
export const VIDEO_MAX_PARTS = Math.ceil(VIDEO_MAX_BYTES / VIDEO_PART_BYTES);
export const VIDEO_TIPOS = ["video/mp4", "video/webm", "video/quicktime"] as const;
export type VideoTipo = (typeof VIDEO_TIPOS)[number];
export type VideoMeta = { partes: number; bytes: number; tipo: VideoTipo };

export const ID_OK = /^[a-f0-9]{16}$/;
const kMeta = (id: string) => `vid:${id}`;
const kPart = (id: string, n: number) => `vid:${id}:${n}`;

export const leerMeta = async (id: string): Promise<VideoMeta | null> => {
  const raw = await kv.get(kMeta(id));
  if (!raw) return null;
  try {
    const m = JSON.parse(raw) as VideoMeta;
    return m && Number.isInteger(m.partes) && m.partes > 0 ? m : null;
  } catch {
    return null;
  }
};
export const guardarParte = (id: string, n: number, buf: Buffer) => kv.set(kPart(id, n), buf.toString("base64"));
export const guardarMeta = (id: string, meta: VideoMeta) => kv.set(kMeta(id), JSON.stringify(meta));

/** Junta todos los trozos. Devuelve null si falta alguno (subida a medias). */
export async function leerVideo(id: string): Promise<{ meta: VideoMeta; data: Buffer } | null> {
  const meta = await leerMeta(id);
  if (!meta) return null;
  const partes: Buffer[] = [];
  for (let n = 0; n < meta.partes; n++) {
    const b64 = await kv.get(kPart(id, n));
    if (!b64) return null;
    partes.push(Buffer.from(b64, "base64"));
  }
  return { meta, data: Buffer.concat(partes) };
}

export async function borrarVideo(id: string) {
  const meta = await leerMeta(id);
  const partes = meta?.partes ?? VIDEO_MAX_PARTS;
  await kv.del(kMeta(id));
  for (let n = 0; n < partes; n++) await kv.del(kPart(id, n));
}

/** Firma del archivo: MP4/MOV («ftyp» en el byte 4) o WebM/Matroska (1A 45 DF A3). */
export function tipoPorFirma(buf: Buffer): VideoTipo | null {
  if (buf.length >= 12 && buf.toString("latin1", 4, 8) === "ftyp") {
    const marca = buf.toString("latin1", 8, 12);
    return marca.startsWith("qt") ? "video/quicktime" : "video/mp4";
  }
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "video/webm";
  return null;
}
