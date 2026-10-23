"use client";

// Lista de pedido do visitante. Não é carrinho de compra: guarda os lenços
// escolhidos (com as variações) para enviar tudo de uma vez pelo WhatsApp.
// Fica só no navegador do visitante (localStorage) e funciona mesmo quando
// o armazenamento está bloqueado (modo anônimo), apenas sem lembrar depois.

import { useSyncExternalStore } from "react";
import { produtoPorSlug } from "../content/catalogo";
import type { ItemPedido } from "./whatsapp";

const CHAVE = "republicasul:pedido:v1";
export const QUANTIDADE_MAXIMA = 99;

let itens: ItemPedido[] = [];
let carregado = false;
const ouvintes = new Set<() => void>();
const VAZIO: ItemPedido[] = [];

function mesmaVariacao(a: ItemPedido, b: Pick<ItemPedido, "produto" | "escolhas">): boolean {
  if (a.produto !== b.produto) return false;
  const chaves = new Set([...Object.keys(a.escolhas), ...Object.keys(b.escolhas)]);
  for (const chave of chaves) if (a.escolhas[chave] !== b.escolhas[chave]) return false;
  return true;
}

function limitar(qtd: number): number {
  if (!Number.isFinite(qtd)) return 1;
  return Math.max(1, Math.min(QUANTIDADE_MAXIMA, Math.round(qtd)));
}

function valido(item: unknown): item is ItemPedido {
  if (!item || typeof item !== "object") return false;
  const i = item as ItemPedido;
  return typeof i.produto === "string" && !!produtoPorSlug(i.produto) && typeof i.escolhas === "object" && i.escolhas !== null && typeof i.quantidade === "number";
}

function carregar() {
  if (carregado || typeof window === "undefined") return;
  carregado = true;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const lidos = bruto ? (JSON.parse(bruto) as unknown) : [];
    itens = Array.isArray(lidos) ? lidos.filter(valido).map((i) => ({ ...i, quantidade: limitar(i.quantidade) })) : [];
  } catch {
    itens = [];
  }
}

function salvarEAvisar() {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    // Armazenamento indisponível: a lista vale só para esta visita.
  }
  ouvintes.forEach((ouvir) => ouvir());
}

export function lerItens(): ItemPedido[] {
  carregar();
  return itens;
}

export function adicionarItem(novo: ItemPedido) {
  carregar();
  const existente = itens.find((i) => mesmaVariacao(i, novo));
  itens = existente
    ? itens.map((i) => (i === existente ? { ...i, quantidade: limitar(i.quantidade + novo.quantidade) } : i))
    : [...itens, { ...novo, escolhas: { ...novo.escolhas }, quantidade: limitar(novo.quantidade) }];
  salvarEAvisar();
}

export function alterarQuantidade(indice: number, quantidade: number) {
  carregar();
  itens = itens.map((i, n) => (n === indice ? { ...i, quantidade: limitar(quantidade) } : i));
  salvarEAvisar();
}

export function removerItem(indice: number) {
  carregar();
  itens = itens.filter((_, n) => n !== indice);
  salvarEAvisar();
}

export function limparPedido() {
  carregar();
  itens = [];
  salvarEAvisar();
}

function assinar(ouvir: () => void) {
  ouvintes.add(ouvir);
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key !== CHAVE) return;
    carregado = false;
    carregar();
    ouvir();
  };
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    ouvintes.delete(ouvir);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

// Hook para componentes: devolve os itens e re-renderiza a cada mudança.
// No servidor (export estático) a lista começa vazia.
export function usePedido(): ItemPedido[] {
  return useSyncExternalStore(assinar, lerItens, () => VAZIO);
}

export function totalDePecas(lista: ItemPedido[]): number {
  return lista.reduce((soma, i) => soma + i.quantidade, 0);
}

// Só para testes: volta ao estado inicial.
export function __reiniciarPedido() {
  itens = [];
  carregado = false;
}
