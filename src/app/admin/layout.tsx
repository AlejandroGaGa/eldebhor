import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — ELDEBHOR",
  description: "Panel para administrar productos y ofertas.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ink text-bone">{children}</div>;
}
