import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/montador/",
}));

import PaginaMontador, { metadata as metadadosMontador } from "../app/montador/page";
import PaginaPedido, { metadata as metadadosPedido } from "../app/pedido/page";
import {
  caminhoDaCombinacao,
  combinacaoDoModelo,
  hrefComCombinacao,
  lerCombinacao,
  MODELOS,
  mudarModelo,
  mudarOpcao,
  parametrosDaCombinacao,
  textoPreco,
} from "../components/montador/combinacao";
import Montador from "../components/montador/Montador";
import { caminhoDoProduto, restaurarItem } from "../components/pedido/funcoes";
import ListaPedido, { TEMPO_DESFAZER } from "../components/pedido/ListaPedido";
import { escolhasPadrao, produtoPorSlug } from "../content/catalogo";
import { contato } from "../content/site";
import { __reiniciarObservacoes, __reiniciarPedido, adicionarItem, anotarObservacao, lerItens, lerObservacoes } from "../lib/pedido";
import { mensagemPedido, mensagemProduto } from "../lib/whatsapp";

const carijoUma = produtoPorSlug("lenco-carijo-uma-cor")!;
const carijoDuas = produtoPorSlug("lenco-carijo-duas-cores")!;
const maragato = produtoPorSlug("lenco-tradicional-maragato")!;

function irPara(caminho: string) {
  window.history.replaceState(null, "", caminho);
}

/** Texto da mensagem que um link do WhatsApp leva. */
function mensagemDoLink(link: HTMLElement): string {
  return new URL(link.getAttribute("href")!).searchParams.get("text") ?? "";
}

function linkWhats(origem: string): HTMLAnchorElement {
  const link = document.querySelector<HTMLAnchorElement>(`a[data-origem="${origem}"]`);
  if (!link) throw new Error(`Sem link do WhatsApp com origem ${origem}`);
  return link;
}

function clicarSemNavegar(link: HTMLElement) {
  link.addEventListener("click", (e) => e.preventDefault(), { once: true });
  fireEvent.click(link);
}

const ficha = () => screen.getByTestId("ficha");

// No build (trailingSlash) o next/link mantém a barra no fim; no Vitest ele tira.
const hrefSemBarra = (el: Element) => (el.getAttribute("href") ?? "").replace(/\/(?=\?|$)/, "");

beforeEach(() => {
  window.localStorage.clear();
  __reiniciarPedido();
  __reiniciarObservacoes();
  irPara("/montador/");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete window.gtag;
});

// ------------------------------------------------------------------
// Regras do montador (sem tela)
// ------------------------------------------------------------------

describe("combinação do montador", () => {
  it("tem os cinco modelos, cada um ligado a produtos do catálogo", () => {
    expect(MODELOS.map((m) => m.id)).toEqual(["tradicional", "carijo-uma-cor", "carijo-duas-cores", "farroupilha", "pala"]);
    for (const modelo of MODELOS) {
      expect(modelo.produtos.length).toBeGreaterThan(0);
      for (const p of modelo.produtos) expect(produtoPorSlug(p.slug)).toBe(p);
    }
    expect(MODELOS[0].produtos.map((p) => p.slug)).toEqual([
      "lenco-tradicional-maragato",
      "lenco-tradicional-chimango",
      "lenco-tradicional-azul-royal",
      "lenco-tradicional-verde-esmeralda",
    ]);
  });

  it("o link de cada combinação volta para a mesma combinação", () => {
    for (const modelo of MODELOS) {
      for (const produto of modelo.produtos) {
        const c = combinacaoDoModelo(modelo.id, produto.slug)!;
        expect(lerCombinacao(parametrosDaCombinacao(c))).toEqual(c);
        expect(caminhoDaCombinacao(c).startsWith("/montador/?modelo=")).toBe(true);
      }
    }
  });

  it("lê a URL só com ids que existem; o resto fica no padrão", () => {
    expect(lerCombinacao("")).toBeNull();
    expect(lerCombinacao("?modelo=inventado")).toBeNull();
    expect(lerCombinacao("?produto=lenco-farroupilha")).toBeNull();

    const c = lerCombinacao("?modelo=carijo-duas-cores&cor-1=amarelo&cor-2=roxo&medida=gigante")!;
    expect(c.produto).toBe(carijoDuas.slug);
    expect(c.escolhas).toEqual({ ...escolhasPadrao(carijoDuas), "cor-1": "amarelo" });

    expect(lerCombinacao("?modelo=tradicional&cor=chimango&medida=especial")).toEqual({
      modelo: "tradicional",
      produto: "lenco-tradicional-chimango",
      escolhas: { medida: "especial" },
    });
    // Cor de tradicional que não existe: primeiro tradicional.
    expect(lerCombinacao("?modelo=tradicional&cor=rosa")?.produto).toBe("lenco-tradicional-maragato");
  });

  it("as duas cores do carijó nunca ficam iguais (link e troca de cor)", () => {
    const c = lerCombinacao("?modelo=carijo-duas-cores&cor-1=azul&cor-2=azul")!;
    expect(c.escolhas["cor-1"]).toBe("azul");
    expect(c.escolhas["cor-2"]).not.toBe("azul");

    const inicio = combinacaoDoModelo("carijo-duas-cores")!;
    const igual = mudarOpcao(inicio, "cor-2", inicio.escolhas["cor-1"]);
    expect(igual.escolhas["cor-2"]).toBe(inicio.escolhas["cor-1"]);
    expect(igual.escolhas["cor-1"]).not.toBe(inicio.escolhas["cor-1"]);
  });

  it("no tradicional, trocar a cor troca o produto e mantém a medida", () => {
    let c = combinacaoDoModelo("tradicional")!;
    c = mudarOpcao(c, "medida", "especial");
    c = mudarOpcao(c, "cor", "verde-esmeralda");
    expect(c).toEqual({ modelo: "tradicional", produto: "lenco-tradicional-verde-esmeralda", escolhas: { medida: "especial" } });
    // Valor desconhecido não muda nada.
    expect(mudarOpcao(c, "cor", "roxo")).toBe(c);
    expect(mudarOpcao(c, "medida", "gigante")).toBe(c);
  });

  it("trocar de modelo lembra as cores daquele modelo e leva a medida junto", () => {
    let carijo = mudarOpcao(combinacaoDoModelo("carijo-uma-cor")!, "cor", "verde");
    const memoria = { "carijo-uma-cor": carijo };
    const tradicional = mudarOpcao(mudarModelo(carijo, memoria, "tradicional"), "medida", "especial");
    carijo = mudarModelo(tradicional, memoria, "carijo-uma-cor");
    expect(carijo.escolhas).toEqual({ cor: "verde", medida: "especial" });
  });

  it("mantém parâmetros de fora (utm) ao escrever a combinação na URL", () => {
    const c = combinacaoDoModelo("farroupilha")!;
    expect(hrefComCombinacao(c, "/montador/?utm_source=insta&cor-1=azul#topo")).toBe(
      "/montador/?utm_source=insta&modelo=farroupilha&medida=padrao#topo",
    );
  });

  it("sem preço confirmado, diz Valor pelo WhatsApp", () => {
    expect(textoPreco(undefined)).toBe("Valor pelo WhatsApp");
    expect(textoPreco(0)).toBe("Valor pelo WhatsApp");
  });
});

// ------------------------------------------------------------------
// Tela do montador
// ------------------------------------------------------------------

describe("Montador", () => {
  const renderizar = () => render(<Montador topo={<h1>Monte o seu lenço</h1>} />);

  it("abre no carijó duas cores, com a ficha e a mensagem do WhatsApp prontas", () => {
    renderizar();
    expect(screen.getByRole("radio", { name: "Carijó duas cores" })).toBeChecked();
    expect(ficha()).toHaveTextContent("Lenço carijó duas cores");
    expect(ficha()).toHaveTextContent("Primeira cor: Vermelho");
    expect(ficha()).toHaveTextContent("Quantidade: 1");
    const link = linkWhats("montador");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(mensagemDoLink(link)).toBe(
      mensagemProduto({ produto: carijoDuas.slug, escolhas: escolhasPadrao(carijoDuas), quantidade: 1 }),
    );
    expect(screen.getByTestId("preco-montador")).toHaveTextContent("Valor pelo WhatsApp");
    // Sem o número da loja, nada de prometer a resposta da Republicasul.
    expect(screen.getByText(contato.whatsapp ? /A Republicasul responde/ : "Valor, prazo e entrega você combina na conversa.")).toBeInTheDocument();
  });

  it("trocar modelo e cores muda o produto, a ficha e a mensagem", () => {
    renderizar();
    fireEvent.click(screen.getByRole("radio", { name: "Carijó uma cor" }));
    fireEvent.click(screen.getByRole("radio", { name: "Verde" }));
    fireEvent.click(screen.getByRole("radio", { name: "Medida especial" }));
    expect(ficha()).toHaveTextContent("Lenço carijó uma cor");
    expect(ficha()).toHaveTextContent("Cor do xadrez: Verde");
    expect(mensagemDoLink(linkWhats("montador"))).toContain("Cor do xadrez: Verde · Medida: Medida especial");
    expect(screen.getByRole("img", { name: /Desenho do lenço carijó uma cor: cor do xadrez verde/ })).toBeInTheDocument();
    // A combinação vai para a URL.
    expect(window.location.search).toBe("?modelo=carijo-uma-cor&cor=verde&medida=especial");

    // Tradicional liso: a cor troca o produto; a medida vem junto.
    fireEvent.click(screen.getByRole("radio", { name: "Tradicional liso" }));
    fireEvent.click(screen.getByRole("radio", { name: "Chimango (branco)" }));
    expect(ficha()).toHaveTextContent("Lenço tradicional Chimango");
    expect(ficha()).toHaveTextContent("Medida: Medida especial");
    const mensagem = mensagemDoLink(linkWhats("montador"));
    expect(mensagem).toContain("1) Lenço tradicional Chimango");
    expect(linkWhats("montador")).toHaveAttribute("data-origem", "montador");

    // Voltar ao carijó lembra a cor escolhida antes.
    fireEvent.click(screen.getByRole("radio", { name: "Carijó uma cor" }));
    expect(ficha()).toHaveTextContent("Cor do xadrez: Verde");
  });

  it("farroupilha mostra as cores da bandeira; pala fica só com a quantidade", () => {
    renderizar();
    fireEvent.click(screen.getByRole("radio", { name: "Farroupilha" }));
    expect(screen.getByTestId("cores-fixas")).toHaveTextContent("verde, vermelho e amarelo");
    fireEvent.click(screen.getByRole("radio", { name: "Pala" }));
    expect(screen.getByRole("heading", { name: "Passo 3: Quantidade" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Medida padrão" })).toBeNull();
    expect(mensagemDoLink(linkWhats("montador"))).toContain("1) Pala");
  });

  it("lê a combinação da URL ao abrir, ignora o que não existe e arruma o link", async () => {
    irPara("/montador/?modelo=carijo-duas-cores&cor-1=amarelo&cor-2=roxo&medida=especial&utm_source=insta");
    renderizar();
    await waitFor(() => expect(ficha()).toHaveTextContent("Primeira cor: Amarelo"));
    expect(ficha()).toHaveTextContent("Segunda cor: Azul");
    expect(ficha()).toHaveTextContent("Medida: Medida especial");
    expect(window.location.search).toBe("?utm_source=insta&modelo=carijo-duas-cores&cor-1=amarelo&cor-2=azul&medida=especial");
  });

  it("adiciona a combinação ao pedido com a quantidade", () => {
    window.gtag = vi.fn();
    renderizar();
    fireEvent.click(screen.getByRole("radio", { name: "Farroupilha" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(lerItens()).toEqual([{ produto: "lenco-farroupilha", escolhas: { medida: "padrao" }, quantidade: 2 }]);
    expect(screen.getByText("Adicionado ao seu pedido.")).toBeInTheDocument();
    expect(hrefSemBarra(screen.getByRole("link", { name: "Ver seu pedido" }))).toBe("/pedido");

    // O clique no WhatsApp é medido com a origem e o produto.
    clicarSemNavegar(linkWhats("montador"));
    expect(window.gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "montador", produto: "lenco-farroupilha" });
  });

  it("copia o link da combinação", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderizar();
    fireEvent.click(screen.getByRole("radio", { name: "Carijó uma cor" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar link desta combinação" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Link copiado" })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(new URL("/montador/?modelo=carijo-uma-cor&cor=vermelho&medida=padrao", window.location.href).toString());
    expect(screen.getByText("Link copiado.")).toBeInTheDocument();
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
  });

  it("sem área de transferência, mostra o link selecionado para copiar", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const original = document.execCommand;
    document.execCommand = vi.fn(() => false);
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Copiar link desta combinação" }));
    const campo = await screen.findByLabelText<HTMLInputElement>("Link desta combinação");
    expect(campo.value).toBe(new URL(caminhoDaCombinacao(combinacaoDoModelo("carijo-duas-cores")!), window.location.href).toString());
    expect(campo).toHaveFocus();
    expect(screen.getByText(/O link está selecionado/)).toBeInTheDocument();
    document.execCommand = original;
  });
});

// ------------------------------------------------------------------
// Página "Seu pedido"
// ------------------------------------------------------------------

describe("ListaPedido", () => {
  const encher = () => {
    adicionarItem({ produto: carijoUma.slug, escolhas: { cor: "azul", medida: "padrao" }, quantidade: 2 });
    adicionarItem({ produto: maragato.slug, escolhas: { medida: "especial" }, quantidade: 1 });
  };
  const itensNaTela = () => screen.getAllByRole("listitem").filter((li) => li.hasAttribute("data-chave"));

  it("lista vazia: desenho, recado e caminhos para o catálogo e o montador", () => {
    render(<ListaPedido />);
    expect(screen.getByRole("heading", { name: "Sua lista está vazia" })).toBeInTheDocument();
    expect(hrefSemBarra(screen.getByRole("link", { name: "Ver os lenços" }))).toBe("/catalogo");
    expect(hrefSemBarra(screen.getByRole("link", { name: "Monte o seu lenço" }))).toBe("/montador");
    expect(screen.queryByText("Enviar pedido pelo WhatsApp")).toBeNull();
  });

  it("no servidor sai um estado de carregamento neutro (a lista é do navegador)", () => {
    encher();
    const html = renderToString(<ListaPedido />);
    expect(html).toContain("pedido-carregando");
    expect(html).not.toContain("Sua lista está vazia");
    expect(html).not.toContain("Lenço carijó uma cor");
  });

  it("mostra os itens com escolhas, quantidade e link para o produto", () => {
    encher();
    render(<ListaPedido />);
    const [primeiro, segundo] = itensNaTela();
    expect(within(primeiro).getByRole("heading", { level: 3 })).toHaveTextContent("Item 1: Lenço carijó uma cor");
    expect(primeiro).toHaveTextContent("Cor do xadrez: Azul");
    expect(hrefSemBarra(within(primeiro).getByRole("link", { name: "Lenço carijó uma cor" }))).toBe(
      "/produto/lenco-carijo-uma-cor?cor=azul&medida=padrao",
    );
    expect(within(primeiro).getByRole("heading", { level: 3, name: "Item 1: Lenço carijó uma cor" })).toBeInTheDocument();
    expect(within(primeiro).getByRole("button", { name: "Remover Lenço carijó uma cor, Cor do xadrez: Azul · Medida: Medida padrão" })).toBeInTheDocument();
    expect(within(primeiro).getByRole("spinbutton")).toHaveValue(2);
    expect(segundo).toHaveTextContent("Lenço tradicional Maragato");
    expect(segundo).toHaveTextContent("Medida: Medida especial");
    expect(screen.getByTestId("total-pecas")).toHaveTextContent("3 peças");
  });

  it("altera a quantidade de um item", () => {
    encher();
    render(<ListaPedido />);
    fireEvent.click(within(itensNaTela()[0]).getByRole("button", { name: /^Aumentar quantidade de lenço carijó uma cor/ }));
    expect(lerItens()[0].quantidade).toBe(3);
    expect(screen.getByTestId("total-pecas")).toHaveTextContent("4 peças");
    expect(mensagemDoLink(linkWhats("pedido"))).toContain("Total de peças: 4");
  });

  it("remove um item e desfaz, devolvendo ao mesmo lugar", () => {
    encher();
    render(<ListaPedido />);
    fireEvent.click(within(itensNaTela()[0]).getByRole("button", { name: /^Remover/ }));
    expect(lerItens().map((i) => i.produto)).toEqual([maragato.slug]);
    const aviso = screen.getByTestId("aviso-removido");
    expect(aviso).toHaveTextContent("Lenço carijó uma cor saiu da lista.");
    const desfazer = within(aviso).getByRole("button", { name: "Desfazer" });
    expect(desfazer).toHaveFocus();

    fireEvent.click(desfazer);
    expect(lerItens().map((i) => i.produto)).toEqual([carijoUma.slug, maragato.slug]);
    expect(lerItens()[0]).toEqual({ produto: carijoUma.slug, escolhas: { cor: "azul", medida: "padrao" }, quantidade: 2 });
    expect(screen.queryByTestId("aviso-removido")).toBeNull();
    expect(within(itensNaTela()[0]).getByRole("link", { name: "Lenço carijó uma cor" })).toHaveFocus();
  });

  it("o Desfazer espera enquanto o foco está nele e some alguns segundos depois de o foco sair", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    encher();
    render(<ListaPedido />);
    fireEvent.click(within(itensNaTela()[1]).getByRole("button", { name: /^Remover/ }));
    expect(screen.getByRole("button", { name: "Desfazer" })).toHaveFocus();
    // Com o foco do teclado no aviso, o relógio não corre (nem tirando o mouse de cima).
    fireEvent.mouseEnter(screen.getByTestId("aviso-removido"));
    fireEvent.mouseLeave(screen.getByTestId("aviso-removido"));
    act(() => {
      vi.advanceTimersByTime(TEMPO_DESFAZER * 3);
    });
    expect(screen.getByTestId("aviso-removido")).toBeInTheDocument();

    // O foco sai do aviso: depois do tempo, ele some.
    act(() => {
      screen.getByRole("heading", { name: "Peças na lista" }).focus();
    });
    act(() => {
      vi.advanceTimersByTime(TEMPO_DESFAZER + 10);
    });
    expect(screen.queryByTestId("aviso-removido")).toBeNull();
    expect(lerItens()).toHaveLength(1);
  });

  it("remover o último item mostra a lista vazia com o Desfazer", () => {
    adicionarItem({ produto: maragato.slug, escolhas: { medida: "padrao" }, quantidade: 1 });
    render(<ListaPedido />);
    fireEvent.click(screen.getByRole("button", { name: /^Remover/ }));
    expect(screen.getByRole("heading", { name: "Sua lista está vazia" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(lerItens()).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Peças na lista" })).toBeInTheDocument();
  });

  it("gera a mensagem com nome e cidade, mostra a prévia e mede o clique", () => {
    window.gtag = vi.fn();
    encher();
    render(<ListaPedido />);
    expect(screen.getByLabelText("Nome")).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText("Cidade")).toHaveAttribute("autocomplete", "address-level2");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Souza" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Pelotas/RS" } });
    fireEvent.change(screen.getByLabelText("Observação"), { target: { value: "Preciso até o rodeio." } });

    const esperado = mensagemPedido(lerItens(), { nome: "Ana Souza", cidade: "Pelotas/RS", observacao: "Preciso até o rodeio." });
    const link = linkWhats("pedido");
    expect(link).toHaveTextContent("Enviar pedido pelo WhatsApp");
    expect(link).toHaveAttribute("target", "_blank");
    expect(mensagemDoLink(link)).toBe(esperado);
    expect(esperado).toContain("Nome: Ana Souza");
    expect(esperado).toContain("Cidade: Pelotas/RS");
    expect(esperado).toContain("1) Lenço carijó uma cor");
    expect(esperado).toContain("2) Lenço tradicional Maragato");
    expect(screen.getByTestId("previa-mensagem").textContent).toBe(esperado);
    // Na prévia, cada linha é um bloco; as do item ficam recuadas por inteiro.
    const linhasRecuadas = Array.from(screen.getByTestId("previa-mensagem").children).filter((el) => el.className.includes("pl-"));
    expect(linhasRecuadas.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        contato.whatsapp
          ? "O pedido não é cobrado aqui. A Republicasul responde com valor, prazo e entrega."
          : "O pedido não é cobrado aqui. Valor, prazo e entrega você combina na conversa.",
      ),
    ).toBeInTheDocument();

    clicarSemNavegar(link);
    expect(window.gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "pedido", produto: undefined });
  });
});

describe("ListaPedido: celular e anotações", () => {
  it("tem uma barra de envio fixa para o celular, com a mesma mensagem", () => {
    adicionarItem({ produto: carijoUma.slug, escolhas: { cor: "azul", medida: "padrao" }, quantidade: 2 });
    adicionarItem({ produto: maragato.slug, escolhas: { medida: "especial" }, quantidade: 1 });
    render(<ListaPedido />);
    const barra = screen.getByRole("region", { name: "Envio rápido do pedido" });
    expect(barra).toHaveAttribute("data-barra-celular");
    expect(barra.className).toContain("md:hidden");
    const curto = within(barra).getByRole("link", { name: /Enviar pedido \(3 peças\)/ });
    expect(curto).toHaveAttribute("data-origem", "pedido");
    expect(curto).toHaveAttribute("target", "_blank");
    expect(curto.getAttribute("href")).toBe(linkWhats("pedido").getAttribute("href"));
  });

  it("lista vazia não mostra a barra de envio", () => {
    render(<ListaPedido />);
    expect(screen.queryByRole("region", { name: "Envio rápido do pedido" })).toBeNull();
  });

  // Outra aba grava no armazenamento e o navegador avisa esta com o evento "storage".
  function outraAba(chave: "pedido" | "observacoes", valor: unknown) {
    const nome = `republicasul:${chave}:v1`;
    window.localStorage.setItem(nome, JSON.stringify(valor));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: nome }));
    });
  }
  const itemMaragato = { produto: maragato.slug, escolhas: { medida: "padrao" }, quantidade: 1 };
  const itemPala = { produto: "pala", escolhas: {}, quantidade: 1 };
  const notaDoPala = () => screen.queryByTestId("nota-item");
  const notasDoPala = () => within(screen.getByTestId("nota-item")).getAllByRole("listitem").map((li) => li.textContent);

  it("o que foi escrito no pala aparece no item e vai dentro dele na mensagem; anotação de peça que saiu é esquecida", () => {
    adicionarItem({ produto: "pala", escolhas: {}, quantidade: 2 });
    anotarObservacao("pala", "pala crioulo marrom");
    anotarObservacao("pala", "pala preto");
    anotarObservacao(maragato.slug, "não está mais na lista");
    render(<ListaPedido />);
    expect(notaDoPala()).toHaveTextContent(/^Observação:/);
    expect(notasDoPala()).toEqual(["pala crioulo marrom", "pala preto"]);
    // O campo Observação é só do cliente.
    expect(screen.getByLabelText("Observação")).toHaveValue("");
    expect(mensagemDoLink(linkWhats("pedido"))).toContain("1) Pala\n   Quantidade: 2\n   Observação: pala crioulo marrom; pala preto\n");
    expect(lerObservacoes()).toEqual({ pala: ["pala crioulo marrom", "pala preto"] });
  });

  it("remover o pala tira o que foi escrito dele da mensagem e do navegador; Desfazer devolve", () => {
    adicionarItem(itemMaragato);
    adicionarItem(itemPala);
    anotarObservacao("pala", "pala preto");
    render(<ListaPedido />);
    const observacao = screen.getByLabelText("Observação");
    fireEvent.change(observacao, { target: { value: "Entregar em Bagé" } });

    fireEvent.click(screen.getByRole("button", { name: /^Remover Pala/ }));
    expect(mensagemDoLink(linkWhats("pedido"))).not.toContain("pala preto");
    expect(lerObservacoes()).toEqual({});
    expect(observacao).toHaveValue("Entregar em Bagé");

    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(notaDoPala()).toHaveTextContent("pala preto");
    expect(mensagemDoLink(linkWhats("pedido"))).toContain("   Observação: pala preto\n");
    expect(lerObservacoes()).toEqual({ pala: ["pala preto"] });
    expect(observacao).toHaveValue("Entregar em Bagé");
  });

  it("pala adicionado em outra aba chega com o que foi escrito, em qualquer ordem de gravação", () => {
    for (const ordem of [["pedido", "observacoes"], ["observacoes", "pedido"]] as const) {
      window.localStorage.clear();
      __reiniciarPedido();
      __reiniciarObservacoes();
      adicionarItem(itemMaragato);
      const { unmount } = render(<ListaPedido />);
      fireEvent.change(screen.getByLabelText("Observação"), { target: { value: "Entregar em Bagé" } });
      for (const chave of ordem) outraAba(chave, chave === "pedido" ? [itemMaragato, itemPala] : { pala: ["pala preto"] });
      expect(notaDoPala()).toHaveTextContent("pala preto");
      const texto = mensagemDoLink(linkWhats("pedido"));
      expect(texto).toContain("2) Pala\n   Quantidade: 1\n   Observação: pala preto\n");
      expect(texto).toContain("Observação: Entregar em Bagé");
      unmount();
    }
  });

  it("nova anotação e remoção do pala em outra aba aparecem aqui sem mexer no campo do cliente", () => {
    adicionarItem(itemMaragato);
    adicionarItem(itemPala);
    anotarObservacao("pala", "pala preto");
    render(<ListaPedido />);
    const observacao = screen.getByLabelText("Observação");
    fireEvent.change(observacao, { target: { value: "Quero o preto tamanho G" } });

    outraAba("observacoes", { pala: ["pala preto", "pala branco"] });
    expect(notasDoPala()).toEqual(["pala preto", "pala branco"]);
    expect(mensagemDoLink(linkWhats("pedido"))).toContain("   Observação: pala preto; pala branco\n");

    outraAba("observacoes", {});
    outraAba("pedido", [itemMaragato]);
    expect(screen.queryByRole("button", { name: /^Remover Pala/ })).toBeNull();
    expect(mensagemDoLink(linkWhats("pedido"))).not.toContain("pala preto");
    expect(observacao).toHaveValue("Quero o preto tamanho G");
  });

  it("a lixeira apaga só aquela anotação, da tela, da mensagem e do navegador", () => {
    adicionarItem(itemMaragato);
    adicionarItem(itemPala);
    anotarObservacao("pala", "pala preto");
    anotarObservacao("pala", "pala branco");
    render(<ListaPedido />);

    fireEvent.click(screen.getByRole("button", { name: "Apagar a observação “pala preto”" }));
    expect(notasDoPala()).toEqual(["pala branco"]);
    expect(lerObservacoes()).toEqual({ pala: ["pala branco"] });
    expect(mensagemDoLink(linkWhats("pedido"))).toContain("2) Pala\n   Quantidade: 1\n   Observação: pala branco\n");
    expect(document.activeElement?.tagName).toBe("A");
    expect(document.activeElement).toHaveTextContent("Pala");
    expect(screen.getByRole("status")).toHaveTextContent("A observação “pala preto” saiu do pedido.");

    fireEvent.click(screen.getByRole("button", { name: "Apagar a observação “pala branco”" }));
    expect(notaDoPala()).toBeNull();
    expect(lerObservacoes()).toEqual({});
    expect(mensagemDoLink(linkWhats("pedido"))).not.toContain("   Observação:");
    expect(screen.getByRole("button", { name: /^Remover Pala/ })).toBeInTheDocument();
  });

  it("Desfazer depois de outra aba devolver o pala não repete o que foi escrito", () => {
    adicionarItem(itemMaragato);
    adicionarItem(itemPala);
    anotarObservacao("pala", "pala preto");
    render(<ListaPedido />);
    fireEvent.click(screen.getByRole("button", { name: /^Remover Pala/ }));
    outraAba("pedido", [itemMaragato, itemPala]);
    outraAba("observacoes", { pala: ["pala branco"] });
    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(lerObservacoes()).toEqual({ pala: ["pala branco", "pala preto"] });
    const texto = mensagemDoLink(linkWhats("pedido"));
    expect(texto.match(/pala branco/g)).toHaveLength(1);
    expect(texto).toContain("   Observação: pala branco; pala preto\n");
  });
});

describe("funções do pedido", () => {
  it("restaurarItem devolve o item ao lugar de onde saiu", () => {
    const a = { produto: maragato.slug, escolhas: { medida: "padrao" }, quantidade: 1 };
    const b = { produto: carijoUma.slug, escolhas: { cor: "preto", medida: "padrao" }, quantidade: 3 };
    const c = { produto: "pala", escolhas: {}, quantidade: 1 };
    [a, b, c].forEach(adicionarItem);
    restaurarItem({ produto: carijoDuas.slug, escolhas: escolhasPadrao(carijoDuas), quantidade: 2 }, 1);
    expect(lerItens().map((i) => i.produto)).toEqual([a.produto, carijoDuas.slug, b.produto, c.produto]);
    restaurarItem({ ...a, quantidade: 1 }, 99);
    expect(lerItens()[0].quantidade).toBe(2);
  });

  it("o link do produto leva só escolhas válidas", () => {
    expect(caminhoDoProduto({ produto: carijoUma.slug, escolhas: { cor: "azul", medida: "padrao", lixo: "x" } })).toBe(
      "/produto/lenco-carijo-uma-cor/?cor=azul&medida=padrao",
    );
    expect(caminhoDoProduto({ produto: "pala", escolhas: {} })).toBe("/produto/pala/");
  });
});

// ------------------------------------------------------------------
// Páginas
// ------------------------------------------------------------------

describe("páginas do montador e do pedido", () => {
  it("montador: título, descrição, canonical e um h1", () => {
    expect(metadadosMontador.title).toBe("Monte o seu lenço");
    expect(String(metadadosMontador.description)).toMatch(/WhatsApp/);
    expect(metadadosMontador.alternates?.canonical).toBe("/montador/");
    render(<PaginaMontador />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Monte o seu lenço");
    expect(screen.getByRole("navigation", { name: "Trilha" })).toBeInTheDocument();
  });

  it("montador: o HTML do servidor já traz o lenço e a ficha", () => {
    const html = renderToString(<PaginaMontador />);
    expect(html).toContain("Lenço carijó duas cores");
    expect(html).toContain('role="img"');
  });

  it("pedido: título, noindex e um h1", () => {
    expect(metadadosPedido.title).toBe("Seu pedido");
    expect(metadadosPedido.robots).toMatchObject({ index: false });
    expect(metadadosPedido.alternates?.canonical).toBe("/pedido/");
    render(<PaginaPedido />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Seu pedido");
  });
});
