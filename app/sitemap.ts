// sitemap.xml: páginas fixas, categorias e produtos do catálogo, com URL
// absoluta e barra no fim. Lista montada em components/conteudo/seo.ts.

import type { MetadataRoute } from "next";
import { entradasSitemap } from "../components/conteudo/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return entradasSitemap();
}
