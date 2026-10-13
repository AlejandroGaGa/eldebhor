/**
 * Merch de ELDEBHOR.
 *
 * Cada producto usa una foto de /public/merch/ (campo `imagen`).
 * - `precio`: pon el número cuando lo tengas; sin precio la tarjeta muestra
 *   «Consultar» y el mensaje de WhatsApp no lleva precio.
 * - `opciones` + `etiqueta`: lo que el cliente elige antes de pedir
 *   (tallas, colores, modelos). Sin `opciones` se pide directo.
 * - `agotado`: bloquea el botón y pone el sello.
 * - Sin `imagen` se dibuja el producto con `forma` / `color` / `tinta`.
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
  imagen?: string;
  alt?: string;
  /** dibujo de ejemplo mientras no hay foto */
  forma?: "playera" | "sudadera" | "gorra" | "tote" | "stickers" | "print";
  color?: string;
  tinta?: string;
};

const TALLAS = ["S", "M", "L", "XL"];

export const MERCH: Producto[] = [
  {
    id: "playera-payaso",
    nombre: "Playera Payaso (blanca)",
    descripcion: "Payaso de peluca arcoíris estampado en la espalda.",
    opciones: TALLAS,
    imagen: "/merch/playera-payaso-blanca.jpg",
    alt: "Playera blanca vista por detrás con el payaso de peluca arcoíris y gesto de fastidio estampado en la espalda",
  },
  {
    id: "playera-tag-payaso",
    nombre: "Playera Letras + Payaso (negra)",
    descripcion: "Letras burbuja blancas con contorno verde y el payaso arcoíris, al frente.",
    opciones: TALLAS,
    imagen: "/merch/playera-tag-payaso-negra.jpg",
    alt: "Playera negra con letras burbuja blancas de contorno verde y el payaso de peluca arcoíris estampado al frente",
  },
  {
    id: "pin-tag-cian",
    nombre: "Pin Tag Cian",
    descripcion: "Pin esmaltado con el tag en cian sobre negro. Viene en su tarjeta.",
    precio: 200,
    imagen: "/merch/pin-tag-cian.jpg",
    alt: "Pin con el tag ELDEBHOR en cian sobre fondo negro, montado en una tarjeta blanca",
  },
  {
    id: "payaso-arcoiris",
    nombre: "Grinder grande Payaso Arcoíris",
    descripcion: "Grinder grande con la cara del payasito de peluca arcoíris.",
    precio: 430,
    imagen: "/merch/payaso-arcoiris.jpg",
    alt: "Grinder grande con la cara del payasito de peluca arcoíris sobre una mesa, con otras piezas negras apiladas detrás",
  },
  {
    id: "grinders-chicos",
    nombre: "Grinder chico Payaso",
    descripcion: "Grinder chico del payasito, en tres versiones: arcoíris, diablo con cuernos y ángel con halo. Precio por pieza.",
    precio: 200,
    opciones: ["Arcoíris", "Diablo", "Ángel"],
    etiqueta: "Modelo",
    imagen: "/merch/pins-payaso-set.jpg",
    alt: "Tres grinders chicos del payasito en la palma de una mano: uno con peluca arcoíris, uno con cuernos de diablo y uno con halo de ángel",
  },
  {
    id: "tinta-tag",
    nombre: "Chorreador ELDEBHOR",
    descripcion: "Botella con gotero y la etiqueta del tag en cian. Precio por pieza.",
    precio: 50,
    opciones: ["Menta", "Rojo", "Blanco"],
    etiqueta: "Color",
    imagen: "/merch/tintas-tag.jpg",
    alt: "Tres botellas gotero con etiqueta negra del tag ELDEBHOR, una menta, una roja y una blanca",
  },
  {
    id: "tintas-colores",
    nombre: "Chorreadores en colores surtidos",
    descripcion: "Botellas con gotero en muchos colores. Precio por pieza; pregunta por WhatsApp cuáles hay.",
    precio: 50,
    imagen: "/merch/tintas-colores.jpg",
    alt: "Vista desde arriba de muchas botellas gotero con tapa blanca en colores azul, rosa, negro, morado, menta, rojo y blanco",
  },
  {
    id: "encendedor",
    nombre: "Encendedor ELDEBHOR",
    descripcion: "Encendedor con el tag en relieve y el chorreado de pintura.",
    precio: 220,
    opciones: ["Negro y blanco", "Negro y azul", "Rosa metálico"],
    etiqueta: "Color",
    imagen: "/merch/fundas-lata.jpg",
    alt: "Tres encendedores con forma de lata de aerosol, con el tag en relieve y chorreado: negro con blanco, negro con azul y rosa metálico con blanco",
  },
  {
    id: "gorra-ambitionz",
    nombre: "Gorra AMBITIONZ x DHEBOR · Blue Tag",
    descripcion: "Colaboración con Ambitionz Caps. Precio por gorra.",
    precio: 1200,
    imagen: "/merch/gorra-ambitionz-blue-tag.jpg",
    alt: "Gorras negras de la colaboración Ambitionz x Dhebor con bordado del tag en blanco y azul, vistas desde varios ángulos",
  },
];
