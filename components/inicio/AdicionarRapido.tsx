"use client";

/*
 * AdicionarRapido: "Adicionar ao pedido" direto do cartão, com a escolha
 * padrão do produto (escolhasPadrao). Mostra o retorno na hora: o botão vira
 * "Adicionado", aparece quantas peças desse lenço já estão na lista com o link
 * para o pedido, e o leitor de tela ouve a confirmação (role="status").
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { escolhasPadrao, produtoPorSlug } from "../../content/catalogo";
import { adicionarItem, lerItens, usePedido } from "../../lib/pedido";
import type { ItemPedido } from "../../lib/whatsapp";
import { IconeCheck } from "./Icones";

const pecasDoProduto = (itens: ItemPedido[], slug: string) =>
  itens.filter((i) => i.produto === slug).reduce((soma, i) => soma + i.quantidade, 0);

const pecas = (n: number) => (n === 1 ? "1 peça" : `${n} peças`);

export default function AdicionarRapido({ slug, className }: { slug: string; className?: string }) {
  const produto = produtoPorSlug(slug);
  const naLista = pecasDoProduto(usePedido(), slug);
  const [adicionado, setAdicionado] = useState(false);
  const [aviso, setAviso] = useState("");
  const relogio = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(relogio.current), []);

  if (!produto) return null;

  const adicionar = () => {
    adicionarItem({ produto: produto.slug, escolhas: escolhasPadrao(produto), quantidade: 1 });
    const total = pecasDoProduto(lerItens(), produto.slug);
    setAviso(`Adicionado ao pedido: ${produto.nome}. Na sua lista: ${pecas(total)}.`);
    setAdicionado(true);
    window.clearTimeout(relogio.current);
    relogio.current = window.setTimeout(() => setAdicionado(false), 2600);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={adicionar}
        // O nome acessível começa pelo texto visível e diz qual lenço é.
        aria-label={`${adicionado ? "Adicionado" : "Adicionar"} ao pedido: ${produto.nome}`}
        className="botao-acao botao-pequeno w-full"
        data-adicionado={adicionado ? "sim" : "nao"}
      >
        {adicionado ? (
          <>
            <IconeCheck className="h-5 w-5" />
            <span>Adicionado</span>
          </>
        ) : (
          <span>Adicionar ao pedido</span>
        )}
      </button>
      {naLista > 0 && (
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[0.92rem] text-tinta/80">
          <span>
            Na sua lista: <strong className="font-semibold text-tinta">{pecas(naLista)}</strong>
          </span>
          <Link href="/pedido/" className="inline-flex min-h-11 items-center font-semibold text-tinta underline decoration-ouro-escuro/60 underline-offset-4">
            Ver pedido
          </Link>
        </p>
      )}
      <p role="status" className="sr-only">
        {aviso}
      </p>
    </div>
  );
}
