/*
 * Funções puras do catálogo e da página do produto (sem React).
 * Servem tanto às páginas (servidor) quanto aos componentes do cliente.
 *
 *   textoPreco(produto.preco)                    "Valor pelo WhatsApp" ou "R$ 89,90"
 *   lerEscolhasDaUrl(produto, location.search)   escolhas da URL, só com ids válidos
 *   caminhoComEscolhas(produto, escolhas, href)  caminho + ?cor-1=...&medida=...
 *   mensagemPedidoDireto(item, observacao)       mensagemProduto + observação
 *   outrosProdutos(produto)                      mesma categoria primeiro
 *   variacoesDaCategoria(slug)                   cores para o lenço que troca de cor
 */

import {
  categoriaPorSlug,
  categorias,
  coresDasEscolhas,
  escolhasPadrao,
  produtos as todosOsProdutos,
  produtosDaCategoria,
  type Categoria,
  type Produto,
} from "../../content/catalogo";
import { mensagemProduto, type ItemPedido } from "../../lib/whatsapp";

// ------------------------------------------------------------------
// Preço
// ------------------------------------------------------------------

export const SEM_PRECO = "Valor pelo WhatsApp";

const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Preço em reais quando o dono confirmou; sem preço, "Valor pelo WhatsApp". */
export function textoPreco(preco?: number): string {
  return typeof preco === "number" && Number.isFinite(preco) && preco > 0 ? formatoReal.format(preco) : SEM_PRECO;
}

// ------------------------------------------------------------------
// Escolhas na URL (?cor-1=azul&medida=especial)
// ------------------------------------------------------------------

function valorExiste(produto: Produto, opcaoId: string, valorId: string | null | undefined): valorId is string {
  if (!valorId) return false;
  const opcao = produto.opcoes.find((o) => o.id === opcaoId);
  return !!opcao && opcao.valores.some((v) => v.id === valorId);
}

/**
 * Lê as escolhas da query da URL. Só aceita opções e valores que existem no
 * produto; o que faltar ou vier errado fica com a escolha padrão.
 */
export function lerEscolhasDaUrl(produto: Produto, busca: string | URLSearchParams): Record<string, string> {
  const params = typeof busca === "string" ? new URLSearchParams(busca) : busca;
  const escolhas = escolhasPadrao(produto);
  for (const opcao of produto.opcoes) {
    const valor = params.get(opcao.id);
    if (valorExiste(produto, opcao.id, valor)) escolhas[opcao.id] = valor;
  }
  return escolhas;
}

/** A URL traz alguma das opções do produto (válida ou não)? */
export function urlTemEscolhas(produto: Produto, busca: string | URLSearchParams): boolean {
  const params = typeof busca === "string" ? new URLSearchParams(busca) : busca;
  return produto.opcoes.some((o) => params.has(o.id));
}

/**
 * Caminho (sem domínio) com as escolhas na query, mantendo os outros
 * parâmetros (ex.: utm_source) e o #âncora.
 */
export function caminhoComEscolhas(produto: Produto, escolhas: Record<string, string>, hrefAtual: string): string {
  const url = new URL(hrefAtual, "https://exemplo.invalid");
  for (const opcao of produto.opcoes) {
    const valor = escolhas[opcao.id];
    if (valorExiste(produto, opcao.id, valor)) url.searchParams.set(opcao.id, valor);
    else url.searchParams.delete(opcao.id);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function mesmasEscolhas(a: Record<string, string>, b: Record<string, string>): boolean {
  const chaves = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const chave of chaves) if (a[chave] !== b[chave]) return false;
  return true;
}

// ------------------------------------------------------------------
// Textos derivados das escolhas
// ------------------------------------------------------------------

function juntar(lista: string[]): string {
  if (lista.length <= 1) return lista[0] ?? "";
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

/** Nomes das cores escolhidas, em minúsculas: "vermelho e azul". */
export function nomesDasCores(produto: Produto, escolhas: Record<string, string>): string {
  const nomes = produto.opcoes
    .filter((o) => o.tipo === "cor")
    .map((o) => o.valores.find((v) => v.id === escolhas[o.id])?.nome)
    .filter((nome): nome is string => Boolean(nome))
    .map((nome) => nome.toLowerCase());
  return juntar(nomes);
}

/** Título acessível do desenho: "Desenho ilustrativo: Lenço carijó duas cores em vermelho e azul". */
export function tituloDoDesenho(produto: Produto, escolhas: Record<string, string> = {}): string {
  const cores = nomesDasCores(produto, escolhas);
  return `Desenho ilustrativo: ${produto.nome}${cores ? ` em ${cores}` : ""}`;
}

/** Primeiro passo do "Como funciona a compra", a partir das opções do produto. */
export function passoEscolha(produto: Produto): string {
  if (produto.opcoes.length === 0) return "Escolha a quantidade e conte o modelo e a cor que procura.";
  return `Escolha ${juntar([...produto.opcoes.map((o) => o.nome.toLowerCase()), "quantidade"])}.`;
}

export const pecas = (n: number) => (n === 1 ? "1 peça" : `${n} peças`);

// ------------------------------------------------------------------
// Mensagens do WhatsApp desta área
// ------------------------------------------------------------------

/**
 * Mensagem do "Pedir agora no WhatsApp": a mensagemProduto de lib/whatsapp,
 * com a observação do cliente dentro do bloco do item (depois da quantidade).
 */
export function mensagemPedidoDireto(item: ItemPedido, observacao?: string): string {
  const texto = mensagemProduto(item);
  const obs = observacao?.replace(/\s+/g, " ").trim();
  if (!obs) return texto;
  const linhas = texto.split("\n");
  const quantidade = linhas.findIndex((l) => l.trim().startsWith("Quantidade:"));
  const posicao = quantidade >= 0 ? quantidade + 1 : Math.max(linhas.length - 2, 0);
  linhas.splice(posicao, 0, `   Observação: ${obs}`);
  return linhas.join("\n");
}

export function mensagemAjudaProduto(produto: Produto): string {
  return `Olá, Republicasul! Estou vendo o ${produto.nome} no site e quero ajuda para escolher.`;
}

export function mensagemCategoria(categoria: Categoria): string {
  return `Olá, Republicasul! Estou vendo a linha ${categoria.nome} no site e não achei a cor ou a medida que procuro. Pode me ajudar?`;
}

export const MENSAGEM_CATALOGO = "Olá, Republicasul! Estou vendo o catálogo no site e não achei o que procuro. Pode me ajudar?";

// ------------------------------------------------------------------
// Listas
// ------------------------------------------------------------------

/** Outros produtos: os da mesma categoria primeiro, depois o resto do catálogo. */
export function outrosProdutos(produto: Produto, limite = 4, lista: Produto[] = todosOsProdutos): Produto[] {
  const outros = lista.filter((p) => p.slug !== produto.slug);
  const mesma = outros.filter((p) => p.categoria === produto.categoria);
  const resto = outros.filter((p) => p.categoria !== produto.categoria);
  return [...mesma, ...resto].slice(0, limite);
}

/** Nome curto da linha para chips: "Lenços tradicionais" vira "Tradicionais". */
export function nomeCurtoDaLinha(categoria: Categoria): string {
  const curto = categoria.nome.replace(/^lenços?\s+/i, "").trim();
  return curto ? curto.charAt(0).toUpperCase() + curto.slice(1) : categoria.nome;
}

/** Categorias que têm produto, na ordem do catálogo. */
export function categoriasComProduto(lista: Produto[] = todosOsProdutos): Categoria[] {
  return categorias.filter((c) => lista.some((p) => p.categoria === c.slug));
}

export type Variacao = { nome: string; titulo: string; cores: string[]; padrao: Produto["padrao"] };

/**
 * Variações de cor para o desenho que troca de cor numa categoria.
 * Produto com opção de cor: percorre as cores que o próprio produto oferece
 * (só valores que existem no catálogo). Sem opção de cor: cada produto entra
 * com as cores do seu desenho.
 */
export function variacoesDaCategoria(slug: string, maximo = 4): Variacao[] {
  const lista = produtosDaCategoria(slug);
  const variacoes: Variacao[] = [];
  for (const produto of lista) {
    const opcoesDeCor = produto.opcoes.filter((o) => o.tipo === "cor");
    if (opcoesDeCor.length === 0) {
      variacoes.push({ nome: produto.nome, titulo: tituloDoDesenho(produto), cores: produto.coresDesenho, padrao: produto.padrao });
      continue;
    }
    const total = Math.min(maximo, ...opcoesDeCor.map((o) => o.valores.length));
    for (let k = 0; k < total; k++) {
      const escolhas = { ...escolhasPadrao(produto) };
      // Cada opção de cor anda com um passo diferente, para não repetir a cor.
      opcoesDeCor.forEach((o, j) => {
        escolhas[o.id] = o.valores[(k + 2 * j) % o.valores.length].id;
      });
      const nomes = nomesDasCores(produto, escolhas);
      variacoes.push({
        nome: nomes ? nomes.charAt(0).toUpperCase() + nomes.slice(1) : produto.nome,
        titulo: tituloDoDesenho(produto, escolhas),
        cores: coresDasEscolhas(produto, escolhas),
        padrao: produto.padrao,
      });
    }
  }
  const categoria = categoriaPorSlug(slug);
  if (variacoes.length === 0 && categoria) {
    variacoes.push({ nome: categoria.nome, titulo: `Desenho ilustrativo: ${categoria.nome}`, cores: [], padrao: categoria.padrao });
  }
  return variacoes.slice(0, Math.max(maximo, lista.length));
}
