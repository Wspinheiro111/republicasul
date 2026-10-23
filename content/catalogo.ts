// Catálogo da Republicasul.
//
// Origem dos dados (22/10/2026, site atual inacessível pelo ambiente de build):
// - Categorias: páginas indexadas no Google do site atual (tradicionais,
//   carijó uma cor, carijó duas cores, farroupilha) e o título "lenços e palas".
// - Lenços tradicionais por cor: nomes usados por revendedores para a
//   "Trama Republicasul" (Maragato, Chimango, Azul Royal, Verde Esmeralda).
// - Cores do carijó e medidas: PROVISÓRIAS, marcadas com `aConfirmar`.
// Preços não são publicados: a venda fecha pelo WhatsApp (decisão do dono).
// Fotos: entram em `fotos` quando o dono enviar; até lá o site desenha o lenço.

export type Cor = {
  id: string;
  nome: string;
  hex: string;
};

// Como o lenço é desenhado quando ainda não há foto.
export type Padrao = "liso" | "carijo" | "farroupilha" | "pala";

export type Opcao = {
  id: string;
  nome: string;
  tipo: "cor" | "texto";
  valores: { id: string; nome: string; hex?: string }[];
  // Texto curto mostrado abaixo da opção (ex.: "outras cores sob consulta").
  ajuda?: string;
};

export type Categoria = {
  slug: string;
  nome: string;
  resumo: string;
  descricao: string;
  padrao: Padrao;
};

export type Produto = {
  slug: string;
  nome: string;
  categoria: string;
  resumo: string;
  descricao: string;
  padrao: Padrao;
  // Cores usadas no desenho quando não há escolha do cliente.
  coresDesenho: string[];
  opcoes: Opcao[];
  fotos: string[];
  // Preço em reais; ausente = "valor pelo WhatsApp".
  preco?: number;
  destaque?: boolean;
  // Dados que dependem de confirmação do dono antes de publicar.
  aConfirmar?: string[];
};

export const cores = {
  vermelho: { id: "vermelho", nome: "Vermelho", hex: "#b3121b" },
  branco: { id: "branco", nome: "Branco", hex: "#f3efe6" },
  azulRoyal: { id: "azul-royal", nome: "Azul royal", hex: "#1f3fa6" },
  verdeEsmeralda: { id: "verde-esmeralda", nome: "Verde esmeralda", hex: "#0e7a4e" },
  amarelo: { id: "amarelo", nome: "Amarelo", hex: "#e3b21c" },
  azul: { id: "azul", nome: "Azul", hex: "#2c5aa0" },
  cinza: { id: "cinza", nome: "Cinza", hex: "#8a8d91" },
  marrom: { id: "marrom", nome: "Marrom", hex: "#6b3e23" },
  verde: { id: "verde", nome: "Verde", hex: "#2e7d32" },
  preto: { id: "preto", nome: "Preto", hex: "#1a1a1a" },
} satisfies Record<string, Cor>;

const medida: Opcao = {
  id: "medida",
  nome: "Medida",
  tipo: "texto",
  valores: [
    { id: "padrao", nome: "Medida padrão" },
    { id: "especial", nome: "Medida especial" },
  ],
  ajuda: "Medida especial: diga o tamanho na conversa do WhatsApp.",
};

const coresCarijo = [cores.vermelho, cores.azul, cores.verde, cores.amarelo, cores.marrom, cores.cinza, cores.preto];

const corOpcao = (id: string, nome: string, lista: Cor[], ajuda?: string): Opcao => ({
  id,
  nome,
  tipo: "cor",
  valores: lista.map(({ id, nome, hex }) => ({ id, nome, hex })),
  ajuda,
});

export const categorias: Categoria[] = [
  {
    slug: "lencos-tradicionais",
    nome: "Lenços tradicionais",
    resumo: "A trama Republicasul em cor lisa: maragato, chimango, azul royal e verde esmeralda.",
    descricao:
      "O lenço tradicional de cor única, com a trama que dá nome à casa. É o lenço de todo dia no CTG, no rodeio e no desfile.",
    padrao: "liso",
  },
  {
    slug: "carijo-uma-cor",
    nome: "Lenço carijó uma cor",
    resumo: "Fundo claro com o xadrez miúdo de uma cor.",
    descricao: "O carijó leva o desenho quadriculado tramado no tecido. Nesta linha, o xadrez vem em uma cor só.",
    padrao: "carijo",
  },
  {
    slug: "carijo-duas-cores",
    nome: "Lenço carijó duas cores",
    resumo: "O xadrez carijó combinando duas cores.",
    descricao: "O mesmo carijó, agora com duas cores cruzadas na trama. Você escolhe a combinação.",
    padrao: "carijo",
  },
  {
    slug: "farroupilha",
    nome: "Lenço farroupilha",
    resumo: "As cores da bandeira do Rio Grande do Sul no pescoço.",
    descricao: "Verde, vermelho e amarelo, as cores da bandeira rio-grandense, para a Semana Farroupilha e para o ano inteiro.",
    padrao: "farroupilha",
  },
  {
    slug: "palas",
    nome: "Palas",
    resumo: "O pala tramado para os dias frios do Sul.",
    descricao: "Palas da indumentária gaúcha, tramados artesanalmente. Modelos e cores pelo WhatsApp.",
    padrao: "pala",
  },
];

export const produtos: Produto[] = [
  {
    slug: "lenco-tradicional-maragato",
    nome: "Lenço tradicional Maragato",
    categoria: "lencos-tradicionais",
    resumo: "Vermelho, na trama Republicasul.",
    descricao: "O lenço vermelho, o maragato, tramado na trama Republicasul.",
    padrao: "liso",
    coresDesenho: [cores.vermelho.hex],
    opcoes: [medida],
    fotos: [],
    destaque: true,
    aConfirmar: ["fotos", "medidas"],
  },
  {
    slug: "lenco-tradicional-chimango",
    nome: "Lenço tradicional Chimango",
    categoria: "lencos-tradicionais",
    resumo: "Branco, na trama Republicasul.",
    descricao: "O lenço branco, o chimango, tramado na trama Republicasul.",
    padrao: "liso",
    coresDesenho: [cores.branco.hex],
    opcoes: [medida],
    fotos: [],
    destaque: true,
    aConfirmar: ["fotos", "medidas"],
  },
  {
    slug: "lenco-tradicional-azul-royal",
    nome: "Lenço tradicional Azul royal",
    categoria: "lencos-tradicionais",
    resumo: "Azul royal, na trama Republicasul.",
    descricao: "O lenço tradicional em azul royal, tramado na trama Republicasul.",
    padrao: "liso",
    coresDesenho: [cores.azulRoyal.hex],
    opcoes: [medida],
    fotos: [],
    aConfirmar: ["fotos", "medidas"],
  },
  {
    slug: "lenco-tradicional-verde-esmeralda",
    nome: "Lenço tradicional Verde esmeralda",
    categoria: "lencos-tradicionais",
    resumo: "Verde esmeralda, na trama Republicasul.",
    descricao: "O lenço tradicional em verde esmeralda, tramado na trama Republicasul.",
    padrao: "liso",
    coresDesenho: [cores.verdeEsmeralda.hex],
    opcoes: [medida],
    fotos: [],
    aConfirmar: ["fotos", "medidas"],
  },
  {
    slug: "lenco-carijo-uma-cor",
    nome: "Lenço carijó uma cor",
    categoria: "carijo-uma-cor",
    resumo: "Xadrez carijó em uma cor, você escolhe qual.",
    descricao: "Lenço carijó com o xadrez tramado em uma cor sobre fundo claro.",
    padrao: "carijo",
    coresDesenho: [cores.vermelho.hex, cores.branco.hex],
    opcoes: [corOpcao("cor", "Cor do xadrez", coresCarijo, "Outras cores sob consulta."), medida],
    fotos: [],
    destaque: true,
    aConfirmar: ["fotos", "cores", "medidas"],
  },
  {
    slug: "lenco-carijo-duas-cores",
    nome: "Lenço carijó duas cores",
    categoria: "carijo-duas-cores",
    resumo: "Xadrez carijó cruzando duas cores.",
    descricao: "Lenço carijó com duas cores cruzadas na trama. Escolha a primeira e a segunda cor.",
    padrao: "carijo",
    coresDesenho: [cores.vermelho.hex, cores.verde.hex],
    opcoes: [
      corOpcao("cor-1", "Primeira cor", coresCarijo),
      corOpcao("cor-2", "Segunda cor", [...coresCarijo, cores.branco], "Outras combinações sob consulta."),
      medida,
    ],
    fotos: [],
    destaque: true,
    aConfirmar: ["fotos", "cores", "medidas"],
  },
  {
    slug: "lenco-farroupilha",
    nome: "Lenço farroupilha",
    categoria: "farroupilha",
    resumo: "Verde, vermelho e amarelo da bandeira rio-grandense.",
    descricao: "O lenço com as cores da bandeira do Rio Grande do Sul.",
    padrao: "farroupilha",
    coresDesenho: [cores.verde.hex, cores.vermelho.hex, cores.amarelo.hex],
    opcoes: [medida],
    fotos: [],
    destaque: true,
    aConfirmar: ["fotos", "desenho", "medidas"],
  },
  {
    slug: "pala",
    nome: "Pala",
    categoria: "palas",
    resumo: "Pala tramado artesanalmente. Modelos e cores pelo WhatsApp.",
    descricao: "Pala da indumentária gaúcha, tramado artesanalmente. Conte na conversa o modelo e a cor que procura.",
    padrao: "pala",
    coresDesenho: [cores.marrom.hex, cores.branco.hex],
    opcoes: [],
    fotos: [],
    aConfirmar: ["fotos", "modelos", "cores", "medidas"],
  },
];

export function categoriaPorSlug(slug: string) {
  return categorias.find((c) => c.slug === slug);
}

export function produtoPorSlug(slug: string) {
  return produtos.find((p) => p.slug === slug);
}

export function produtosDaCategoria(slug: string) {
  return produtos.filter((p) => p.categoria === slug);
}

// Escolha inicial: o primeiro valor de cada opção.
export function escolhasPadrao(produto: Produto): Record<string, string> {
  return Object.fromEntries(produto.opcoes.map((o) => [o.id, o.valores[0]?.id ?? ""]));
}

// Cores do desenho a partir das escolhas do cliente (opções de cor, em ordem),
// completando com as cores padrão do produto.
export function coresDasEscolhas(produto: Produto, escolhas: Record<string, string>): string[] {
  const escolhidas = produto.opcoes
    .filter((o) => o.tipo === "cor")
    .map((o) => o.valores.find((v) => v.id === escolhas[o.id])?.hex)
    .filter((hex): hex is string => Boolean(hex));
  if (escolhidas.length === 0) return produto.coresDesenho;
  // Carijó de uma cor: o fundo continua claro.
  if (produto.padrao === "carijo" && escolhidas.length === 1) return [escolhidas[0], cores.branco.hex];
  return escolhidas;
}
