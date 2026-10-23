"use client";

/*
 * CartaoProduto: o produto na vitrine (catálogo, categoria, "Outros lenços").
 *
 *   <CartaoProduto produto={produto} />
 *   <CartaoProduto produto={produto} mostrarCategoria={false} prioridade />
 *
 * - Foto real (next/image, unoptimized por ser export estático) quando
 *   produto.fotos tiver itens; senão o desenho do LencoArte, nas cores da
 *   escolha padrão (exatamente o que o botão rápido põe na lista).
 * - Nome com link para o produto (o cartão inteiro é clicável), resumo,
 *   "Valor pelo WhatsApp" ou o preço em reais quando confirmado.
 * - Botão rápido "Adicionar ao pedido" com as escolhas padrão e quantidade 1.
 *   Com opção de cor, mostra antes "Vai com: vermelho e azul".
 *   Mostra "Adicionado", anuncia no leitor de tela e deixa o link "Ver seu pedido".
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { categoriaPorSlug, coresDasEscolhas, escolhasPadrao, type Produto } from "../../content/catalogo";
import { adicionarItem } from "../../lib/pedido";
import { descreverEscolhas } from "../../lib/whatsapp";
import LencoArte from "../LencoArte";
import { nomesDasCores, textoPreco, tituloDoDesenho } from "./funcoes";
import { caminhoProduto } from "./seo";

export type CartaoProdutoProps = {
  produto: Produto;
  /** Mostra o nome da linha acima do nome (padrão: true). */
  mostrarCategoria?: boolean;
  /** Carrega a foto com prioridade (primeiro cartão visível). */
  prioridade?: boolean;
  className?: string;
};

export function IconeMais({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconeCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M4 10.5l4 4L16 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CartaoProduto({ produto, mostrarCategoria = true, prioridade = false, className }: CartaoProdutoProps) {
  const idNome = `cartao-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [vezes, setVezes] = useState(0);
  const [recente, setRecente] = useState(false);
  const categoria = categoriaPorSlug(produto.categoria);
  const foto = produto.fotos[0];
  const href = caminhoProduto(produto.slug);
  // Uma escolha só para o desenho, o botão rápido e os avisos: o cartão
  // mostra exatamente a combinação que entra na lista.
  const escolhas = escolhasPadrao(produto);
  const coresEscolhidas = nomesDasCores(produto, escolhas);

  // "Adicionado" volta a "Adicionar" depois de um instante; o link fica.
  useEffect(() => {
    if (!recente) return;
    const relogio = window.setTimeout(() => setRecente(false), 2400);
    return () => window.clearTimeout(relogio);
  }, [recente, vezes]);

  const adicionar = () => {
    adicionarItem({ produto: produto.slug, escolhas, quantidade: 1 });
    setVezes((n) => n + 1);
    setRecente(true);
  };

  const escolhaPadrao = descreverEscolhas(produto, escolhas);

  return (
    <article
      className={`@container group relative flex h-full flex-col overflow-hidden rounded-[var(--raio)] border border-tinta/15 bg-creme transition-colors hover:border-tinta/40 ${className ?? ""}`}
      data-produto={produto.slug}
    >
      <div className="secao-escura trama relative aspect-square overflow-hidden">
        {foto ? (
          <Image
            src={foto}
            alt={`Foto do ${produto.nome}`}
            fill
            unoptimized
            priority={prioridade}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-[8%] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]">
            <LencoArte
              padrao={produto.padrao}
              cores={coresDasEscolhas(produto, escolhas)}
              titulo={tituloDoDesenho(produto, escolhas)}
              mostrarFranja={false}
            />
          </div>
        )}
        {/* Costura em volta da vitrine. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-[6px] rounded-[var(--raio-pequeno)] border border-dashed border-ouro/35" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {mostrarCategoria && categoria && <p className="rotulo text-[0.7rem] text-ouro-escuro sm:text-[0.74rem]">{categoria.nome}</p>}
        <h3 id={idNome} className="text-[1.06rem] leading-snug sm:text-[1.2rem]">
          <Link
            href={href}
            className="no-underline decoration-ouro-escuro decoration-dashed underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {produto.nome}
          </Link>
        </h3>
        <p className="text-[0.9rem] leading-snug text-tinta/75 sm:text-[0.96rem]">{produto.resumo}</p>

        <p className="mt-auto pt-2 font-rotulo text-[0.86rem] font-semibold uppercase tracking-[0.07em] text-tinta">
          {textoPreco(produto.preco)}
        </p>
        {coresEscolhidas && (
          <p className="text-[0.86rem] leading-snug text-tinta/75" data-testid="vai-com">
            Vai com: <span className="text-tinta">{coresEscolhidas}</span>
          </p>
        )}

        {/* Acima do link que cobre o cartão. */}
        <div className="relative z-10 mt-1 flex flex-col items-stretch">
          <button
            type="button"
            onClick={adicionar}
            aria-describedby={idNome}
            className="botao-acao botao-pequeno w-full gap-1.5 px-2.5"
            data-recente={recente ? "" : undefined}
          >
            {recente ? <IconeCheck className="h-5 w-5" /> : <IconeMais className="h-5 w-5" />}
            {recente ? (
              <span>Adicionado</span>
            ) : (
              <span>
                Adicionar{" "}
                <span className="sr-only @min-[16.5rem]:not-sr-only">ao pedido</span>
              </span>
            )}
          </button>
          {vezes > 0 && (
            <Link
              href="/pedido/"
              className="inline-flex min-h-11 items-center justify-center gap-1 text-[0.95rem] font-medium underline decoration-ouro-escuro decoration-dashed underline-offset-4"
            >
              Ver seu pedido
            </Link>
          )}
          <p role="status" className="sr-only">
            {vezes > 0 && (
              <span key={vezes}>
                {produto.nome} adicionado ao pedido{escolhaPadrao ? ` (${escolhaPadrao})` : ""}.
              </span>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
