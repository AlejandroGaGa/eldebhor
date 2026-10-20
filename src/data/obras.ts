/**
 * Galería de obras de ELDEBHOR.
 *
 * Para agregar una pieza: copia la foto a /public/obras/ y agrega una entrada
 * con `imagen: "/obras/archivo.webp"` y un `alt` que describa lo que se ve.
 * `anio`, `lugar` y `tecnica` son opcionales: si no los pones, no se muestran.
 * `ph` solo se usa si una obra no tiene `imagen` (dibujo de ejemplo).
 */
export type Tipo = "Muro" | "Lienzo" | "Tren" | "Boceto";

export type Obra = {
  id: string;
  titulo: string;
  anio?: string;
  lugar?: string;
  tecnica?: string;
  tipo: Tipo;
  /** proporción de la foto: "v" vertical, "h" horizontal, "c" cuadrada */
  formato: "v" | "h" | "c";
  imagen?: string;
  /** texto alternativo de la foto real (qué se ve en la imagen) */
  alt?: string;
  /** pieza de ejemplo mientras no hay foto */
  ph: { texto: string; bg: string; fg: string };
};

/** Filtros posibles; la galería solo muestra los que tienen obras. */
export const TIPOS: Tipo[] = ["Muro", "Lienzo", "Tren", "Boceto"];

const PH = { texto: "eldebhor", bg: "#241b51", fg: "#2ec6ee" };

export const OBRAS: Obra[] = [
  {
    id: "verde-morado",
    titulo: "Verde y morado",
    tecnica: "Aerosol sobre muro",
    tipo: "Muro",
    formato: "h",
    imagen: "/obras/mural-verde-morado.webp",
    alt: "Letras burbuja verde fosforescente con contorno morado y estrellas, pintadas sobre un muro de ladrillo rosa",
    ph: PH,
  },
  {
    id: "gorila-vs-dino",
    titulo: "Gorila vs Dino",
    tecnica: "Aerosol sobre muro",
    tipo: "Muro",
    formato: "v",
    imagen: "/obras/gorila-vs-dino.webp",
    alt: "Mural en la calle: un gorila azul y negro frente a un dinosaurio verde, con el nombre en letras rojas y blancas en el centro y una ciudad al fondo",
    ph: PH,
  },
  {
    id: "burbuja-blanca",
    titulo: "Burbuja blanca",
    tecnica: "Aerosol sobre concreto",
    tipo: "Muro",
    formato: "v",
    imagen: "/obras/burbuja-blanca-muro.webp",
    alt: "Un escritor con sudadera negra y capucha pintando letras burbuja blancas con contorno negro sobre un muro de concreto gris",
    ph: PH,
  },
  {
    id: "tag-cian",
    titulo: "Tag cian",
    tecnica: "Digital",
    tipo: "Boceto",
    formato: "c",
    imagen: "/obras/tag-cian.webp",
    alt: "Tag en cian con extrusión morado marino, halo arriba y chorreado de pintura, sobre fondo gris",
    ph: PH,
  },
  {
    id: "tag-humo",
    titulo: "Tag humo",
    tecnica: "Digital",
    tipo: "Boceto",
    formato: "c",
    imagen: "/obras/tag-humo.webp",
    alt: "Tag con halo en blanco difuminado, como humo, con chorreados, sobre fondo negro",
    ph: PH,
  },
  {
    id: "burbuja-blanco-negro",
    titulo: "Burbuja blanco y negro",
    tecnica: "Digital",
    tipo: "Boceto",
    formato: "h",
    imagen: "/obras/burbuja-blanco-negro.webp",
    alt: "Letras burbuja blancas con contorno negro y destellos, sobre fondo negro",
    ph: PH,
  },
  {
    id: "wildstyle-cian-rojo",
    titulo: "Wildstyle cian y rojo",
    tecnica: "Digital",
    tipo: "Boceto",
    formato: "v",
    imagen: "/obras/wildstyle-cian-rojo.webp",
    alt: "Wildstyle vertical en cian claro con contorno azul, hojas verdes y una calavera roja con corona, sobre fondo rojo",
    ph: PH,
  },
];
