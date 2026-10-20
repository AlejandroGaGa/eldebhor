import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las fotos ya vienen recortadas y en WebP desde /public (ver scripts/optimizar-imagenes.mjs):
  // se sirven tal cual desde el CDN y no gastan «transformaciones» de Vercel.
  images: { unoptimized: true },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
