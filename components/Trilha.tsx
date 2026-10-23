/*
 * Trilha: breadcrumbs acessíveis + JSON-LD BreadcrumbList (SEO).
 *
 *   <Trilha itens={[
 *     { nome: "Lenços", href: "/catalogo/" },
 *     { nome: categoria.nome, href: `/catalogo/${categoria.slug}/` },
 *     { nome: produto.nome, href: `/produto/${produto.slug}/` },
 *   ]} />
 *
 * Props
 * - itens: { nome, href }[] na ordem, do mais geral para a página atual.
 *   O "Início" (/) entra sozinho no começo; se você já passar, não duplica.
 *   O último item é a página atual (aria-current="page", sem link).
 * - tom?: "claro" (padrão, sobre creme) | "escuro" (sobre couro).
 * - className?
 * Use hrefs com barra no fim (trailingSlash).
 */

import Link from "next/link";
import { SITE_URL } from "../content/site";

export type ItemTrilha = { nome: string; href: string };

export type TrilhaProps = {
  itens: ItemTrilha[];
  tom?: "claro" | "escuro";
  className?: string;
};

export function trilhaCompleta(itens: ItemTrilha[]): ItemTrilha[] {
  return itens[0]?.href === "/" ? itens : [{ nome: "Início", href: "/" }, ...itens];
}

export function jsonLdTrilha(itens: ItemTrilha[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trilhaCompleta(itens).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: new URL(item.href, SITE_URL).toString(),
    })),
  };
}

export default function Trilha({ itens, tom = "claro", className }: TrilhaProps) {
  const lista = trilhaCompleta(itens);
  const escuro = tom === "escuro";
  return (
    <>
      <nav aria-label="Trilha" className={className}>
        <ol className={`flex flex-wrap items-center gap-x-1 gap-y-1 text-[0.92rem] ${escuro ? "text-creme-2" : "text-tinta/75"}`}>
          {lista.map((item, i) => {
            const atual = i === lista.length - 1;
            return (
              <li key={`${item.href}-${i}`} className="inline-flex items-center gap-1">
                {atual ? (
                  <span aria-current="page" className={`font-medium ${escuro ? "text-creme" : "text-tinta"}`}>
                    {item.nome}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.href}
                      className={`inline-flex min-h-11 items-center underline decoration-dashed decoration-1 underline-offset-4 ${
                        escuro ? "decoration-ouro/60 hover:text-creme" : "decoration-ouro-escuro/50 hover:text-tinta"
                      }`}
                    >
                      {item.nome}
                    </Link>
                    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${escuro ? "text-ouro" : "text-ouro-escuro"}`} aria-hidden="true">
                      <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTrilha(itens)).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
