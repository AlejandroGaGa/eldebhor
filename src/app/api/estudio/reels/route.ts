import { revalidateTag } from "next/cache";
import { body, err, guard, json, safe } from "@/lib/admin-api";
import { readReels, writeReels } from "@/lib/shop-data";
import { parseReels } from "@/lib/validate";

export async function GET(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  return safe(async () => json({ reels: await readReels() }));
}

export async function POST(req: Request) {
  const g = await guard(req, { mutating: true });
  if ("res" in g) return g.res;
  return safe(async () => {
    const r = parseReels(await body(req));
    if (!r.ok) return err(r.error);
    await writeReels(r.value);
    revalidateTag("catalogo", { expire: 0 });
    return json({ reels: r.value });
  });
}
