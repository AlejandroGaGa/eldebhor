import Experience from "@/components/Experience";
import { loadStorefront } from "@/lib/shop-data";

export default async function Page() {
  const { products, promo } = await loadStorefront();
  return <Experience products={products} promo={promo} />;
}
