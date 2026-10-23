// robots.txt: tudo liberado e o endereço do sitemap. A lista de pedido fica
// fora do índice pelo meta noindex da página (ver ROTAS_FORA_DO_INDICE em
// components/conteudo/seo.ts).

import type { MetadataRoute } from "next";
import { regrasRobots } from "../components/conteudo/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return regrasRobots();
}
