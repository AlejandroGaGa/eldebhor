import Experience from "@/components/Experience";
import { loadStorefront } from "@/lib/shop-data";
import { SAME_AS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export default async function Page() {
  const { products, promo } = await loadStorefront();

  // Datos estructurados (JSON-LD) para que Google entienda la marca y la tienda.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        sameAs: SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#web`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "es-MX",
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "ItemList",
        name: "Merch ELDEBHOR",
        itemListElement: products
          .filter((p) => p.visible !== false)
          .map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: p.nombre,
              description: p.descripcion,
              brand: { "@type": "Brand", name: SITE_NAME },
              ...(p.imagen ? { image: p.imagen.startsWith("http") ? p.imagen : `${SITE_URL}${p.imagen}` } : {}),
              ...(p.precio
                ? {
                    offers: {
                      "@type": "Offer",
                      url: `${SITE_URL}/#merch`,
                      priceCurrency: p.moneda ?? "MXN",
                      price: p.precio,
                      availability: p.agotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                    },
                  }
                : {}),
            },
          })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Experience products={products} promo={promo} />
    </>
  );
}
