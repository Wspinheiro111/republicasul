"use client";

/*
 * GradeProdutos: grade de CartaoProduto, com filtro opcional por linha.
 *
 *   <GradeProdutos produtos={produtos} filtro />                 catálogo
 *   <GradeProdutos produtos={daCategoria} mostrarCategoria={false} />
 *
 * O filtro só age no navegador: o HTML estático sai com TODOS os produtos
 * (bom para o Google e para quem está sem JavaScript). Os chips são botões
 * com aria-pressed; a contagem é anunciada numa região de status.
 * Com "reduzir movimento", a grade troca sem animação.
 */

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import type { Produto } from "../../content/catalogo";
import { useReduzirMovimento } from "../movimento";
import CartaoProduto from "./CartaoProduto";
import { categoriasComProduto, nomeCurtoDaLinha, pecas } from "./funcoes";
import { caminhoCategoria } from "./seo";

export type GradeProdutosProps = {
  produtos: Produto[];
  /** Mostra os chips de filtro por linha (padrão: false). */
  filtro?: boolean;
  mostrarCategoria?: boolean;
  /** Classes da grade (troque as colunas se precisar). */
  classeGrade?: string;
  className?: string;
};

const GRADE_PADRAO = "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6";

export default function GradeProdutos({ produtos, filtro = false, mostrarCategoria = true, classeGrade = GRADE_PADRAO, className }: GradeProdutosProps) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const reduzir = useReduzirMovimento();
  const linhas = categoriasComProduto(produtos);
  const visiveis = ativa ? produtos.filter((p) => p.categoria === ativa) : produtos;
  const linhaAtiva = linhas.find((c) => c.slug === ativa);
  const transicao = reduzir ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  const chip = (pressionado: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-[var(--raio)] border px-3 text-[0.95rem] font-medium transition-colors sm:px-3.5 ${
      pressionado ? "border-tinta bg-tinta text-creme" : "border-tinta/30 bg-creme text-tinta hover:border-tinta/70"
    }`;

  return (
    <div className={className}>
      {filtro && linhas.length > 1 && (
        <div className="mb-5 flex flex-col gap-2 md:mb-8 md:gap-3">
          <div role="group" aria-label="Filtrar por linha" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={ativa === null} onClick={() => setAtiva(null)} className={chip(ativa === null)}>
              Todos <span className="hidden tabular-nums opacity-70 sm:inline">({produtos.length})</span>
            </button>
            {linhas.map((linha) => {
              const quantos = produtos.filter((p) => p.categoria === linha.slug).length;
              return (
                <button
                  key={linha.slug}
                  type="button"
                  aria-pressed={ativa === linha.slug}
                  onClick={() => setAtiva((a) => (a === linha.slug ? null : linha.slug))}
                  className={chip(ativa === linha.slug)}
                >
                  {nomeCurtoDaLinha(linha)} <span className="hidden tabular-nums opacity-70 sm:inline">({quantos})</span>
                </button>
              );
            })}
          </div>
          <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 text-[0.95rem] text-tinta/75">
            <p role="status" className="m-0">
              {linhaAtiva ? `${pecas(visiveis.length)} em ${linhaAtiva.nome}` : `${pecas(visiveis.length)} no catálogo`}
            </p>
            {linhaAtiva && (
              <Link
                href={caminhoCategoria(linhaAtiva.slug)}
                className="inline-flex min-h-11 items-center font-medium text-tinta underline decoration-ouro-escuro decoration-dashed underline-offset-4"
              >
                Abrir a página da linha
              </Link>
            )}
          </div>
        </div>
      )}

      <motion.ul role="list" layout={!reduzir} className={`m-0 list-none p-0 ${classeGrade}`} transition={transicao}>
        <AnimatePresence initial={false} mode="popLayout">
          {visiveis.map((produto, i) => (
            <motion.li
              key={produto.slug}
              layout={!reduzir}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={transicao}
              className="min-w-0"
            >
              <CartaoProduto produto={produto} mostrarCategoria={mostrarCategoria} prioridade={i < 2} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
