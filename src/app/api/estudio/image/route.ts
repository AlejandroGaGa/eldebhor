import crypto from "node:crypto";
import { kv } from "@/lib/db";
import { err, guard, json, safe } from "@/lib/admin-api";

const MAX = 600_000; // el navegador ya reduce la foto a ~150 KB; esto es solo un tope

export async function POST(req: Request) {
  const g = await guard(req, { mutating: true });
  if ("res" in g) return g.res;
  return safe(async () => {
    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) return err("No llegó ninguna foto.");
    if (buf.length > MAX) return err("La foto es muy pesada. Prueba con otra.", 413);
    if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) return err("La foto debe ser JPG.");
    const id = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
    await kv.set(`img:${id}`, buf.toString("base64"));
    return json({ url: `/api/img/${id}` });
  });
}
