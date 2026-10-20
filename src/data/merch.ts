/**
 * Merch de ELDEBHOR.
 *
 * Cada producto usa una foto de /public/merch/ (campo `imagen`), en WebP: corre `npm run imagenes` tras agregar fotos nuevas.
 * - `precio`: pon el número cuando lo tengas; sin precio la tarjeta muestra
 *   «Consultar» y el mensaje de WhatsApp no lleva precio.
 * - `opciones` + `etiqueta`: lo que el cliente elige antes de pedir
 *   (tallas, colores, modelos). Sin `opciones` se pide directo.
 * - `agotado`: bloquea el botón y pone el sello.
 * - `destacado`: la pieza que se vende en la portada (arriba de todo). Solo
 *   se usa la primera visible; si ninguna lo tiene, se toma la primera del catálogo.
 * - Sin `imagen` se dibuja el producto con `forma` / `color` / `tinta`.
 * - `video`: clip corto de cómo funciona el artículo (se sube desde /estudio y queda en /api/vid/…).
 *   En la tienda aparece el botón «Ver cómo funciona» que lo reproduce en el lugar de la foto.
 */
export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  /** vacío = «Consultar» */
  precio?: number;
  moneda?: string;
  /** qué se elige antes de pedir (tallas, colores, modelos) */
  opciones?: string[];
  /** nombre de la opción: "Talla" (por defecto), "Color", "Modelo"… */
  etiqueta?: string;
  agotado?: boolean;
  /** false = oculto en la tienda (se administra desde /estudio) */
  visible?: boolean;
  /** true = es la pieza de la portada (hero) */
  destacado?: boolean;
  /** oferta: precio rebajado y, si se quiere, el último día (AAAA-MM-DD) en que vale */
  oferta?: { precio: number; hasta?: string };
  imagen?: string;
  alt?: string;
  /** clip de cómo funciona, subido desde /estudio (/api/vid/<id>) */
  video?: string;
  /** dibujo de ejemplo mientras no hay foto */
  forma?: "playera" | "sudadera" | "gorra" | "tote" | "stickers" | "print";
  color?: string;
  tinta?: string;
};

const TALLAS = ["S", "M", "L", "XL"];

export const MERCH: Producto[] = [
  {
    id: "chorreadores",
    nombre: "Chorreadores",
    descripcion: "Botella con gotero para chorrear. Muchos colores; precio por pieza. Pregunta por WhatsApp cuáles hay.",
    precio: 50,
    destacado: true,
    imagen: "/merch/tintas-colores.webp",
    alt: "Vista desde arriba de muchas botellas gotero con tapa blanca en colores azul, rosa, negro, morado, menta, rojo y blanco",
  },
  {
    id: "pack-estampas-tornasol",
    nombre: "Pack de Estampas Tornasol",
    descripcion: "Pack de 3 stickers tornasol con el tag y el payaso. Brillan de todos los colores según la luz.",
    precio: 60,
    imagen: "/merch/estampas-tornasol.webp",
    alt: "Paquetes de stickers tornasol con las letras burbuja del tag y el payaso de peluca arcoíris, apilados sobre una mesa de madera",
  },
  {
    id: "payaso-arcoiris",
    nombre: "Despalillador de 3 pisos",
    descripcion: "Despalillador de 3 pisos con la cara del payaso de peluca arcoíris y el tag en la tapa.",
    precio: 430,
    imagen: "/merch/despalillador-payaso.webp",
    alt: "Despalillador negro de tres pisos junto a sus dos tapas: una con el tag en blanco sobre negro y otra con la cara del payaso de peluca arcoíris",
  },
  {
    id: "tinta-tag",
    nombre: "Chorreador ELDEBHOR",
    descripcion: "Botella con gotero y la etiqueta del tag en cian. Precio por pieza.",
    precio: 50,
    opciones: ["Menta", "Rojo", "Blanco"],
    etiqueta: "Color",
    imagen: "/merch/tintas-tag.webp",
    alt: "Tres botellas gotero con etiqueta negra del tag ELDEBHOR, una menta, una roja y una blanca",
  },
  {
    id: "grinders-chicos",
    nombre: "Despalillador chico Payaso",
    descripcion: "Despalillador chico del payasito, en tres versiones: arcoíris, diablo con cuernos y ángel con halo. Precio por pieza.",
    precio: 200,
    opciones: ["Arcoíris", "Diablo", "Ángel"],
    etiqueta: "Modelo",
    imagen: "/merch/pins-payaso-set.webp",
    alt: "Tres despalilladores chicos del payasito en la palma de una mano: uno con peluca arcoíris, uno con cuernos de diablo y uno con halo de ángel",
  },
  {
    id: "pin-tag-cian",
    nombre: "Pin Tag Cian",
    descripcion: "Pin esmaltado con el tag en cian sobre negro. Viene en su tarjeta.",
    precio: 200,
    imagen: "/merch/pin-tag-cian.webp",
    alt: "Pin con el tag ELDEBHOR en cian sobre fondo negro, montado en una tarjeta blanca",
  },
  {
    id: "encendedor",
    nombre: "Encendedor ELDEBHOR",
    descripcion: "Encendedor con el tag en relieve y el chorreado de pintura.",
    precio: 220,
    opciones: ["Negro y blanco", "Negro y azul", "Rosa metálico"],
    etiqueta: "Color",
    imagen: "/merch/fundas-lata.webp",
    alt: "Tres encendedores con forma de lata de aerosol, con el tag en relieve y chorreado: negro con blanco, negro con azul y rosa metálico con blanco",
  },
  {
    id: "playera-payaso",
    nombre: "Playera Payaso (blanca)",
    descripcion: "Payaso de peluca arcoíris estampado en la espalda.",
    opciones: TALLAS,
    imagen: "/merch/playera-payaso-blanca.webp",
    alt: "Playera blanca vista por detrás con el payaso de peluca arcoíris y gesto de fastidio estampado en la espalda",
  },
  {
    id: "playera-tag-payaso",
    nombre: "Playera Letras + Payaso (negra)",
    descripcion: "Letras burbuja blancas con contorno verde y el payaso arcoíris, al frente.",
    opciones: TALLAS,
    imagen: "/merch/playera-tag-payaso-negra.webp",
    alt: "Playera negra con letras burbuja blancas de contorno verde y el payaso de peluca arcoíris estampado al frente",
  },
  {
    id: "gorra-ambitionz",
    nombre: "Gorra AMBITIONZ x DHEBOR · Blue Tag",
    descripcion: "Colaboración con Ambitionz Caps. Precio por gorra.",
    precio: 1200,
    imagen: "/merch/gorra-ambitionz-blue-tag.webp",
    alt: "Gorras negras de la colaboración Ambitionz x Dhebor con bordado del tag en blanco y azul, vistas desde varios ángulos",
  },
];
