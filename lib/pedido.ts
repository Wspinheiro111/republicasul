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

// ------------------------------------------------------------------
// Anotações por peça
// ------------------------------------------------------------------
// O pala não tem cor nem medida para escolher no site: o que o cliente
// escreve em "Conte o que procura" é o que diz qual pala ele quer. A lista
// guarda só produto, escolhas e quantidade (ItemPedido), então esse texto
// fica numa chave à parte, por produto. A página "Seu pedido" o mostra junto
// do item e o manda dentro dele na mensagem (useObservacoes acompanha também
// o que muda em outra aba). Como a lista, vale só neste navegador e funciona
// com o armazenamento bloqueado (só não lembra depois).

const CHAVE_OBSERVACOES = "republicasul:observacoes:v1";
const LIMITE_TEXTO_ANOTACAO = 400;
const LIMITE_ANOTACOES_POR_PECA = 10;

const SEM_ANOTACOES: Record<string, string[]> = {};

let anotacoes: Record<string, string[]> = SEM_ANOTACOES;
let anotacoesCarregadas = false;
let ouvindoOutrasAbas = false;
const ouvintesAnotacoes = new Set<() => void>();

/** A mudança veio das anotações (ou do armazenamento todo limpo) em outra aba? */
const mudouAnotacoes = (e: StorageEvent) => e.key === CHAVE_OBSERVACOES || e.key === null;

function carregarAnotacoes() {
  if (typeof window === "undefined") return;
  if (!ouvindoOutrasAbas) {
    ouvindoOutrasAbas = true;
    // Outra aba mexeu nas anotações: a próxima leitura busca de novo, para
    // esta aba não mostrar nem gravar por cima uma cópia velha.
    window.addEventListener("storage", (e) => {
      if (mudouAnotacoes(e)) anotacoesCarregadas = false;
    });
  }
  if (anotacoesCarregadas) return;
  anotacoesCarregadas = true;
  try {
    const bruto = window.localStorage.getItem(CHAVE_OBSERVACOES);
    const lidas = bruto ? (JSON.parse(bruto) as unknown) : {};
    anotacoes = {};
    if (lidas && typeof lidas === "object" && !Array.isArray(lidas)) {
      for (const [produto, textos] of Object.entries(lidas as Record<string, unknown>)) {
        if (!produtoPorSlug(produto) || !Array.isArray(textos)) continue;
        const validos = textos.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
        if (validos.length) anotacoes[produto] = validos.slice(-LIMITE_ANOTACOES_POR_PECA);
      }
    }
  } catch {
    anotacoes = {};
  }
}

function salvarAnotacoes() {
  try {
    window.localStorage.setItem(CHAVE_OBSERVACOES, JSON.stringify(anotacoes));
  } catch {
    // Armazenamento indisponível: a anotação vale só para esta visita.
  }
  ouvintesAnotacoes.forEach((ouvir) => ouvir());
}

/**
 * Guarda o que o cliente escreveu sobre uma peça ao adicioná-la à lista.
 * Texto vazio não guarda nada; o mesmo texto não entra duas vezes.
 */
export function anotarObservacao(produto: string, texto: string) {
  const limpo = texto.replace(/\s+/g, " ").trim().slice(0, LIMITE_TEXTO_ANOTACAO);
  if (!limpo || !produtoPorSlug(produto)) return;
  carregarAnotacoes();
  const atuais = anotacoes[produto] ?? [];
  if (atuais.some((t) => t.toLowerCase() === limpo.toLowerCase())) return;
  anotacoes = { ...anotacoes, [produto]: [...atuais, limpo].slice(-LIMITE_ANOTACOES_POR_PECA) };
  salvarAnotacoes();
}

/** As anotações guardadas, por produto (slug), na ordem em que foram feitas. */
export function lerObservacoes(): Record<string, string[]> {
  carregarAnotacoes();
  return anotacoes;
}

function assinarAnotacoes(ouvir: () => void) {
  carregarAnotacoes();
  ouvintesAnotacoes.add(ouvir);
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (!mudouAnotacoes(e)) return;
    anotacoesCarregadas = false;
    ouvir();
  };
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    ouvintesAnotacoes.delete(ouvir);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

// Hook para componentes: as anotações por produto, re-renderizando a cada
// mudança (desta aba ou de outra). No servidor, nenhuma.
export function useObservacoes(): Record<string, string[]> {
  return useSyncExternalStore(assinarAnotacoes, lerObservacoes, () => SEM_ANOTACOES);
}

/** Apaga as anotações de uma peça, ou todas quando não recebe produto. */
export function esquecerObservacoes(produto?: string) {
  carregarAnotacoes();
  if (produto === undefined) anotacoes = {};
  else if (anotacoes[produto]) {
    const resto = { ...anotacoes };
    delete resto[produto];
    anotacoes = resto;
  } else return;
  salvarAnotacoes();
}

/** Apaga uma só anotação de uma peça (a que o cliente tirou na lista). */
export function esquecerObservacao(produto: string, texto: string) {
  carregarAnotacoes();
  const atuais = anotacoes[produto];
  if (!atuais?.includes(texto)) return;
  const resto = { ...anotacoes, [produto]: atuais.filter((t) => t !== texto) };
  if (!resto[produto].length) delete resto[produto];
  anotacoes = resto;
  salvarAnotacoes();
}

// Só para testes: volta ao estado inicial das anotações.
export function __reiniciarObservacoes() {
  anotacoes = SEM_ANOTACOES;
  anotacoesCarregadas = false;
}
