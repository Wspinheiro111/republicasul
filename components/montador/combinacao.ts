/*
 * Regras do montador, sem React: os modelos, a troca de modelo e de opção,
 * a leitura e a escrita da combinação na URL.
 *
 *   /montador/?modelo=carijo-duas-cores&cor-1=azul&cor-2=branco&medida=padrao
 *   /montador/?modelo=tradicional&cor=chimango&medida=especial
 *
 * Tudo sai do catálogo: cada modelo aponta para produtos de verdade. O
 * "Tradicional liso" junta os lenços tradicionais, um produto por cor; trocar
 * a cor troca o produto. Os outros modelos usam as opções do próprio produto.
 * O que vem da URL é conferido contra o catálogo; id desconhecido é ignorado.
 */

import {
  cores,
  coresDasEscolhas,
  escolhasPadrao,
  produtoPorSlug,
  produtosDaCategoria,
  type Opcao,
  type Produto,
} from "../../content/catalogo";
import type { ItemPedido } from "../../lib/whatsapp";

export const CAMINHO_MONTADOR = "/montador/";
export const MODELO_TRADICIONAL = "tradicional";
/** Opção de cor do "Tradicional liso" (cada cor é um produto do catálogo). */
export const OPCAO_COR_TRADICIONAL = "cor";

export type Modelo = {
  /** Vai na URL (?modelo=). */
  id: string;
  nome: string;
  resumo: string;
  /** Um produto, ou os lenços tradicionais (um por cor). */
  produtos: Produto[];
};

export type Combinacao = {
  modelo: string;
  /** slug do produto do catálogo */
  produto: string;
  /** escolhas do produto: id da opção -> id do valor (só opções reais do produto) */
  escolhas: Record<string, string>;
};

// ------------------------------------------------------------------
// Nomes
// ------------------------------------------------------------------

/** "a", "a ou b", "a, b ou c" (o primeiro com maiúscula, os outros em minúscula). */
export function juntarNomes(nomes: string[], conector = "ou"): string {
  const lista = nomes.map((n, i) => (i === 0 ? n : n.toLowerCase()));
  if (lista.length <= 1) return lista[0] ?? "";
  return `${lista.slice(0, -1).join(", ")} ${conector} ${lista[lista.length - 1]}`;
}

const nomeDaCor = (hex: string | undefined) =>
  hex ? Object.values(cores).find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.nome : undefined;

/** "maragato" a partir de "lenco-tradicional-maragato". */
export function idCorTradicional(produto: Produto): string {
  return produto.slug.replace(/^lenco-tradicional-/, "");
}

/** "Maragato (vermelho)", "Chimango (branco)", "Azul royal". */
export function nomeCorTradicional(produto: Produto): string {
  const curto = produto.nome.replace(/^Lenço tradicional\s+/i, "");
  const cor = nomeDaCor(produto.coresDesenho[0]);
  return cor && cor.toLowerCase() !== curto.toLowerCase() ? `${curto} (${cor.toLowerCase()})` : curto;
}

// ------------------------------------------------------------------
// Modelos
// ------------------------------------------------------------------

const existe = (p: Produto | undefined): p is Produto => Boolean(p);
const umProduto = (slug: string) => [produtoPorSlug(slug)].filter(existe);

const tradicionais = produtosDaCategoria("lencos-tradicionais").filter((p) => p.padrao === "liso" && p.coresDesenho.length > 0);

const DEFINICOES: Modelo[] = [
  {
    id: MODELO_TRADICIONAL,
    nome: "Tradicional liso",
    resumo: `${juntarNomes(tradicionais.map((p) => p.nome.replace(/^Lenço tradicional\s+/i, "")))}.`,
    produtos: tradicionais,
  },
  {
    id: "carijo-uma-cor",
    nome: "Carijó uma cor",
    resumo: "Fundo claro com o xadrez miúdo de uma cor.",
    produtos: umProduto("lenco-carijo-uma-cor"),
  },
  {
    id: "carijo-duas-cores",
    nome: "Carijó duas cores",
    resumo: "O xadrez carijó cruzando duas cores.",
    produtos: umProduto("lenco-carijo-duas-cores"),
  },
  {
    id: "farroupilha",
    nome: "Farroupilha",
    resumo: "Verde, vermelho e amarelo da bandeira do Rio Grande do Sul.",
    produtos: umProduto("lenco-farroupilha"),
  },
  {
    id: "pala",
    nome: "Pala",
    resumo: "O pala tramado para os dias frios do Sul.",
    produtos: umProduto("pala"),
  },
];

/** Só entra o modelo que tem produto no catálogo. */
export const MODELOS: Modelo[] = DEFINICOES.filter((m) => m.produtos.length > 0);

export function modeloPorId(id: string | null | undefined): Modelo | undefined {
  return id ? MODELOS.find((m) => m.id === id) : undefined;
}

/** Abre no carijó de duas cores (o que mais mostra o montador); sem ele, no primeiro modelo. */
export const MODELO_INICIAL = modeloPorId("carijo-duas-cores")?.id ?? MODELOS[0]?.id ?? "";

// ------------------------------------------------------------------
// Combinação
// ------------------------------------------------------------------

function valorValido(produto: Produto, opcaoId: string, valor: string | null | undefined): valor is string {
  if (!valor) return false;
  const opcao = produto.opcoes.find((o) => o.id === opcaoId);
  return !!opcao && opcao.valores.some((v) => v.id === valor);
}

/** Escolhas padrão do produto, aproveitando as que valem nele (ex.: a medida). */
function escolhasLevando(produto: Produto, levar: Record<string, string>, so?: Opcao["tipo"]): Record<string, string> {
  const escolhas = escolhasPadrao(produto);
  for (const opcao of produto.opcoes) {
    if (so && opcao.tipo !== so) continue;
    if (valorValido(produto, opcao.id, levar[opcao.id])) escolhas[opcao.id] = levar[opcao.id];
  }
  return escolhas;
}

export function combinacaoDoModelo(modeloId: string, produtoSlug?: string): Combinacao | null {
  const modelo = modeloPorId(modeloId);
  if (!modelo) return null;
  const produto = modelo.produtos.find((p) => p.slug === produtoSlug) ?? modelo.produtos[0];
  return { modelo: modelo.id, produto: produto.slug, escolhas: escolhasPadrao(produto) };
}

export function combinacaoInicial(): Combinacao | null {
  return combinacaoDoModelo(MODELO_INICIAL);
}

export function produtoDaCombinacao(c: Combinacao): Produto | undefined {
  return produtoPorSlug(c.produto);
}

/**
 * Troca de modelo. Volta às escolhas que a pessoa já tinha feito naquele
 * modelo (memoria) e leva junto a medida, se ela existir no novo produto.
 */
export function mudarModelo(atual: Combinacao, memoria: Record<string, Combinacao>, modeloId: string): Combinacao {
  if (modeloId === atual.modelo) return atual;
  const destino = memoria[modeloId] ?? combinacaoDoModelo(modeloId);
  const produto = destino ? produtoPorSlug(destino.produto) : undefined;
  if (!destino || !produto) return atual;
  const medida = escolhasLevando(produto, atual.escolhas, "texto");
  const escolhas = { ...destino.escolhas };
  for (const opcao of produto.opcoes) if (opcao.tipo === "texto") escolhas[opcao.id] = medida[opcao.id];
  return { ...destino, escolhas };
}

/** Troca de uma opção. No tradicional, trocar a cor troca o produto. */
export function mudarOpcao(atual: Combinacao, opcaoId: string, valorId: string): Combinacao {
  const modelo = modeloPorId(atual.modelo);
  if (modelo?.id === MODELO_TRADICIONAL && opcaoId === OPCAO_COR_TRADICIONAL) {
    const novo = modelo.produtos.find((p) => idCorTradicional(p) === valorId);
    if (!novo) return atual;
    return { modelo: modelo.id, produto: novo.slug, escolhas: escolhasLevando(novo, atual.escolhas) };
  }
  const produto = produtoPorSlug(atual.produto);
  if (!produto || !valorValido(produto, opcaoId, valorId)) return atual;
  return { ...atual, escolhas: { ...atual.escolhas, [opcaoId]: valorId } };
}

export function mesmasEscolhas(a: Record<string, string>, b: Record<string, string>): boolean {
  const chaves = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const chave of chaves) if (a[chave] !== b[chave]) return false;
  return true;
}

export function mesmaCombinacao(a: Combinacao, b: Combinacao): boolean {
  return a.modelo === b.modelo && a.produto === b.produto && mesmasEscolhas(a.escolhas, b.escolhas);
}

// ------------------------------------------------------------------
// Passos (o que o painel mostra)
// ------------------------------------------------------------------

/** A opção de cor do tradicional: uma bolinha por lenço tradicional. */
export function opcaoCorTradicional(modelo: Modelo): Opcao {
  return {
    id: OPCAO_COR_TRADICIONAL,
    nome: "Cor",
    tipo: "cor",
    valores: modelo.produtos.map((p) => ({ id: idCorTradicional(p), nome: nomeCorTradicional(p), hex: p.coresDesenho[0] })),
  };
}

/** Passo 2 (cores) e passo 3 (medida e outras opções de texto). */
export function opcoesDosPassos(c: Combinacao): { cores: Opcao[]; medidas: Opcao[] } {
  const produto = produtoPorSlug(c.produto);
  const modelo = modeloPorId(c.modelo);
  if (!produto || !modelo) return { cores: [], medidas: [] };
  const doProduto = produto.opcoes.filter((o) => o.tipo === "cor");
  return {
    cores: modelo.id === MODELO_TRADICIONAL ? [opcaoCorTradicional(modelo), ...doProduto] : doProduto,
    medidas: produto.opcoes.filter((o) => o.tipo === "texto"),
  };
}

/** Escolhas no formato do SeletorOpcoes (inclui a cor do tradicional). */
export function escolhasDoSeletor(c: Combinacao): Record<string, string> {
  const produto = produtoPorSlug(c.produto);
  if (c.modelo !== MODELO_TRADICIONAL || !produto) return c.escolhas;
  return { ...c.escolhas, [OPCAO_COR_TRADICIONAL]: idCorTradicional(produto) };
}

export function coresDaCombinacao(c: Combinacao): string[] {
  const produto = produtoPorSlug(c.produto);
  return produto ? coresDasEscolhas(produto, c.escolhas) : [];
}

export function itemDaCombinacao(c: Combinacao, quantidade: number): ItemPedido {
  return { produto: c.produto, escolhas: { ...c.escolhas }, quantidade };
}

/** Título acessível do desenho: "Desenho do lenço carijó duas cores: primeira cor azul, segunda cor branco". */
export function tituloDoDesenho(c: Combinacao): string {
  const produto = produtoPorSlug(c.produto);
  if (!produto) return "Desenho do lenço";
  const coresEscolhidas = produto.opcoes
    .filter((o) => o.tipo === "cor")
    .map((o) => {
      const valor = o.valores.find((v) => v.id === c.escolhas[o.id]);
      return valor ? `${o.nome.toLowerCase()} ${valor.nome.toLowerCase()}` : null;
    })
    .filter(Boolean);
  const base = `Desenho do ${produto.nome.toLowerCase()}`;
  return coresEscolhidas.length ? `${base}: ${coresEscolhidas.join(", ")}` : base;
}

/**
 * A foto real mostra exatamente esta peça? Só quando o produto não tem opção
 * de cor (tradicional de cada cor, farroupilha, pala). No carijó a foto seria
 * de uma cor e a escolha pode ser outra, então vale o desenho.
 */
export function fotoCorresponde(produto: Produto): boolean {
  return produto.fotos.length > 0 && !produto.opcoes.some((o) => o.tipo === "cor");
}

/** Nomes das cores do desenho quando o produto não tem opção de cor (farroupilha, pala). */
export function nomesDasCoresDoDesenho(produto: Produto): string[] {
  return produto.coresDesenho.map(nomeDaCor).filter((n): n is string => Boolean(n));
}

// ------------------------------------------------------------------
// URL
// ------------------------------------------------------------------

/** Todos os parâmetros que o montador usa (para limpar a URL sem perder utm_*). */
export function parametrosDoMontador(): Set<string> {
  const nomes = new Set(["modelo", OPCAO_COR_TRADICIONAL]);
  for (const modelo of MODELOS) for (const p of modelo.produtos) for (const o of p.opcoes) nomes.add(o.id);
  return nomes;
}

export function parametrosDaCombinacao(c: Combinacao): URLSearchParams {
  const params = new URLSearchParams();
  const produto = produtoPorSlug(c.produto);
  params.set("modelo", c.modelo);
  if (!produto) return params;
  if (c.modelo === MODELO_TRADICIONAL) params.set(OPCAO_COR_TRADICIONAL, idCorTradicional(produto));
  for (const opcao of produto.opcoes) {
    const valor = c.escolhas[opcao.id];
    if (valorValido(produto, opcao.id, valor)) params.set(opcao.id, valor);
  }
  return params;
}

/** "/montador/?modelo=...": o link para compartilhar a combinação. */
export function caminhoDaCombinacao(c: Combinacao): string {
  return `${CAMINHO_MONTADOR}?${parametrosDaCombinacao(c).toString()}`;
}

/**
 * Caminho atual com a combinação na query, mantendo os parâmetros que não
 * são do montador (ex.: utm_source) e o #âncora.
 */
export function hrefComCombinacao(c: Combinacao, hrefAtual: string): string {
  const url = new URL(hrefAtual, "https://exemplo.invalid");
  for (const nome of parametrosDoMontador()) url.searchParams.delete(nome);
  for (const [nome, valor] of parametrosDaCombinacao(c)) url.searchParams.set(nome, valor);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Lê a combinação da URL. Devolve null quando não há modelo conhecido.
 * O que vier errado (cor, medida) fica com a escolha padrão.
 */
export function lerCombinacao(busca: string | URLSearchParams): Combinacao | null {
  const params = typeof busca === "string" ? new URLSearchParams(busca) : busca;
  const modelo = modeloPorId(params.get("modelo"));
  if (!modelo) return null;
  let produtoSlug: string | undefined;
  if (modelo.id === MODELO_TRADICIONAL) {
    const cor = params.get(OPCAO_COR_TRADICIONAL);
    const porCor = modelo.produtos.find((p) => idCorTradicional(p) === cor);
    if (porCor) produtoSlug = porCor.slug;
  }
  const base = combinacaoDoModelo(modelo.id, produtoSlug);
  const produto = base ? produtoPorSlug(base.produto) : undefined;
  if (!base || !produto) return null;
  for (const opcao of produto.opcoes) {
    const valor = params.get(opcao.id);
    if (valorValido(produto, opcao.id, valor)) base.escolhas[opcao.id] = valor;
  }
  return base;
}

// ------------------------------------------------------------------
// Texto
// ------------------------------------------------------------------

export const SEM_PRECO = "Valor pelo WhatsApp";

const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Preço só quando o dono confirmou; sem preço, "Valor pelo WhatsApp". */
export function textoPreco(preco?: number): string {
  return typeof preco === "number" && Number.isFinite(preco) && preco > 0 ? formatoReal.format(preco) : SEM_PRECO;
}

export function pecas(n: number): string {
  return n === 1 ? "1 peça" : `${n} peças`;
}
