/*
 * Funções da página "Seu pedido" (sem React, só a API pública de lib/pedido).
 *
 *   chaveDoItem(item)              identifica a variação (produto + escolhas)
 *   caminhoDoProduto(item)         /produto/slug/?cor-1=azul&medida=padrao
 *   rotuloDoItem(produto, escolhas) "Lenço carijó uma cor, Cor do xadrez: Azul · Medida: Medida padrão"
 *   restaurarItem(item, indice)    "Desfazer": devolve o item ao mesmo lugar da lista
 */

import type { Produto } from "../../content/catalogo";
import { produtoPorSlug } from "../../content/catalogo";
import { adicionarItem, lerItens, limparPedido } from "../../lib/pedido";
import { descreverEscolhas, type ItemPedido } from "../../lib/whatsapp";

export function chaveDoItem(item: Pick<ItemPedido, "produto" | "escolhas">): string {
  const escolhas = Object.keys(item.escolhas)
    .sort()
    .map((k) => `${k}=${item.escolhas[k]}`)
    .join("&");
  return `${item.produto}?${escolhas}`;
}

/** Link para a página do produto já com as escolhas (só opções que existem nele). */
export function caminhoDoProduto(item: Pick<ItemPedido, "produto" | "escolhas">): string {
  const caminho = `/produto/${item.produto}/`;
  const produto = produtoPorSlug(item.produto);
  if (!produto) return caminho;
  const params = new URLSearchParams();
  for (const opcao of produto.opcoes) {
    const valor = item.escolhas[opcao.id];
    if (valor && opcao.valores.some((v) => v.id === valor)) params.set(opcao.id, valor);
  }
  const busca = params.toString();
  return busca ? `${caminho}?${busca}` : caminho;
}

export function rotuloDoItem(produto: Produto, escolhas: Record<string, string>): string {
  const descricao = descreverEscolhas(produto, escolhas);
  return descricao ? `${produto.nome}, ${descricao}` : produto.nome;
}

/**
 * Devolve um item removido ao mesmo lugar da lista. A lib só sabe acrescentar
 * no fim, então a lista é refeita na ordem certa (mesma variação soma, como
 * no adicionarItem).
 */
export function restaurarItem(item: ItemPedido, indice: number) {
  const atuais = lerItens();
  const posicao = Math.max(0, Math.min(indice, atuais.length));
  const novos = [...atuais.slice(0, posicao), item, ...atuais.slice(posicao)];
  limparPedido();
  for (const i of novos) adicionarItem(i);
}
