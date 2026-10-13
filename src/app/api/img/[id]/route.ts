import { kv } from "@/lib/db";

/** Fotos de producto subidas desde el panel. El id es el hash del contenido, así que nunca cambia. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response("No encontrada", { status: 404 });
  let b64: string | null = null;
  try {
    b64 = await kv.get(`img:${id}`);
  } catch {
    return new Response("No disponible", { status: 503 });
  }
  if (!b64) return new Response("No encontrada", { status: 404 });
  return new Response(Buffer.from(b64, "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
