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

## Pedidos por WhatsApp

Cada producto de `src/data/merch.ts` tiene el botón **Pedir por WhatsApp**: abre el chat con el pedido ya escrito
(producto, talla y precio). El número está en `WHATSAPP` dentro de `src/data/site.ts` (formato `52` + 10 dígitos).

## Panel de administración (/estudio)

Desde `/estudio` se editan los productos (nombre, descripción, precio, tallas, foto, agotado, ocultar, orden), se
ponen **ofertas por producto** (precio rebajado o porcentaje, con fecha de fin opcional que se quita sola) y una
**franja de oferta general** del sitio. Los cambios se ven en la página al guardar.

**Poner en marcha (local)**

1. Copia `.env.example` a `.env.local` y llena `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_SECRET`.
2. `npm run dev` y entra a `http://localhost:3000/estudio`.
3. En local los datos viven en `.data/db.json` (no se sube a git).

**Dar acceso a otra persona**: entra como dueño → pestaña **Accesos** → correo + contraseña de al menos 10
caracteres. Esa persona puede editar productos y ofertas, pero no dar ni quitar accesos; puede cambiar su
contraseña en su pestaña. Quitar el acceso cierra su sesión al instante.

**En producción (Vercel)** el disco es de solo lectura, así que hace falta una base de datos:

1. Crea una base en [Upstash](https://upstash.com) (Redis, plan gratis) y copia `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
2. En Vercel → Settings → Environment Variables agrega esas dos y también `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_SECRET`.
   (Si conectas la base desde Vercel → Storage → Upstash, Vercel crea `KV_REST_API_URL` y `KV_REST_API_TOKEN`; el panel acepta esos nombres también.)
3. Redeploy. Sin Upstash el panel avisa que no puede guardar.

**Dirección del panel**: está en `/estudio` (y no en el típico `/admin`, que los bots prueban primero). Ocultar la dirección no sustituye a la seguridad: lo que protege el panel es el login. Si quieres otra dirección, renombra las carpetas `src/app/estudio` y `src/app/api/estudio` y cambia `/api/estudio` en `src/components/admin/`.

**Seguridad**: contraseñas con scrypt + sal; sesión en cookie `httpOnly` firmada (8 h); bloqueo de 15 min tras
5 intentos fallidos; las acciones exigen mismo origen; las fotos se reducen en el navegador (JPG ≤ 900 px) y se
guardan en la misma base. Los productos que nunca se han editado salen de `src/data/merch.ts`; al guardar el
primero, todo el catálogo pasa a la base de datos y desde ahí se administra solo en el panel.

## Cookies

El sitio solo usa dos cookies de preferencia (1 año, sin rastreo ni terceros), definidas en `src/lib/prefs.ts`:

- `eldebhor_sonido` (`si`/`no`): recuerda si el visitante eligió sonido. Quien ya eligió entra directo, sin pantalla de carga.
  Si eligió sonido, el audio se activa en su primer toque o tecla (el navegador no permite sonar antes).
- `eldebhor_reproductor` (`min`/`max`): recuerda si dejó el reproductor minimizado.

El panel `/estudio` usa además una cookie de sesión (`eldebhor_admin`, solo para quien administra).

## SEO e indexación en Google

- Define `NEXT_PUBLIC_SITE_URL` en Vercel (Settings → Environment Variables) con tu dominio final, p. ej. `https://eldebhor.com`, y vuelve a desplegar. De ahí salen el canonical, Open Graph, `sitemap.xml` y `robots.txt`.
- Se generan solos: `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, datos estructurados (JSON-LD de marca, sitio y productos) y la imagen para compartir (`opengraph-image.png`).
- `/estudio` y `/api/estudio` quedan fuera del índice (`noindex` + `robots.txt`).
- Para pedir la indexación: Google Search Console → agregar propiedad → verificar → enviar `https://tu-dominio/sitemap.xml` → «Inspección de URLs» → «Solicitar indexación».
