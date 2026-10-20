/**
 * Convierte a WebP (recortado al ancho máximo de cada carpeta) todo JPG/PNG de /public.
 * Se corre con `npm run imagenes` después de meter fotos nuevas; genera el .webp junto al
 * original (el original se puede borrar o dejar fuera del sitio: el código solo usa .webp).
 * Así Vercel sirve archivos estáticos y no gasta «transformaciones» de imagen.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
// sharp ya viene con Next (lo usa para optimizar imágenes), no hace falta instalarlo aparte.
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public");
// ancho máximo por carpeta (px). Las tarjetas de merch miden ≤ 450 px: 1000 da de sobra para pantallas 2x.
const CARPETAS = { merch: 1000, obras: 1600, brand: 880, stickers: 420 };
const CALIDAD = { merch: 78, obras: 78, brand: 82, stickers: 82 };

let hechas = 0;
for (const [carpeta, maxAncho] of Object.entries(CARPETAS)) {
  const dir = path.join(ROOT, carpeta);
  let archivos = [];
  try {
    archivos = await readdir(dir);
  } catch {
    continue;
  }
  for (const nombre of archivos) {
    if (!/\.(jpe?g|png)$/i.test(nombre)) continue;
    const origen = path.join(dir, nombre);
    const destino = path.join(dir, nombre.replace(/\.(jpe?g|png)$/i, ".webp"));
    try {
      const [a, b] = await Promise.all([stat(origen), stat(destino)]);
      if (b.mtimeMs >= a.mtimeMs) continue; // ya está al día
    } catch {
      /* no existe el webp todavía */
    }
    const info = await sharp(origen)
      .rotate() // respeta la orientación EXIF de las fotos de celular
      .resize({ width: maxAncho, withoutEnlargement: true })
      .webp({ quality: CALIDAD[carpeta], effort: 6 })
      .toFile(destino);
    hechas++;
    console.log(`${carpeta}/${path.basename(destino)}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
console.log(hechas ? `${hechas} imagen(es) convertida(s).` : "Todo al día: no había fotos nuevas.");
