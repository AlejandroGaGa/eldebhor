"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MERCH, type Producto } from "@/data/merch";
import { igProfile, INSTAGRAM, waLink } from "@/data/site";
import { blip, slap } from "@/lib/audio";
import ProductArt from "./ProductArt";

gsap.registerPlugin(ScrollTrigger);

const money = (n: number, cur: string) => `$${n.toLocaleString("es-MX")} ${cur}`;

export default function Merch() {
  const root = useRef<HTMLElement>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number>(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-merch-title] > span", {
          yPercent: 120,
          rotation: () => gsap.utils.random(-30, 30),
          stagger: 0.07,
          ease: "back.out(2.2)",
          duration: 0.8,
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
        // products swing in from their hooks
        ScrollTrigger.batch("[data-hang]", {
          start: "top 90%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: -80, rotation: () => gsap.utils.random(-28, 28) },
              { autoAlpha: 1, y: 0, rotation: 0, duration: 1.4, ease: "elastic.out(1, 0.35)", stagger: 0.1, transformOrigin: "50% 0%" },
            ),
        });
      });
    },
    { scope: root },
  );

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 6000);
  };

  return (
    <section ref={root} id="merch" className="relative scroll-mt-4 overflow-hidden bg-taxi text-ink" aria-labelledby="merch-title">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(circle, #121110 1.6px, transparent 2px)", backgroundSize: "14px 14px", maskImage: "linear-gradient(180deg, #000, transparent 60%)" }}
      />
      {/* drop strip */}
      <div className="relative -rotate-1 overflow-hidden border-y-4 border-black bg-ink py-2" aria-hidden="true">
        <div className="flex w-max animate-[marquee_18s_linear_infinite] whitespace-nowrap font-block text-xl text-brand motion-reduce:animate-none sm:text-2xl">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="pr-6">
              DROP 001 ✦ HECHO A MANO ✦ PIDE POR WHATSAPP ✦ EDICIÓN LIMITADA ✦
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-10 sm:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-base font-bold uppercase tracking-[0.35em]">✦ Tienda</p>
            <h2 id="merch-title" data-merch-title className="mt-2 flex overflow-hidden pb-3 font-block text-[clamp(3.5rem,15vw,10rem)] uppercase leading-[0.9]" style={{ textShadow: "6px 6px 0 #ff2e88" }}>
              <span className="sr-only">Merch</span>
              {"Merch".split("").map((c, i) => (
                <span key={i} aria-hidden="true" className="inline-block">
                  {c}
                </span>
              ))}
            </h2>
            <p className="mt-2 max-w-xl text-lg leading-relaxed">
              Todo se pide por WhatsApp. Elige tu pieza, toca <strong>Pedir por WhatsApp</strong> y se abre el chat con tu pedido ya escrito.
            </p>
            <p className="mt-3 max-w-xl -rotate-1 font-marker text-xl">Cada compra es una comida que ya no sale de 20 varos.</p>
          </div>
          <a
            href={igProfile}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="IG"
            className="inline-flex min-h-[52px] items-center gap-2 self-start -rotate-2 border-4 border-black bg-ink px-5 py-3 font-block text-base text-bone shadow-[6px_6px_0_#ff2e88] transition-transform hover:rotate-1 hover:scale-105 lg:self-auto"
          >
            <IgIcon /> @{INSTAGRAM}
            <span className="sr-only">(abre Instagram en otra pestaña)</span>
          </a>
        </div>

        {/* rack */}
        <div className="relative mt-14">
          <div className="absolute inset-x-0 top-0 hidden h-4 rounded-full border-4 border-black bg-[linear-gradient(180deg,#f2f2f2,#8d8d8d)] lg:block" aria-hidden="true" />
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {MERCH.map((p) => (
              <li key={p.id} data-hang>
                <ProductCard p={p} onToast={say} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md border-4 border-black bg-ink p-4 text-base text-bone shadow-[6px_6px_0_#2ec6ee] transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      >
        {toast}
      </div>
    </section>
  );
}

function ProductCard({ p, onToast }: { p: Producto; onToast: (m: string) => void }) {
  const [talla, setTalla] = useState<string>("");
  const [error, setError] = useState(false);
  const groupName = `opcion-${p.id}`;
  const etiqueta = p.etiqueta ?? "Talla";

  const pedir = () => {
    if (p.opciones && !talla) {
      setError(true);
      blip(220);
      return;
    }
    const opc = talla ? ` (${etiqueta.toLowerCase()} ${talla})` : "";
    const costo = p.precio != null ? ` — ${money(p.precio, p.moneda ?? "MXN")}` : "";
    const msg = `Hola ELDEBHOR, quiero: ${p.nombre}${opc}${costo}. ¿Está disponible?`;
    window.open(waLink(msg), "_blank", "noopener,noreferrer");
    slap(0.4);
    onToast(`Abriendo WhatsApp con tu pedido: «${msg}»`);
  };

  return (
    <article className="group relative" aria-labelledby={`${p.id}-name`}>
      {/* hook */}
      <svg viewBox="0 0 40 46" className="relative z-10 mx-auto -mb-2 h-12 w-10" aria-hidden="true">
        <path d="M20 44 V22 C20 10 34 10 34 20 C34 28 26 28 26 24" fill="none" stroke="#0b0b0b" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className="relative border-4 border-black bg-white shadow-[8px_8px_0_#121110] transition-transform duration-300 group-hover:-rotate-1">
        <div className="relative aspect-square overflow-hidden border-b-4 border-black" style={{ background: p.forma === "playera" ? "#e9e4d6" : "#f4f1ea" }}>
          {p.imagen ? (
              <Image
                src={p.imagen}
                alt={p.alt ?? p.nombre}
                fill
                sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
              />
            ) : (
              <div className="absolute inset-[8%] origin-top transition-transform duration-500 group-hover:animate-[sway_1.2s_ease-in-out_infinite] motion-reduce:!animate-none">
                <ProductArt p={p} />
              </div>
            )}
          {!p.imagen && <span className="absolute bottom-2 left-2 rounded-sm bg-ink/85 px-1.5 py-0.5 font-mono text-[11px] text-bone">imagen de ejemplo</span>}
          {p.agotado && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-[#e3122b] bg-white/90 px-4 py-1 font-block text-3xl text-[#c10f24]">
              Agotado
            </span>
          )}
        </div>
        {/* price tag */}
        <p className="absolute -right-3 -top-3 rotate-6 border-4 border-black bg-bubble px-3 py-1 font-block text-lg text-ink shadow-[4px_4px_0_#000]">
          <span className="sr-only">Precio: </span>
          {p.precio != null ? money(p.precio, p.moneda ?? "MXN") : "Consultar"}
        </p>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <h3 id={`${p.id}-name`} className="font-marker text-2xl leading-tight">
              {p.nombre}
            </h3>
            <p className="mt-1 text-base text-ink/80">{p.descripcion}</p>
          </div>

          {p.opciones && !p.agotado && (
            <fieldset aria-describedby={error ? `${p.id}-err` : undefined}>
              <legend className="mb-2 text-base font-bold">{etiqueta}</legend>
              <div className="flex flex-wrap gap-2">
                {p.opciones.map((t) => (
                  <label
                    key={t}
                    className={`flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border-[3px] border-black px-3 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${talla === t ? "bg-ink text-bone" : "bg-white text-ink"}`}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={t}
                      checked={talla === t}
                      onChange={() => {
                        setTalla(t);
                        setError(false);
                        blip(600);
                      }}
                      className="sr-only"
                    />
                    {t}
                  </label>
                ))}
              </div>
              {error && (
                <p id={`${p.id}-err`} className="mt-2 font-bold text-[#b00020]" role="alert">
                  ⚠ Elige {etiqueta.toLowerCase()} antes de pedir.
                </p>
              )}
            </fieldset>
          )}

          <button
            type="button"
            onClick={pedir}
            disabled={p.agotado}
            data-cursor={p.agotado ? "NOPE" : "WHATSAPP"}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 border-4 border-black bg-brand px-5 font-block text-base text-ink shadow-[5px_5px_0_#000] transition-transform hover:-rotate-1 hover:scale-[1.02] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-[#d8d4c8] disabled:text-ink/70 disabled:shadow-none"
          >
            {p.agotado ? (
              "Agotado"
            ) : (
              <>
                <WaIcon /> Pedir por WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function IgIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.13 15.07l-.3-.17-3.1.82.83-3.02-.2-.31A8.1 8.1 0 0 1 12.04 3.8Zm-3.2 3.9c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.35 5.2 4.56 2.57 1.01 3.1.8 3.65.75.56-.05 1.8-.74 2.05-1.45.25-.7.25-1.32.18-1.45-.08-.12-.28-.2-.58-.35-.3-.15-1.8-.89-2.07-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.17.2-.35.23-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.8-1.68-2.1-.17-.3-.02-.46.13-.6.14-.13.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.65-.93-2.25-.24-.58-.49-.5-.68-.51h-.58Z" />
    </svg>
  );
}
