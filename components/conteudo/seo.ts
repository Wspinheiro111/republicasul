/*
 * SEO técnico das páginas de conteúdo (guia, lojistas, sobre) e dos arquivos
 * gerados no build (sitemap.xml, robots.txt) e do vercel.json.
 *
 *   export const metadata = metadadosPagina({
 *     titulo: "Guia do lenço",
 *     descricao: "...",
 *     caminho: "/guia-do-lenco/",
 *   });
 *
 * O openGraph de uma página substitui o do layout por inteiro (o Next não
 * mescla objetos aninhados), por isso locale, siteName e a imagem padrão são
 * repetidos aqui. Canonical e og:url são sempre da própria página.
 */

import type { Metadata, MetadataRoute } from "next";
import { categorias, produtos } from "../../content/catalogo";
import { empresa, redirecionamentosLegados, SITE_URL } from "../../content/site";

/** URL absoluta a partir de um caminho do site ("/sobre/" -> "https://www.../sobre/"). */
export function urlAbsoluta(caminho: string): string {
  return new URL(caminho, SITE_URL).toString();
}

/** Imagem de compartilhamento padrão (public/og.png, gerada por scripts/gerar-og.mjs). */
export const IMAGEM_COMPARTILHAMENTO = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Republicasul: lenços e palas da indumentária gaúcha, tramados artesanalmente",
};

export function metadadosPagina({
  titulo,
  descricao,
  caminho,
  indexar = true,
}: {
  titulo: string;
  descricao: string;
  caminho: string;
  indexar?: boolean;
}): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: empresa.nome,
      title: `${titulo} | ${empresa.nome}`,
      description: descricao,
      url: caminho,
      images: [IMAGEM_COMPARTILHAMENTO],
    },
    ...(indexar ? {} : { robots: { index: false, follow: true } }),
  };
}

/** Serializa JSON-LD para <script> sem abrir brecha para "</script>". */
export function jsonLd(dados: unknown): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

// ------------------------------------------------------------------
// Rotas do site
// ------------------------------------------------------------------

/** Páginas fixas que entram no sitemap (sempre com barra no fim). */
export const ROTAS_ESTATICAS = ["/", "/catalogo/", "/montador/", "/guia-do-lenco/", "/lojistas/", "/sobre/"] as const;

/**
 * Páginas que existem mas não devem ir para o Google (lista pessoal do
 * visitante). Ficam fora do sitemap e levam meta robots noindex na própria
 * página. Não entram no Disallow do robots.txt de propósito: bloqueada, a
 * página não é lida, o Google não vê o noindex e pode listar a URL nua.
 */
export const ROTAS_FORA_DO_INDICE = ["/pedido/"] as const;

export const caminhoCategoria = (slug: string) => `/catalogo/${slug}/`;
export const caminhoProduto = (slug: string) => `/produto/${slug}/`;

/** Todos os caminhos do sitemap: páginas fixas, categorias e produtos, sem repetir. */
export function caminhosDoSitemap(): string[] {
  const caminhos = [
    ...ROTAS_ESTATICAS,
    ...categorias.map((c) => caminhoCategoria(c.slug)),
    ...produtos.map((p) => caminhoProduto(p.slug)),
  ];
  const fora = new Set<string>(ROTAS_FORA_DO_INDICE);
  return Array.from(new Set(caminhos)).filter((c) => !fora.has(c));
}

/*
 * Entradas do sitemap.xml. Sem lastModified, changeFrequency ou priority de
 * propósito: não temos datas reais de atualização e o Google ignora os outros
 * dois. Melhor não declarar do que declarar errado.
 */
export function entradasSitemap(): MetadataRoute.Sitemap {
  return caminhosDoSitemap().map((caminho) => ({ url: urlAbsoluta(caminho) }));
}

export function regrasRobots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}

// ------------------------------------------------------------------
// vercel.json
// ------------------------------------------------------------------

export type ConfiguracaoVercel = {
  trailingSlash: true;
  redirects: { source: string; destination: string; statusCode: 301 }[];
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

/*
 * O conteúdo esperado do vercel.json. As URLs antigas (.php) do site em PHP
 * viram redirecionamentos 301 a partir de redirecionamentosLegados
 * (content/site.ts). Usamos statusCode 301 (e não permanent: true, que na
 * Vercel responde 308).
 *
 * O teste tests/institucional.test.tsx confere que o vercel.json está igual a
 * isto. Ao mudar redirecionamentosLegados, o teste falha e mostra o JSON
 * esperado: copie para o vercel.json.
 */
export function configuracaoVercel(): ConfiguracaoVercel {
  return {
    trailingSlash: true,
    redirects: Object.entries(redirecionamentosLegados).map(([source, destination]) => ({
      source,
      destination,
      statusCode: 301,
    })),
    headers: [
      {
        // Arquivos com hash no nome: podem ficar em cache por um ano.
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ],
  };
}
