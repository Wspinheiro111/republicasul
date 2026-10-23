// Itens de navegação do site, compartilhados pelo cabeçalho e pelo rodapé.
// `ativo` diz quais caminhos acendem o link (ex.: produto acende "Lenços").

export type ItemNavegacao = {
  nome: string;
  href: string;
  ativo: string[];
};

export const navegacao: ItemNavegacao[] = [
  { nome: "Lenços", href: "/catalogo/", ativo: ["/catalogo", "/produto"] },
  { nome: "Monte o seu", href: "/montador/", ativo: ["/montador"] },
  { nome: "Guia do lenço", href: "/guia-do-lenco/", ativo: ["/guia-do-lenco"] },
  { nome: "Lojistas", href: "/lojistas/", ativo: ["/lojistas"] },
  { nome: "Sobre", href: "/sobre/", ativo: ["/sobre"] },
];

// "/pedido/" e "/pedido" viram "/pedido"; a raiz continua "/".
export function normalizarCaminho(caminho: string | null | undefined): string {
  if (!caminho) return "/";
  const limpo = caminho.replace(/\/+$/, "");
  return limpo === "" ? "/" : limpo;
}

export function itemAtivo(item: ItemNavegacao, caminho: string | null | undefined): boolean {
  const atual = normalizarCaminho(caminho);
  return item.ativo.some((prefixo) => atual === prefixo || atual.startsWith(`${prefixo}/`));
}

// Mensagem genérica do WhatsApp (barra do celular, rodapé, cabeçalho).
export const MENSAGEM_GERAL = "Olá, Republicasul! Vim pelo site e quero ajuda para escolher um lenço.";
