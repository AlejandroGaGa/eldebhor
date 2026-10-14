import { endSession } from "@/lib/auth";
import { err, json } from "@/lib/admin-api";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return err("Solicitud rechazada.", 403);
  await endSession();
  return json({ ok: true });
}
