import { revalidateTag } from "next/cache";
import { body, err, guard, json, safe } from "@/lib/admin-api";
import { readPromo, writePromo } from "@/lib/shop-data";
import { parsePromo } from "@/lib/validate";

export async function GET(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  return safe(async () => json({ promo: await readPromo() }));
}

export async function POST(req: Request) {
  const g = await guard(req, { mutating: true });
  if ("res" in g) return g.res;
  return safe(async () => {
    const r = parsePromo(await body(req));
    if (!r.ok) return err(r.error);
    await writePromo(r.value);
    revalidateTag("catalogo", { expire: 0 });
    return json({ promo: r.value });
  });
}
