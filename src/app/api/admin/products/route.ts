import { revalidateTag } from "next/cache";
import { kv } from "@/lib/db";
import { body, err, guard, json, safe } from "@/lib/admin-api";
import { imageIds, readProducts, writeProducts } from "@/lib/shop-data";
import { parseProducto } from "@/lib/validate";
import type { Producto } from "@/data/merch";

const refresh = () => revalidateTag("catalogo", { expire: 0 });

/** Borra las fotos subidas que ya no usa ningún producto. */
async function sweep(before: Producto[], after: Producto[]) {
  const keep = imageIds(after);
  for (const id of imageIds(before)) if (!keep.has(id)) await kv.del(`img:${id}`);
}

export async function GET(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  return safe(async () => json({ productos: await readProducts() }));
}

export async function POST(req: Request) {
  const g = await guard(req, { mutating: true });
  if ("res" in g) return g.res;
  return safe(async () => {
    const b = await body<{ action?: string; producto?: unknown; id?: unknown; ids?: unknown }>(req);
    if (!b) return err("Datos inválidos.");
    const list = await readProducts();

    if (b.action === "save") {
      const r = parseProducto(b.producto);
      if (!r.ok) return err(r.error);
      const i = list.findIndex((p) => p.id === r.value.id);
      const next = i >= 0 ? list.map((p, k) => (k === i ? r.value : p)) : [...list, r.value];
      if (next.length > 200) return err("Ya hay demasiados productos.");
      await writeProducts(next);
      await sweep(list, next);
      refresh();
      return json({ productos: next });
    }

    if (b.action === "delete") {
      if (typeof b.id !== "string" || !list.some((p) => p.id === b.id)) return err("Ese producto ya no existe.", 404);
      const next = list.filter((p) => p.id !== b.id);
      await writeProducts(next);
      await sweep(list, next);
      refresh();
      return json({ productos: next });
    }

    if (b.action === "reorder") {
      const ids = Array.isArray(b.ids) ? b.ids : [];
      const same = ids.length === list.length && list.every((p) => ids.includes(p.id)) && new Set(ids).size === ids.length;
      if (!same) return err("El orden no es válido. Recarga la página.");
      const next = (ids as string[]).map((id) => list.find((p) => p.id === id) as Producto);
      await writeProducts(next);
      refresh();
      return json({ productos: next });
    }

    return err("Acción desconocida.");
  });
}
