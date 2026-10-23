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
import { __reiniciarPedido, adicionarItem, lerItens } from "../lib/pedido";
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

  it("o Desfazer some depois de alguns segundos", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    encher();
    render(<ListaPedido />);
    fireEvent.click(within(itensNaTela()[1]).getByRole("button", { name: /^Remover/ }));
    expect(screen.getByTestId("aviso-removido")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(TEMPO_DESFAZER + 10);
    });
    expect(screen.queryByTestId("aviso-removido")).toBeNull();
    expect(lerItens()).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Peças na lista" })).toHaveFocus();
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
    expect(screen.getByText("O pedido não é cobrado aqui. A Republicasul responde com valor, prazo e entrega.")).toBeInTheDocument();

    clicarSemNavegar(link);
    expect(window.gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "pedido", produto: undefined });
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
