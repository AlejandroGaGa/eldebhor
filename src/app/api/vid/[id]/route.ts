import { ID_OK, leerVideo } from "@/lib/video-store";

/**
 * Videos de «cómo funciona» subidos desde el panel. El id es el hash del archivo, así que nunca cambia
 * y se puede cachear para siempre. Responde a Range (206) porque Safari/iOS no reproduce sin eso.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!ID_OK.test(id)) return new Response("No encontrado", { status: 404 });
  let v: Awaited<ReturnType<typeof leerVideo>>;
  try {
    v = await leerVideo(id);
  } catch {
    return new Response("No disponible", { status: 503 });
  }
  if (!v) return new Response("No encontrado", { status: 404 });

  const total = v.data.length;
  const base = {
    "Content-Type": v.meta.tipo,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    let start = range[1] ? Number(range[1]) : NaN;
    let end = range[2] ? Number(range[2]) : total - 1;
    if (Number.isNaN(start)) {
      // «bytes=-N»: los últimos N bytes
      start = Math.max(0, total - Number(range[2]));
      end = total - 1;
    }
    end = Math.min(end, total - 1);
    if (start > end || start >= total) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
    }
    return new Response(new Uint8Array(v.data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(v.data), { headers: { ...base, "Content-Length": String(total) } });
}
