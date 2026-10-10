import Experience from "@/components/Experience";
import { loadCatalog } from "@/lib/catalog";

export default async function Page() {
  const catalog = await loadCatalog();
  return <Experience catalog={catalog} />;
}
