# ELDEBHOR — arte urbano sin permiso

Experiencia web interactiva inspirada en el graffiti. No es una landing: es una pared.

## Qué hay adentro

| Sección | Qué pasa |
| --- | --- |
| **Loader** | "Agitando la lata" con contador, onomatopeyas y entrada con o sin sonido. |
| **Hero** | Pieza `ELDEBHOR` en wildstyle con extrusión 3D, contorno doble, *line boil* (filtro SVG que hace temblar el trazo), letras que se inclinan hacia el cursor. Un "escritor fantasma" pinta la nube de fondo. Mantén el clic para pintar con aerosol real (overspray + goteo). Clic en una letra = la revientas y se repinta con tu color. |
| **Cintas de precaución** | Velocidad y dirección siguen tu scroll. |
| **Manifiesto** | Las palabras se "rocían" mientras bajas. |
| **Tren** | Scroll horizontal anclado: un vagón de metro pintado de punta a punta; las piezas se pintan al entrar, las ruedas giran con el scroll. |
| **Elige tu lata** | Lata 3D (React Three Fiber) con etiqueta generada en canvas, tapa flotando, niebla de partículas al rociar. El color elegido se vuelve el color global. |
| **Sticker bomb** | Física real (Matter.js): arrastra, avienta y apila stickers. |
| **Muro libre** | Pinta con 3 boquillas, goteo on/off, "que pinte el fantasma" (firma automática), *buff* con rodillo y descarga en PNG. |
| **Extras** | Todo el sonido se sintetiza en vivo con Web Audio (sin archivos). Cursor-boquilla con rastro de pintura. Código Konami = modo caos. |

## Poner tus fotos (Obras y Merch)

Las secciones **Obras** y **Merch** muestran piezas "de ejemplo" dibujadas en código hasta que pongas fotos reales:

1. Copia las fotos a `public/obras/` y `public/merch/` (jpg, png o webp).
2. En `src/data/obras.ts` agrega a cada obra `imagen: "/obras/archivo.jpg"` y un `alt` que describa la foto. Cambia título, año, lugar y técnica.
3. En `src/data/merch.ts` haz lo mismo con `imagen: "/merch/archivo.jpg"` (fotos cuadradas se ven mejor), y ajusta nombres, `precio` (sin precio la tarjeta dice «Consultar»), `opciones` (tallas, colores o modelos; `etiqueta` cambia el nombre de la opción) y `agotado`.
4. En `src/data/site.ts` cambia `INSTAGRAM` por el usuario real: el botón **Pedir por DM** copia el mensaje del pedido y abre el chat de esa cuenta.

Con `imagen` puesta desaparece la etiqueta "imagen de ejemplo".

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- Tailwind CSS v4
- GSAP 3 + ScrollTrigger + `@gsap/react`
- Lenis (smooth scroll)
- three.js + @react-three/fiber + @react-three/drei
- Matter.js
- Fuentes OFL auto-hospedadas en `src/fonts` (Sedgwick Ave Display, Bungee, Permanent Marker, Rubik Wet Paint, Rubik Spray Paint, Space Mono): el build no depende de Google Fonts.

## Correr local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Desplegar en Vercel

1. Sube la carpeta a un repo de GitHub.
2. En Vercel: **Add New → Project → Import** el repo. Detecta Next.js solo; no hay variables de entorno.
3. Deploy.

O con la CLI: `npx vercel` (preview) y `npx vercel --prod`.

## Accesibilidad

- Respeta `prefers-reduced-motion`: sin smooth scroll, sin *line boil*, sin pin del tren (se vuelve scroll horizontal nativo), textos ya pintados.
- Todo control es un `<button>`/`<input>` nativo con foco visible; selector de colores con radios reales.
- Enlace "Saltar al muro libre"; el cursor personalizado solo aparece con mouse.
- En celular el hero no captura el dedo (para no bloquear el scroll); se pinta en el muro libre.

## Tienda con Shopify

El merch se lee de Shopify (Storefront API) y el pago lo hace el checkout de Shopify. La página sigue siendo
esta misma (Next.js); Shopify solo pone catálogo, inventario, carrito, checkout y pedidos.

1. En el admin de Shopify instala el canal **Headless**, crea un storefront y copia sus tokens.
2. Copia `.env.example` a `.env.local` y llénalo (`SHOPIFY_STORE_DOMAIN`, token público y token privado).
   Los tokens nunca llegan al navegador: el carrito pasa por `/api/cart` en el servidor.
3. En cada producto de Shopify, en **Canales de venta**, activa el canal **Headless** (si no, la API no lo devuelve).
4. `npm run dev`. En producción, pon las mismas variables en el hosting.

- Los productos se guardan unos minutos en caché (`src/lib/catalog.ts`); un cambio de precio o de inventario
  tarda hasta ~1–2 minutos en verse.
- Si Shopify no está configurado, falla o no tiene productos publicados, el sitio usa el catálogo de
  `src/data/merch.ts` con «Pedir por DM», así que nunca se rompe.
- Las opciones (talla, color…) y variantes se toman de Shopify; una variante sin inventario se muestra como agotada.
