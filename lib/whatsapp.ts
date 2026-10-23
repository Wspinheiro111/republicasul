// Monta as mensagens e os links do WhatsApp. A venda da Republicasul fecha
// na conversa, então a mensagem precisa chegar com o pedido já organizado:
// produto, cada variação escolhida e a quantidade.

import { contato } from "../content/site";
import { produtoPorSlug, type Produto } from "../content/catalogo";

export type ItemPedido = {
  produto: string; // slug
  escolhas: Record<string, string>; // id da opção -> id do valor
  quantidade: number;
};

export type DadosCliente = {
  nome?: string;
  cidade?: string;
  observacao?: string;
};

export function linkWhatsApp(texto: string, numero: string = contato.whatsapp): string {
  const digitos = numero.replace(/\D/g, "");
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`;
}

// "Medida: Medida padrão · Primeira cor: Vermelho"
export function descreverEscolhas(produto: Produto, escolhas: Record<string, string>): string {
  return produto.opcoes
    .map((opcao) => {
      const valor = opcao.valores.find((v) => v.id === escolhas[opcao.id]);
      return valor ? `${opcao.nome}: ${valor.nome}` : null;
    })
    .filter(Boolean)
    .join(" · ");
}

// nota: o que o cliente escreveu sobre a peça (o "Conte o que procura" do pala).
function linhaItem(item: ItemPedido, indice: number, nota?: string[]): string[] {
  const produto = produtoPorSlug(item.produto);
  if (!produto) return [];
  const linhas = [`${indice}) ${produto.nome}`];
  const escolhas = descreverEscolhas(produto, item.escolhas);
  if (escolhas) linhas.push(`   ${escolhas}`);
  linhas.push(`   Quantidade: ${item.quantidade}`);
  if (nota?.length) linhas.push(`   Observação: ${nota.join("; ")}`);
  return linhas;
}

function linhasCliente(cliente?: DadosCliente): string[] {
  if (!cliente) return [];
  const linhas: string[] = [];
  if (cliente.nome?.trim()) linhas.push(`Nome: ${cliente.nome.trim()}`);
  if (cliente.cidade?.trim()) linhas.push(`Cidade: ${cliente.cidade.trim()}`);
  if (cliente.observacao?.trim()) linhas.push(`Observação: ${cliente.observacao.trim()}`);
  return linhas.length ? ["", ...linhas] : [];
}

// Pedido direto de um produto (botão "Pedir no WhatsApp" na página do produto).
// O pala não é lenço: a mensagem fala "este pala".
export function mensagemProduto(item: ItemPedido): string {
  const peca = produtoPorSlug(item.produto)?.padrao === "pala" ? "este pala" : "este lenço";
  return [
    `Olá, Republicasul! Vi no site e quero ${peca}:`,
    "",
    ...linhaItem(item, 1),
    "",
    "Pode me passar o valor, o prazo e o frete?",
  ].join("\n");
}

// Pedido com vários itens (página "Seu pedido"). anotacoes: o que o cliente
// escreveu por produto (lib/pedido), que vai dentro do item.
export function mensagemPedido(itens: ItemPedido[], cliente?: DadosCliente, anotacoes?: Record<string, string[]>): string {
  const validos = itens.filter((i) => produtoPorSlug(i.produto) && i.quantidade > 0);
  const corpo = validos.flatMap((item, i) => linhaItem(item, i + 1, anotacoes?.[item.produto]));
  const total = validos.reduce((soma, i) => soma + i.quantidade, 0);
  return [
    "Olá, Republicasul! Montei este pedido no site:",
    "",
    ...corpo,
    "",
    `Total de peças: ${total}`,
    ...linhasCliente(cliente),
    "",
    "Pode me passar o valor, o prazo e o frete?",
  ].join("\n");
}

export type DadosLojista = {
  loja: string;
  cnpj?: string;
  cidade: string;
  responsavel?: string;
  interesse?: string;
};

export function mensagemLojista(dados: DadosLojista): string {
  const linhas = [
    "Olá, Republicasul! Tenho uma loja e quero revender os lenços.",
    "",
    `Loja: ${dados.loja.trim()}`,
  ];
  if (dados.cnpj?.trim()) linhas.push(`CNPJ: ${dados.cnpj.trim()}`);
  linhas.push(`Cidade: ${dados.cidade.trim()}`);
  if (dados.responsavel?.trim()) linhas.push(`Responsável: ${dados.responsavel.trim()}`);
  if (dados.interesse?.trim()) linhas.push(`Interesse: ${dados.interesse.trim()}`);
  linhas.push("", "Pode me enviar as condições para lojistas?");
  return linhas.join("\n");
}

export function numeroLojistas(): string {
  return contato.whatsappLojistas || contato.whatsapp;
}
