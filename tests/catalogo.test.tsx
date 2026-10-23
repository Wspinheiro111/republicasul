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
  SEM_PRECO,
  textoPreco,
  variacoesDaCategoria,
} from "../components/catalogo/funcoes";
import GaleriaFotos from "../components/catalogo/GaleriaFotos";
import GradeProdutos from "../components/catalogo/GradeProdutos";
import PainelProduto from "../components/catalogo/PainelProduto";
import { jsonLdProduto } from "../components/catalogo/seo";
import { categorias, escolhasPadrao, produtoPorSlug, produtos, type Produto } from "../content/catalogo";
import { __reiniciarPedido, lerItens } from "../lib/pedido";
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
    expect(screen.getByRole("status")).toHaveTextContent("A observação não fica na lista");
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
    expect(foto.getAttribute("src")).toBe("/fotos/maragato-1.jpg");
    expect(screen.queryByRole("img", { name: /Desenho ilustrativo/ })).toBeNull();
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
    expect(meta.title).toBe("Lenço carijó uma cor");
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
    expect(meta.description).toBe("Verde, vermelho e amarelo da bandeira rio-grandense. Monte o pedido e fale pelo WhatsApp.");
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
    // A linha tem o mesmo nome do produto: não se repete na trilha.
    expect(within(trilha).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Início", "Lenços", "Lenço carijó uma cor"]);
    const jsonLd = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent!));
    const produtoLd = jsonLd.find((d) => d["@type"] === "Product");
    expect(produtoLd).toBeDefined();
    expect(produtoLd).not.toHaveProperty("offers");
    expect(screen.getByRole("heading", { name: "Como funciona a compra" })).toBeInTheDocument();
    expect(screen.getByText("Escolha cor do xadrez, medida e quantidade.")).toBeInTheDocument();
    const outros = screen.getByRole("heading", { name: "Outros lenços" }).closest("section")!;
    expect(within(outros).getAllByRole("article")).toHaveLength(4);
    expect(within(outros).queryByText("Lenço carijó uma cor", { selector: "a" })).toBeNull();
    expect(screen.getByRole("link", { name: /Pedir agora no WhatsApp/ })).toBeInTheDocument();
  });

  it("produto que não existe vira 404", async () => {
    await expect(PaginaProduto({ params: Promise.resolve({ slug: "nao-existe" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
