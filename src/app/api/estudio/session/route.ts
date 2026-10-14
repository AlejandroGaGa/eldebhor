import { connection } from "next/server";
import { adminConfigured, getSession } from "@/lib/auth";
import { storage } from "@/lib/db";
import { json } from "@/lib/admin-api";

export async function GET() {
  await connection(); // depende de la cookie de cada visita: nunca se congela en la compilación
  const user = await getSession();
  return json({ configured: adminConfigured, storage, user });
}
