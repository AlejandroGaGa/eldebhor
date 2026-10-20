import { err, guard, json, safe } from "@/lib/admin-api";
import { guardarMeta, guardarParte, ID_OK, leerMeta, tipoPorFirma, VIDEO_MAX_BYTES, VIDEO_MAX_PARTS, VIDEO_PART_BYTES, type VideoTipo } from "@/lib/video-store";

/**
 * Subida por trozos: POST /api/estudio/video?id=<sha256 corto>&parte=<n>&partes=<total>&bytes=<tamaño>&tipo=<mime>
 * con el trozo crudo en el cuerpo. El primer trozo se revisa por su firma (MP4/MOV/WebM). Al llegar el
 * último se escribe la ficha y el video queda disponible en /api/vid/<id>.
 */
export async function POST(req: Request) {
  const g = await guard(req, { mutating: true });
  if ("res" in g) return g.res;
  return safe(async () => {
    const q = new URL(req.url).searchParams;
    const id = q.get("id") ?? "";
    const parte = Number(q.get("parte"));
    const partes = Number(q.get("partes"));
    const bytes = Number(q.get("bytes"));
    const tipoDicho = q.get("tipo") ?? "";
    if (!ID_OK.test(id)) return err("Identificador del video inválido.");
    if (!Number.isInteger(partes) || partes < 1 || partes > VIDEO_MAX_PARTS) return err("El video es muy pesado. Máximo 8 MB: recórtalo o bájale la calidad.", 413);
    if (!Number.isInteger(parte) || parte < 0 || parte >= partes) return err("Trozo fuera de rango.");
    if (!Number.isInteger(bytes) || bytes < 1 || bytes > VIDEO_MAX_BYTES) return err("El video es muy pesado. Máximo 8 MB: recórtalo o bájale la calidad.", 413);
    if (Math.ceil(bytes / VIDEO_PART_BYTES) !== partes) return err("La subida no cuadra. Intenta de nuevo.");

    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) return err("No llegó ningún video.");
    if (buf.length > VIDEO_PART_BYTES) return err("Trozo demasiado grande.", 413);

    let tipo: VideoTipo | null = null;
    if (parte === 0) {
      tipo = tipoPorFirma(buf);
      if (!tipo) return err("El archivo no es un video MP4, MOV o WebM.");
    }
    if (await leerMeta(id)) return json({ url: `/api/vid/${id}`, listo: true }); // ya estaba subido

    await guardarParte(id, parte, buf);
    if (parte === partes - 1) {
      // el tipo real viene de la firma del primer trozo; si llegó en otra petición, confiamos en el que dice el navegador
      const t: VideoTipo = tipo ?? (tipoDicho === "video/webm" ? "video/webm" : tipoDicho === "video/quicktime" ? "video/quicktime" : "video/mp4");
      await guardarMeta(id, { partes, bytes, tipo: t });
      return json({ url: `/api/vid/${id}`, listo: true });
    }
    return json({ listo: false, parte });
  });
}
