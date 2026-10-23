/*
 * Metadados e dados estruturados das páginas do catálogo e do produto.
 *
 * O openGraph de uma página substitui o do layout por inteiro (o Next não
 * mescla objetos aninhados), por isso locale e siteName são repetidos aqui.
 * Canonical e og:url são definidos por página. Sem foto real do produto,
 * vale a imagem de compartilhamento padrão (public/og.png): um openGraph sem
 * images apagaria a herdada do layout.
 *
 * URLs e caminhos vêm de components/conteudo/seo.ts (um lugar só para o site).
 */

import type { Metadata } from "next";
import { categoriaPorSlug, type Categoria, type Produto } from "../../content/catalogo";
import { empresa } from "../../content/site";
import { caminhoCategoria, caminhoProduto, IMAGEM_COMPARTILHAMENTO, urlAbsoluta } from "../conteudo/seo";

export { caminhoCategoria, caminhoProduto, urlAbsoluta };

export function metadadosDaPagina({
  titulo,
  descricao,
  caminho,
  imagens = [],
}: {
  titulo: string;
  descricao: string;
  caminho: string;
  imagens?: string[];
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
      images: imagens.length > 0 ? imagens.map((src) => ({ url: src, alt: titulo })) : [IMAGEM_COMPARTILHAMENTO],
    },
  };
}

export function descricaoCategoria(categoria: Categoria): string {
  return `${categoria.resumo} Peças tramadas artesanalmente pela Republicasul, de Porto Alegre/RS. Monte o pedido e fale pelo WhatsApp.`;
}

export function descricaoProduto(produto: Produto): string {
  return `${produto.resumo} Monte o pedido e fale pelo WhatsApp.`;
}

/**
 * JSON-LD Product. Imagem só se houver foto real; offers só se houver preço
 * confirmado (sem preço não inventamos oferta, disponibilidade nem valor).
 */
export function jsonLdProduto(produto: Produto) {
  const url = urlAbsoluta(caminhoProduto(produto.slug));
  const categoria = categoriaPorSlug(produto.categoria);
  const temPreco = typeof produto.preco === "number" && Number.isFinite(produto.preco) && produto.preco > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao,
    brand: { "@type": "Brand", name: empresa.nome },
    ...(categoria ? { category: categoria.nome } : {}),
    url,
    ...(produto.fotos.length > 0 ? { image: produto.fotos.map(urlAbsoluta) } : {}),
    ...(temPreco ? { offers: { "@type": "Offer", price: produto.preco!.toFixed(2), priceCurrency: "BRL", url } } : {}),
  };
}

/** Serializa para <script type="application/ld+json"> sem abrir brecha para "</script>". */
export function jsonParaScript(dados: unknown): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}
