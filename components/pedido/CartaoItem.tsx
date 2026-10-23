"use client";

/*
 * CartaoItem: uma linha da lista do pedido.
 *
 *   <CartaoItem item={item} numero={1} chave={chaveDoItem(item)}
 *     aoMudarQuantidade={(n) => alterarQuantidade(0, n)} aoRemover={() => ...} />
 *
 * Miniatura nas cores escolhidas, número (o mesmo da mensagem do WhatsApp),
 * nome com link para o produto, escolhas em texto, quantidade e "Remover".
 */

import Link from "next/link";
import { produtoPorSlug } from "../../content/catalogo";
import { descreverEscolhas, type ItemPedido } from "../../lib/whatsapp";
import { IconeLixeira } from "../montador/Icones";
import Quantidade from "../Quantidade";
import { caminhoDoProduto, rotuloDoItem } from "./funcoes";
import MiniaturaPeca from "./MiniaturaPeca";

export type CartaoItemProps = {
  item: ItemPedido;
  numero: number;
  chave: string;
  aoMudarQuantidade: (quantidade: number) => void;
  aoRemover: () => void;
};

export default function CartaoItem({ item, numero, chave, aoMudarQuantidade, aoRemover }: CartaoItemProps) {
  const produto = produtoPorSlug(item.produto);
  if (!produto) return null;
  const descricao = descreverEscolhas(produto, item.escolhas);
  const partes = descricao ? descricao.split(" · ") : [];
  const rotulo = rotuloDoItem(produto, item.escolhas);

  return (
    <li
      data-chave={chave}
      className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-dashed border-tinta/25 py-5 first:pt-1 sm:grid-cols-[6.5rem_minmax(0,1fr)] md:grid-cols-[6.5rem_minmax(0,1fr)_auto] md:items-center"
    >
      <div className="relative row-span-2 md:row-span-1">
        <span
          aria-hidden="true"
          className="absolute -left-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-tinta font-rotulo text-[0.9rem] font-semibold text-creme"
        >
          {numero}
        </span>
        <MiniaturaPeca produto={produto} escolhas={item.escolhas} />
      </div>

      <div className="min-w-0">
        <h3 className="m-0 text-[1.15rem] leading-snug sm:text-[1.25rem]">
          <span className="sr-only">Item {numero}:</span>{" "}
          <Link
            href={caminhoDoProduto(item)}
            className="underline decoration-ouro-escuro/50 decoration-dashed decoration-1 underline-offset-4 hover:decoration-solid"
          >
            {produto.nome}
          </Link>
        </h3>
        {partes.length > 0 && (
          <ul className="m-0 mt-1 list-none p-0 text-[0.95rem] leading-snug text-tinta/80">
            {partes.map((parte) => (
              <li key={parte}>{parte}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-2 md:col-start-3">
        <Quantidade valor={item.quantidade} aoMudar={aoMudarQuantidade} rotulo={`Quantidade de ${rotulo}`} rotuloVisivel={false} />
        <button
          type="button"
          onClick={aoRemover}
          className="inline-flex min-h-12 items-center gap-2 rounded-[var(--raio)] px-3 font-medium text-tinta/80 transition-colors hover:bg-maragato/5 hover:text-maragato-escuro"
        >
          <IconeLixeira className="h-5 w-5" />
          <span>Remover</span> <span className="sr-only">{rotulo}</span>
        </button>
      </div>
    </li>
  );
}
