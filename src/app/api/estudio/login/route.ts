import { adminConfigured, clearFails, clientIp, lockedFor, registerFail, startSession, verifyLogin } from "@/lib/auth";
import { body, err, json, safe } from "@/lib/admin-api";

export async function POST(req: Request) {
  return safe(async () => {
    if (!adminConfigured) return err("El panel no está configurado en el servidor.", 503);
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) return err("Solicitud rechazada.", 403);

    const ip = await clientIp();
    const wait = lockedFor(ip);
    if (wait) return err(`Demasiados intentos. Espera ${wait} min e inténtalo otra vez.`, 429);

    const b = await body<{ email?: string; password?: string }>(req);
    if (!b || typeof b.email !== "string" || typeof b.password !== "string" || b.password.length > 200) return err("Escribe tu correo y contraseña.");
    const session = await verifyLogin(b.email, b.password);
    if (!session) {
      registerFail(ip);
      await new Promise((r) => setTimeout(r, 500));
      return err("Correo o contraseña incorrectos.", 401);
    }
    clearFails(ip);
    await startSession(session);
    return json({ user: session });
  });
}
