import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalogo/",
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import PaginaCategoria, * as moduloCategoria from "../app/catalogo/[categoria]/page";
import Catalogo, { metadata as metadadosCatalogo } from "../app/catalogo/page";
import PaginaProduto, * as moduloProduto from "../app/produto/[slug]/page";
import CartaoProduto from "../components/catalogo/CartaoProduto";
import {
  caminhoComEscolhas,
  lerEscolhasDaUrl,
  mensagemPedidoDireto,
  outrosProdutos,
  passosDaCompra,
  semCorRepetida,
  SEM_PRECO,
  textoPreco,
  tituloDaLinha,
  variacoesDaCategoria,
} from "../components/catalogo/funcoes";
import GaleriaFotos from "../components/catalogo/GaleriaFotos";
import GradeProdutos from "../components/catalogo/GradeProdutos";
import PainelProduto from "../components/catalogo/PainelProduto";
import { descricaoCategoria, jsonLdProduto, temPrecoConfirmado } from "../components/catalogo/seo";
import { categoriaPorSlug, categorias, coresDasEscolhas, escolhasPadrao, produtoPorSlug, produtos, type Produto } from "../content/catalogo";
import { __reiniciarObservacoes, __reiniciarPedido, lerItens, lerObservacoes } from "../lib/pedido";
import { linkWhatsApp, mensagemProduto } from "../lib/whatsapp";

const carijoDuas = produtoPorSlug("lenco-carijo-duas-cores")!;
const carijoUma = produtoPorSlug("lenco-carijo-uma-cor")!;
const pala = produtoPorSlug("pala")!;
const maragato = produtoPorSlug("lenco-tradicional-maragato")!;

function irPara(caminho: string) {
  window.history.replaceState(null, "", caminho);
}

function linkPedirAgora() {
  return screen.getByRole("link", { name: /Pedir agora no WhatsApp/ });
}

beforeEach(() => {
  window.localStorage.clear();
  __reiniciarPedido();
  __reiniciarObservacoes();
  irPara("/");
});

afterEach(() => cleanup());

// ------------------------------------------------------------------
// Funções puras
// ------------------------------------------------------------------

describe("funções do catálogo", () => {
  it("sem preço mostra 'Valor pelo WhatsApp'; com preço, em reais", () => {
    expect(textoPreco(undefined)).toBe(SEM_PRECO);
    expect(SEM_PRECO).toBe("Valor pelo WhatsApp");
    expect(textoPreco(0)).toBe(SEM_PRECO);
    expect(textoPreco(89.9).replace(/\s/g, " ")).toBe("R$ 89,90");
  });

  it("leitura de query inválida volta ao padrão", () => {
    expect(lerEscolhasDaUrl(carijoDuas, "?cor-1=roxo&cor-2=<script>&medida=gigante&outra=1")).toEqual(escolhasPadrao(carijoDuas));
    expect(lerEscolhasDaUrl(carijoDuas, "")).toEqual(escolhasPadrao(carijoDuas));
    // Valor de outra opção não vale: "branco" só existe na segunda cor.
    expect(lerEscolhasDaUrl(carijoDuas, "?cor-1=branco")["cor-1"]).toBe(escolhasPadrao(carijoDuas)["cor-1"]);
  });

  it("aceita na query só o que existe e mantém o resto no padrão", () => {
    expect(lerEscolhasDaUrl(carijoDuas, "?cor-1=preto&medida=xxx")).toEqual({ ...escolhasPadrao(carijoDuas), "cor-1": "preto" });
    expect(lerEscolhasDaUrl(carijoDuas, new URLSearchParams("cor-2=branco&medida=especial"))).toEqual({
      ...escolhasPadrao(carijoDuas),
      "cor-2": "branco",
      medida: "especial",
    });
    expect(lerEscolhasDaUrl(pala, "?cor=azul")).toEqual({});
  });

  it("monta o caminho com as escolhas mantendo outros parâmetros e a âncora", () => {
    const caminho = caminhoComEscolhas(
      carijoDuas,
      { "cor-1": "azul", "cor-2": "branco", medida: "especial" },
      "https://www.republicasul.com.br/produto/lenco-carijo-duas-cores/?utm_source=insta&cor-1=velho#topo",
    );
    expect(caminho).toBe("/produto/lenco-carijo-duas-cores/?utm_source=insta&cor-1=azul&cor-2=branco&medida=especial#topo");
  });

  it("as duas cores do carijó nunca ficam iguais (URL e troca de cor)", () => {
    // Pela URL: a segunda cor anda para a primeira cor livre.
    const daUrl = lerEscolhasDaUrl(carijoDuas, "?cor-1=azul&cor-2=azul");
    expect(daUrl["cor-1"]).toBe("azul");
    expect(daUrl["cor-2"]).not.toBe("azul");
    // Na troca: quem mudou fica, a outra opção anda.
    const padrao = escolhasPadrao(carijoDuas);
    const trocada = semCorRepetida(carijoDuas, { ...padrao, "cor-2": padrao["cor-1"] }, "cor-2");
    expect(trocada["cor-2"]).toBe(padrao["cor-1"]);
    expect(trocada["cor-1"]).not.toBe(padrao["cor-1"]);
    // Sem repetição, devolve o mesmo objeto; produto com uma cor só não muda.
    expect(semCorRepetida(carijoDuas, padrao)).toBe(padrao);
    expect(semCorRepetida(carijoUma, escolhasPadrao(carijoUma))).toEqual(escolhasPadrao(carijoUma));
  });

  it("título da linha no plural só onde o nome da linha é o do produto", () => {
    expect(tituloDaLinha(categoriaPorSlug("carijo-uma-cor")!)).toBe("Lenços carijó de uma cor");
    expect(tituloDaLinha(categoriaPorSlug("carijo-duas-cores")!)).toBe("Lenços carijó de duas cores");
    expect(tituloDaLinha(categoriaPorSlug("farroupilha")!)).toBe("Lenços farroupilha");
    expect(tituloDaLinha(categoriaPorSlug("lencos-tradicionais")!)).toBe("Lenços tradicionais");
    for (const c of categorias) {
      const unico = produtos.filter((p) => p.categoria === c.slug);
      if (unico.length === 1) expect(tituloDaLinha(c).toLowerCase()).not.toBe(unico[0].nome.toLowerCase());
    }
  });

  it("os três passos da compra começam pelo que a peça tem para escolher", () => {
    expect(passosDaCompra(carijoUma)[0]).toBe("Escolha cor do xadrez, medida e quantidade.");
    expect(passosDaCompra(pala)[0]).toBe("Escolha a quantidade e conte o modelo e a cor que procura.");
    expect(passosDaCompra(pala)).toHaveLength(3);
  });

  it("descrições de busca curtas, com a peça e o WhatsApp antes do corte", () => {
    for (const c of categorias) {
      const d = descricaoCategoria(c);
      expect(d.length, c.slug).toBeLessThanOrEqual(155);
      expect(d).toContain("WhatsApp");
    }
    expect(temPrecoConfirmado(maragato)).toBe(false);
    expect(temPrecoConfirmado({ ...maragato, preco: 99.5 })).toBe(true);
  });

  it("a mensagem do pala fala em pala, e a dos lenços em lenço", () => {
    expect(mensagemProduto({ produto: pala.slug, escolhas: {}, quantidade: 1 })).toContain("quero este pala:\n");
    expect(mensagemProduto({ produto: carijoDuas.slug, escolhas: escolhasPadrao(carijoDuas), quantidade: 1 })).toContain("quero este lenço:\n");
  });

  it("põe a observação dentro do item, antes da pergunta final", () => {
    const item = { produto: pala.slug, escolhas: {}, quantidade: 2 };
    expect(mensagemPedidoDireto(item, "   ")).toBe(mensagemProduto(item));
    const texto = mensagemPedidoDireto(item, " Pala   cinza\n com franja ");
    expect(texto).toContain("   Quantidade: 2\n   Observação: Pala cinza com franja\n");
    expect(texto.trim().endsWith("Pode me passar o valor, o prazo e o frete?")).toBe(true);
  });

  it("outros produtos trazem a mesma categoria primeiro e nunca o próprio", () => {
    const outros = outrosProdutos(maragato, 4);
    expect(outros).toHaveLength(4);
    expect(outros.map((p) => p.slug)).not.toContain(maragato.slug);
    expect(outros.slice(0, 3).every((p) => p.categoria === maragato.categoria)).toBe(true);
    expect(outrosProdutos(pala, 4).every((p) => p.slug !== "pala")).toBe(true);
  });

  it("variações da categoria usam só cores que o produto oferece", () => {
    const variacoes = variacoesDaCategoria("carijo-uma-cor");
    expect(variacoes.length).toBeGreaterThan(1);
    const hexes = new Set(carijoUma.opcoes[0].valores.map((v) => v.hex));
    for (const v of variacoes) expect(hexes.has(v.cores[0])).toBe(true);
    expect(variacoesDaCategoria("lencos-tradicionais").map((v) => v.nome)).toContain("Lenço tradicional Maragato");
  });
});

// ------------------------------------------------------------------
// Página do produto: painel vivo
// ------------------------------------------------------------------

describe("PainelProduto", () => {
  it("troca de opção altera a mensagem do WhatsApp e o resumo", () => {
    render(<PainelProduto produto={carijoDuas} topo={<h1>{carijoDuas.nome}</h1>} />);
    const padrao = escolhasPadrao(carijoDuas);
    expect(linkPedirAgora()).toHaveAttribute("href", linkWhatsApp(mensagemProduto({ produto: carijoDuas.slug, escolhas: padrao, quantidade: 1 })));

    const primeira = screen.getByRole("group", { name: /Primeira cor/ });
    fireEvent.click(within(primeira).getByRole("radio", { name: "Preto" }));
    fireEvent.click(screen.getByRole("radio", { name: "Medida especial" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));

    const escolhas = { ...padrao, "cor-1": "preto", medida: "especial" };
    const esperado = mensagemProduto({ produto: carijoDuas.slug, escolhas, quantidade: 2 });
    expect(linkPedirAgora()).toHaveAttribute("href", linkWhatsApp(esperado));
    expect(decodeURIComponent(linkPedirAgora().getAttribute("href")!)).toContain("Primeira cor: Preto");
    for (const parte of ["Primeira cor: Preto", "Segunda cor: Azul", "Medida: Medida especial"]) {
      expect(screen.getByTestId("resumo-escolha")).toHaveTextContent(parte);
    }
    expect(screen.getByTestId("resumo-escolha")).toHaveTextContent("Quantidade: 2");
  });

  it("o desenho acompanha a cor escolhida", () => {
    render(<PainelProduto produto={carijoUma} topo={null} />);
    expect(screen.getAllByRole("img", { name: /Lenço carijó uma cor em vermelho/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("radio", { name: "Verde" }));
    expect(screen.getAllByRole("img", { name: /Lenço carijó uma cor em verde/ }).length).toBeGreaterThan(0);
    expect(screen.getByText("Ilustração da peça. As cores acompanham a sua escolha.")).toBeInTheDocument();
  });

  it("adicionar ao pedido grava o item com as escolhas e mostra o link do pedido", () => {
    render(<PainelProduto produto={carijoDuas} topo={null} />);
    fireEvent.click(within(screen.getByRole("group", { name: /Segunda cor/ })).getByRole("radio", { name: "Branco" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));

    expect(lerItens()).toEqual([
      { produto: carijoDuas.slug, escolhas: { ...escolhasPadrao(carijoDuas), "cor-2": "branco" }, quantidade: 2 },
    ]);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Adicionado ao seu pedido.");
    expect(within(status).getByRole("link", { name: "Ver seu pedido" }).getAttribute("href")).toMatch(/^\/pedido\/?$/);

    // Mesma escolha de novo: soma na mesma linha do pedido.
    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(lerItens()).toHaveLength(1);
    expect(lerItens()[0].quantidade).toBe(4);
    expect(screen.getByRole("status")).toHaveTextContent("Agora são 4 peças desta escolha no pedido.");
  });

  it("escolher na segunda cor a mesma da primeira faz a primeira andar", () => {
    render(<PainelProduto produto={carijoDuas} topo={null} />);
    const padrao = escolhasPadrao(carijoDuas);
    const nomeDe = (opcao: string, id: string) => carijoDuas.opcoes.find((o) => o.id === opcao)!.valores.find((v) => v.id === id)!.nome;
    const nomePrimeira = nomeDe("cor-1", padrao["cor-1"]);
    fireEvent.click(within(screen.getByRole("group", { name: /Segunda cor/ })).getByRole("radio", { name: nomePrimeira }));
    expect(within(screen.getByRole("group", { name: /Segunda cor/ })).getByRole("radio", { name: nomePrimeira })).toBeChecked();
    expect(within(screen.getByRole("group", { name: /Primeira cor/ })).getByRole("radio", { name: nomePrimeira })).not.toBeChecked();
    const params = new URLSearchParams(window.location.search);
    expect(params.get("cor-1")).not.toBe(params.get("cor-2"));
  });

  it("escolhas vão para a URL e são lidas dela ao abrir", () => {
    irPara("/produto/lenco-carijo-duas-cores/?cor-1=amarelo&medida=especial&utm_source=teste");
    render(<PainelProduto produto={carijoDuas} topo={null} />);
    expect(within(screen.getByRole("group", { name: /Primeira cor/ })).getByRole("radio", { name: "Amarelo" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Medida especial" })).toBeChecked();

    fireEvent.click(within(screen.getByRole("group", { name: /Segunda cor/ })).getByRole("radio", { name: "Preto" }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get("cor-1")).toBe("amarelo");
    expect(params.get("cor-2")).toBe("preto");
    expect(params.get("medida")).toBe("especial");
    expect(params.get("utm_source")).toBe("teste");
    expect(window.location.pathname).toBe("/produto/lenco-carijo-duas-cores/");
  });

  it("query inválida na URL volta ao padrão e é limpa", () => {
    irPara("/produto/lenco-carijo-duas-cores/?cor-1=roxo&cor-2=azul-piscina&medida=gigante");
    render(<PainelProduto produto={carijoDuas} topo={null} />);
    const padrao = escolhasPadrao(carijoDuas);
    expect(within(screen.getByRole("group", { name: /Primeira cor/ })).getByRole("radio", { name: "Vermelho" })).toBeChecked();
    expect(within(screen.getByRole("group", { name: /Segunda cor/ })).getByRole("radio", { name: "Azul" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Medida padrão" })).toBeChecked();
    expect(linkPedirAgora()).toHaveAttribute("href", linkWhatsApp(mensagemProduto({ produto: carijoDuas.slug, escolhas: padrao, quantidade: 1 })));
    expect(window.location.search).not.toContain("roxo");
    expect(window.location.search).not.toContain("gigante");
  });

  it("sem query na URL não mexe no endereço", () => {
    irPara("/produto/lenco-carijo-duas-cores/");
    render(<PainelProduto produto={carijoDuas} topo={null} />);
    expect(window.location.search).toBe("");
  });

  it("pala funciona só com quantidade e observação", () => {
    render(<PainelProduto produto={pala} topo={null} />);
    expect(screen.queryByRole("radio")).toBeNull();
    fireEvent.change(screen.getByLabelText("Conte o que procura"), { target: { value: "Pala marrom com listras" } });
    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    const texto = decodeURIComponent(linkPedirAgora().getAttribute("href")!.split("text=")[1]);
    expect(texto).toContain("1) Pala");
    expect(texto).toContain("Quantidade: 2");
    expect(texto).toContain("Observação: Pala marrom com listras");

    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(lerItens()).toEqual([{ produto: "pala", escolhas: {}, quantidade: 2 }]);
    // O texto não se perde: fica guardado e vai junto com o pala na página do pedido.
    expect(screen.getByRole("status")).toHaveTextContent("O que você escreveu vai junto com o pala no seu pedido.");
    expect(lerObservacoes()).toEqual({ pala: ["Pala marrom com listras"] });

    // Outro pala, com outro texto: o aviso fala em palas na lista (não "desta escolha").
    fireEvent.change(screen.getByLabelText("Conte o que procura"), { target: { value: "Pala preto" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(screen.getByRole("status")).toHaveTextContent("Agora são 4 palas na lista.");
    expect(screen.getByRole("status")).not.toHaveTextContent("desta escolha");
    expect(lerObservacoes()).toEqual({ pala: ["Pala marrom com listras", "Pala preto"] });
  });

  it("peça com opções: a observação abre num botão no celular e não vai para as anotações", () => {
    render(<PainelProduto produto={maragato} topo={null} />);
    const abrir = screen.getByRole("button", { name: "Escrever uma observação (opcional)" });
    expect(abrir).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(abrir);
    const campo = screen.getByLabelText("Observação (opcional)");
    fireEvent.change(campo, { target: { value: "Medida para criança" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(screen.getByRole("status")).toHaveTextContent("A observação não fica na lista");
    expect(lerObservacoes()).toEqual({});
  });

  it("os links do WhatsApp registram o clique com a origem e o produto", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(<PainelProduto produto={maragato} topo={null} />);
    expect(linkPedirAgora()).toHaveAttribute("target", "_blank");
    expect(linkPedirAgora()).toHaveAttribute("rel", "noopener");
    fireEvent.click(linkPedirAgora());
    expect(gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "produto", produto: maragato.slug });
    fireEvent.click(screen.getByRole("link", { name: /Quero ajuda para escolher/ }));
    expect(gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "produto-ajuda", produto: maragato.slug });
    delete window.gtag;
  });

  it("mostra 'Valor pelo WhatsApp' sem preço", () => {
    render(<PainelProduto produto={maragato} topo={null} />);
    expect(screen.getByTestId("preco")).toHaveTextContent("Valor pelo WhatsApp");
  });
});

// ------------------------------------------------------------------
// Cartão e grade
// ------------------------------------------------------------------

describe("CartaoProduto", () => {
  it("mostra nome com link, resumo e 'Valor pelo WhatsApp'", () => {
    render(<CartaoProduto produto={maragato} />);
    const link = screen.getByRole("link", { name: maragato.nome });
    expect(link.getAttribute("href")).toMatch(/^\/produto\/lenco-tradicional-maragato\/?$/);
    expect(screen.getByText(maragato.resumo)).toBeInTheDocument();
    expect(screen.getByText("Valor pelo WhatsApp")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Desenho ilustrativo: Lenço tradicional Maragato/ })).toBeInTheDocument();
  });

  it("com preço confirmado mostra o valor em reais", () => {
    const comPreco: Produto = { ...maragato, preco: 120 };
    render(<CartaoProduto produto={comPreco} />);
    expect(screen.getByText(/R\$\s120,00/)).toBeInTheDocument();
    expect(screen.queryByText("Valor pelo WhatsApp")).toBeNull();
  });

  it("o desenho e o 'Vai com' mostram as cores que vão para o pedido", () => {
    render(<CartaoProduto produto={carijoDuas} />);
    const padrao = escolhasPadrao(carijoDuas);
    expect(screen.getByTestId("vai-com")).toHaveTextContent("Vai com: vermelho e azul");
    expect(screen.getByRole("img", { name: /Lenço carijó duas cores em vermelho e azul/ })).toBeInTheDocument();
    const [cor1, cor2] = coresDasEscolhas(carijoDuas, padrao);
    expect(document.body.innerHTML).toContain(cor1);
    expect(document.body.innerHTML).toContain(cor2);
  });

  it("botão rápido adiciona com as escolhas padrão e mostra 'Adicionado'", () => {
    render(<CartaoProduto produto={carijoDuas} />);
    fireEvent.click(screen.getByRole("button", { name: /Adicionar ao pedido/ }));
    expect(lerItens()).toEqual([{ produto: carijoDuas.slug, escolhas: escolhasPadrao(carijoDuas), quantidade: 1 }]);
    expect(screen.getByRole("button", { name: /Adicionado/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver seu pedido" }).getAttribute("href")).toMatch(/^\/pedido\/?$/);
    expect(screen.getByRole("status")).toHaveTextContent(`${carijoDuas.nome} adicionado ao pedido`);
  });

  it("'Adicionado' volta a 'Adicionar' depois de um instante", () => {
    vi.useFakeTimers();
    try {
      render(<CartaoProduto produto={maragato} />);
      fireEvent.click(screen.getByRole("button", { name: /Adicionar ao pedido/ }));
      expect(screen.getByRole("button", { name: /Adicionado/ })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByRole("button", { name: /Adicionar ao pedido/ })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("com foto, mostra a foto real no lugar do desenho", () => {
    const comFoto: Produto = { ...maragato, fotos: ["/fotos/maragato-1.jpg"] };
    render(<CartaoProduto produto={comFoto} />);
    const foto = screen.getByRole("img", { name: `Foto do ${maragato.nome}` });
    expect(foto.tagName.toLowerCase()).toBe("img");
    // Com onError, o next/image regrava o src ao montar (para não perder um erro de
    // antes da hidratação) e o atributo fica absoluto: compara só o caminho.
    expect(new URL(foto.getAttribute("src")!, window.location.href).pathname).toBe("/fotos/maragato-1.jpg");
    expect(screen.queryByRole("img", { name: /Desenho ilustrativo/ })).toBeNull();
  });

  it("se a foto não carregar, volta para o desenho", () => {
    const comFoto: Produto = { ...maragato, fotos: ["/fotos/que-nao-existe.jpg"] };
    render(<CartaoProduto produto={comFoto} />);
    fireEvent.error(screen.getByRole("img", { name: `Foto do ${maragato.nome}` }));
    expect(screen.queryByRole("img", { name: `Foto do ${maragato.nome}` })).toBeNull();
    expect(screen.getByRole("img", { name: /Desenho ilustrativo/ })).toBeInTheDocument();
  });
});

describe("GradeProdutos", () => {
  it("filtro de categoria mostra só a linha escolhida e volta para todos", async () => {
    render(<GradeProdutos produtos={produtos} filtro />);
    const filtro = screen.getByRole("group", { name: "Filtrar por linha" });
    expect(screen.getAllByRole("article")).toHaveLength(produtos.length);
    expect(within(filtro).getByRole("button", { name: /Todos/ })).toHaveAttribute("aria-pressed", "true");

    const tradicionais = within(filtro).getByRole("button", { name: /^Tradicionais/ });
    fireEvent.click(tradicionais);
    expect(tradicionais).toHaveAttribute("aria-pressed", "true");
    // Os cartões das outras linhas saem (com animação curta) e só ficam os da linha.
    await waitFor(() =>
      expect(screen.getAllByRole("article").map((el) => el.getAttribute("data-produto"))).toEqual(
        produtos.filter((p) => p.categoria === "lencos-tradicionais").map((p) => p.slug),
      ),
    );
    const contagem = () => screen.getAllByRole("status").find((el) => el.textContent?.includes("peça"))!;
    expect(contagem()).toHaveTextContent("4 peças em Lenços tradicionais");
    expect(screen.getByRole("link", { name: "Abrir a página da linha" }).getAttribute("href")).toMatch(/^\/catalogo\/lencos-tradicionais\/?$/);

    fireEvent.click(within(filtro).getByRole("button", { name: /Palas/ }));
    expect(contagem()).toHaveTextContent("1 peça em Palas");

    fireEvent.click(within(filtro).getByRole("button", { name: /Todos/ }));
    expect(contagem()).toHaveTextContent(`${produtos.length} peças no catálogo`);
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(produtos.length));
  });

  it("o HTML estático sai com todos os produtos visíveis", () => {
    const html = renderToString(<GradeProdutos produtos={produtos} filtro />);
    for (const p of produtos) expect(html).toContain(`data-produto="${p.slug}"`);
    expect(html).not.toMatch(/opacity:\s*0[;"]/);
  });

  it("sem filtro não mostra os chips", () => {
    render(<GradeProdutos produtos={produtos.slice(0, 2)} />);
    expect(screen.queryByRole("group", { name: "Filtrar por linha" })).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("GaleriaFotos", () => {
  it("mostra as fotos com miniaturas e usa a reserva se todas falharem", () => {
    render(<GaleriaFotos fotos={["/fotos/a.jpg", "/fotos/b.jpg"]} nome="Pala" reserva={<p>desenho reserva</p>} />);
    expect(screen.getByRole("img", { name: "Foto 1 de 2 do Pala" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver foto 2 de 2" }));
    expect(screen.getByRole("img", { name: "Foto 2 de 2 do Pala" })).toBeInTheDocument();
    for (const img of Array.from(document.querySelectorAll("img"))) fireEvent.error(img);
    for (const img of Array.from(document.querySelectorAll("img"))) fireEvent.error(img);
    expect(screen.getByText("desenho reserva")).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------
// Páginas
// ------------------------------------------------------------------

describe("página /catalogo/", () => {
  it("tem um h1, todos os produtos no HTML e links para as linhas", () => {
    render(<Catalogo />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lenços e palas");
    for (const p of produtos) expect(screen.getAllByRole("link", { name: p.nome }).length).toBeGreaterThan(0);
    for (const c of categorias) expect(document.querySelector(`a[href^="/catalogo/${c.slug}"]`)).not.toBeNull();
    expect(metadadosCatalogo.alternates?.canonical).toBe("/catalogo/");
    expect(metadadosCatalogo.title).toBe("Lenços e palas");
  });
});

describe("página /catalogo/[categoria]/", () => {
  it("gera uma página por categoria, sem rotas extras", () => {
    expect(moduloCategoria.dynamicParams).toBe(false);
    expect(moduloCategoria.generateStaticParams()).toEqual(categorias.map((c) => ({ categoria: c.slug })));
  });

  it("metadados únicos com título, resumo e canonical", async () => {
    const meta = await moduloCategoria.generateMetadata({ params: Promise.resolve({ categoria: "carijo-uma-cor" }) });
    // Título no plural: não disputa a busca com a página do produto "Lenço carijó uma cor".
    expect(meta.title).toBe("Lenços carijó de uma cor");
    expect(meta.description).toContain("Fundo claro com o xadrez miúdo de uma cor.");
    expect(meta.alternates?.canonical).toBe("/catalogo/carijo-uma-cor/");
  });

  it("trilha, h1, produtos da categoria e WhatsApp citando a linha", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(await PaginaCategoria({ params: Promise.resolve({ categoria: "lencos-tradicionais" }) }));
    const trilha = screen.getByRole("navigation", { name: "Trilha" });
    expect(within(trilha).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Início", "Lenços", "Lenços tradicionais"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lenços tradicionais");
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Não achou a cor ou a medida? Chame no WhatsApp" })).toBeInTheDocument();
    const whats = screen.getAllByRole("link", { name: /Chamar no WhatsApp/ }).find((a) => a.getAttribute("data-origem") === "categoria")!;
    expect(decodeURIComponent(whats.getAttribute("href")!)).toContain("linha Lenços tradicionais");
    fireEvent.click(whats);
    expect(gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "categoria", produto: undefined });
    delete window.gtag;
  });

  it("linha de uma peça só: título no plural, passos da compra e link para a peça", async () => {
    render(await PaginaCategoria({ params: Promise.resolve({ categoria: "carijo-duas-cores" }) }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lenços carijó de duas cores");
    const trilha = screen.getByRole("navigation", { name: "Trilha" });
    expect(within(trilha).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Início", "Lenços", "Lenços carijó de duas cores"]);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Como funciona a compra" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver a peça e escolher as cores" }).getAttribute("href")).toMatch(/^\/produto\/lenco-carijo-duas-cores\/?$/);
  });

  it("palas: a ajuda pede modelo e cor (o pala não tem cor nem medida para escolher)", async () => {
    render(await PaginaCategoria({ params: Promise.resolve({ categoria: "palas" }) }));
    expect(screen.getByRole("heading", { name: "Conte o modelo e a cor do pala que você procura" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Não achou a cor ou a medida/ })).toBeNull();
    const whats = screen.getAllByRole("link", { name: /Chamar no WhatsApp/ }).find((a) => a.getAttribute("data-origem") === "categoria")!;
    const texto = decodeURIComponent(whats.getAttribute("href")!);
    expect(texto).toContain("quero saber dos modelos e cores");
    expect(texto).not.toContain("a cor ou a medida");
    expect(screen.getByRole("link", { name: "Abrir a página da peça" }).getAttribute("href")).toMatch(/^\/produto\/pala\/?$/);
  });

  it("categoria que não existe vira 404", async () => {
    await expect(PaginaCategoria({ params: Promise.resolve({ categoria: "nao-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("página /produto/[slug]/", () => {
  it("gera uma página por produto, sem rotas extras", () => {
    expect(moduloProduto.dynamicParams).toBe(false);
    expect(moduloProduto.generateStaticParams()).toEqual(produtos.map((p) => ({ slug: p.slug })));
  });

  it("metadados únicos com resumo, canonical e openGraph", async () => {
    const meta = await moduloProduto.generateMetadata({ params: Promise.resolve({ slug: "lenco-farroupilha" }) });
    expect(meta.title).toBe("Lenço farroupilha");
    // Parte da descrição da peça (que diz qual é a peça) e chama para o WhatsApp uma vez só.
    expect(meta.description).toBe("O lenço com as cores da bandeira do Rio Grande do Sul. Monte o pedido e fale pelo WhatsApp.");
    const metaPala = await moduloProduto.generateMetadata({ params: Promise.resolve({ slug: "pala" }) });
    expect(String(metaPala.description).match(/WhatsApp/g)?.length ?? 0).toBeLessThanOrEqual(1);
    expect(meta.alternates?.canonical).toBe("/produto/lenco-farroupilha/");
    expect(meta.openGraph).toMatchObject({ url: "/produto/lenco-farroupilha/", locale: "pt_BR", title: "Lenço farroupilha | Republicasul" });
  });

  it("JSON-LD Product sem offers e sem imagem quando não há preço nem foto", () => {
    const dados = jsonLdProduto(maragato);
    expect(dados).toMatchObject({
      "@type": "Product",
      name: maragato.nome,
      brand: { "@type": "Brand", name: "Republicasul" },
      category: "Lenços tradicionais",
      url: "https://www.republicasul.com.br/produto/lenco-tradicional-maragato/",
    });
    expect(dados).not.toHaveProperty("offers");
    expect(dados).not.toHaveProperty("image");

    const completo = jsonLdProduto({ ...maragato, preco: 99.5, fotos: ["/fotos/m.jpg"] });
    expect(completo).toMatchObject({
      image: ["https://www.republicasul.com.br/fotos/m.jpg"],
      offers: { "@type": "Offer", price: "99.50", priceCurrency: "BRL" },
    });
  });

  it("página completa: h1 único, trilha, JSON-LD, como funciona e outros lenços", async () => {
    const { container } = render(await PaginaProduto({ params: Promise.resolve({ slug: "lenco-carijo-uma-cor" }) }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lenço carijó uma cor");
    const trilha = screen.getByRole("navigation", { name: "Trilha" });
    // A linha entra na trilha (no plural) com link: a peça aponta de volta para a página da linha.
    expect(within(trilha).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Início",
      "Lenços",
      "Lenços carijó de uma cor",
      "Lenço carijó uma cor",
    ]);
    expect(within(trilha).getByRole("link", { name: "Lenços carijó de uma cor" }).getAttribute("href")).toMatch(/^\/catalogo\/carijo-uma-cor\/?$/);
    const jsonLd = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent!));
    // Sem preço confirmado não sai o Product (sem offers ele é inválido para o Google); a trilha continua.
    expect(jsonLd.find((d) => d["@type"] === "Product")).toBeUndefined();
    expect(jsonLd.find((d) => d["@type"] === "BreadcrumbList")).toBeDefined();
    // Linha de uma peça só: a descrição da linha não se repete em "Sobre esta peça".
    expect(screen.queryByText(categoriaPorSlug("carijo-uma-cor")!.descricao)).toBeNull();
    expect(screen.getByRole("heading", { name: "Como funciona a compra" })).toBeInTheDocument();
    expect(screen.getByText("Escolha cor do xadrez, medida e quantidade.")).toBeInTheDocument();
    const outros = screen.getByRole("heading", { name: "Outros lenços" }).closest("section")!;
    expect(within(outros).getAllByRole("article")).toHaveLength(4);
    expect(within(outros).queryByText("Lenço carijó uma cor", { selector: "a" })).toBeNull();
    expect(screen.getByRole("link", { name: /Pedir agora no WhatsApp/ })).toBeInTheDocument();
  });

  it("na linha com várias peças, 'Sobre esta peça' traz também a descrição da linha", async () => {
    render(await PaginaProduto({ params: Promise.resolve({ slug: "lenco-tradicional-maragato" }) }));
    expect(screen.getByText(categoriaPorSlug("lencos-tradicionais")!.descricao)).toBeInTheDocument();
  });

  it("produto que não existe vira 404", async () => {
    await expect(PaginaProduto({ params: Promise.resolve({ slug: "nao-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
