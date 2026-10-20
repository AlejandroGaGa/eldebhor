"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Deja un hueco del alto aproximado de la sección y solo monta el contenido (y descarga su JS)
 * cuando el visitante se acerca. Mantiene el `id` para que los enlaces #ancla sigan funcionando.
 */
export default function LazySection({ id, className, margen = "900px", children }: { id?: string; className?: string; margen?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || cerca) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setCerca(true);
      },
      { rootMargin: `${margen} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cerca, margen]);

  // al aparecer la sección cambia el alto de la página: se recalculan los disparadores de scroll
  useEffect(() => {
    if (!cerca) return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 350);
    return () => window.clearTimeout(id);
  }, [cerca]);

  return (
    <div ref={ref} id={cerca ? undefined : id} className={cerca ? undefined : className} aria-busy={!cerca}>
      {cerca && children}
    </div>
  );
}
