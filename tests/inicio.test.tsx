import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// "Reduzir movimento" controlado pelo teste.
let reduzirMovimento = false;
vi.mock("framer-motion", async (importOriginal) => {
  const real = await importOriginal<typeof import("framer-motion")>();
  return { ...real, useReducedMotion: () => reduzirMovimento };
});

import Inicio, { metadata } from "../app/page";
import ArteProduto from "../components/inicio/ArteProduto";
import Destaques, { produtosEmDestaque, resumoDaEscolha, textoDoValor } from "../components/inicio/Destaques";
import LencoHeroi, { CORES_HEROI, INTERVALO_HEROI } from "../components/inicio/LencoHeroi";
import MiniMontador, { juntarNomes } from "../components/inicio/MiniMontador";
import { PERGUNTAS } from "../components/inicio/Perguntas";
import { MENSAGEM_GERAL } from "../components/navegacao";
import { categorias, escolhasPadrao, produtoPorSlug, type Produto } from "../content/catalogo";
import { __reiniciarPedido, lerItens } from "../lib/pedido";
import { linkWhatsApp } from "../lib/whatsapp";

// No build (trailingSlash) os hrefs saem com barra no fim; no Vitest o
// next/link tira a barra. Compara sem ela.
const caminho = (el: Element) => (el.getAttribute("href") ?? "").replace(/\/$/, "") || "/";

const relogioFalso = () => vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout"] });

beforeEach(() => {
  reduzirMovimento = false;
  window.localStorage.clear();
  __reiniciarPedido();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete window.gtag;
});

describe("Página inicial", () => {
  it("tem um h1 só, que diz o que é, e as seções na ordem combinada", () => {
    const { container } = render(<Inicio />);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent("Lenço gaúcho tramado, do galpão ao desfile");

    const secoes = Array.from(container.querySelectorAll("section[aria-labelledby]")).map((s) => s.getAttribute("aria-labelledby"));
    expect(secoes).toEqual([
      "inicio-titulo",
      "inicio-categorias",
      "inicio-como-comprar",
      "inicio-montador",
      "inicio-destaques",
      "inicio-cores",
      "inicio-lojistas",
      "inicio-perguntas",
      "inicio-chamada",
    ]);
    // Cada seção aponta para um título que existe.
    for (const id of secoes) expect(container.querySelector(`#${id}`)).not.toBeNull();
  });

  it("o herói diz de onde é, mostra a assinatura e os caminhos de compra", () => {
    window.gtag = vi.fn();
    render(<Inicio />);
    const heroi = screen.getByRole("region", { name: /Lenço gaúcho tramado/ });
    expect(within(heroi).getByText("Porto Alegre · Rio Grande do Sul")).toBeInTheDocument();
    expect(within(heroi).getByText(/tramados artesanalmente, de forma única e original/)).toBeInTheDocument();
    expect(caminho(within(heroi).getByRole("link", { name: "Ver os lenços" }))).toBe("/catalogo");
    expect(caminho(within(heroi).getByRole("link", { name: "Monte o seu lenço" }))).toBe("/montador");

    const whats = within(heroi).getByRole("link", { name: /Chame no WhatsApp/ });
    expect(whats).toHaveAttribute("href", linkWhatsApp(MENSAGEM_GERAL));
    expect(whats).toHaveAttribute("target", "_blank");
    expect(whats).toHaveAttribute("rel", "noopener");
    fireEvent.click(whats);
    expect(window.gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "inicio-heroi", produto: undefined });

    // O lenço e o selo estão no herói.
    expect(within(heroi).getByRole("img", { name: "Desenho do lenço maragato" })).toBeInTheDocument();
    expect(within(heroi).getByRole("img", { name: /Selo Trama Republicasul/ })).toBeInTheDocument();
  });

  it("lista as cinco categorias com link para cada uma", () => {
    render(<Inicio />);
    const secao = screen.getByRole("region", { name: "Escolha pelo desenho" });
    expect(categorias).toHaveLength(5);
    for (const categoria of categorias) {
      const link = within(secao).getByRole("link", { name: categoria.nome });
      expect(caminho(link)).toBe(`/catalogo/${categoria.slug}`);
    }
    expect(within(secao).getAllByRole("listitem")).toHaveLength(categorias.length);
  });

  it("o foco do teclado traz o cartão de categoria inteiro para o trilho", () => {
    const rolar = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = rolar;
    render(<Inicio />);
    const secao = screen.getByRole("region", { name: "Escolha pelo desenho" });
    const link = within(secao).getByRole("link", { name: categorias[2].nome });
    act(() => link.focus());
    expect(rolar).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
    expect(rolar.mock.contexts[0]).toBe(link.closest("li"));
    Element.prototype.scrollIntoView = original;
  });

  it("explica a compra em três passos numerados", () => {
    render(<Inicio />);
    const secao = screen.getByRole("region", { name: /em três passos/ });
    const passos = within(secao).getAllByRole("listitem");
    expect(passos).toHaveLength(3);
    expect(passos[0]).toHaveTextContent("Passo 1: Escolha o lenço e as variações");
    expect(passos[1]).toHaveTextContent("Passo 2: Junte tudo na sua lista de pedido");
    expect(passos[2]).toHaveTextContent("Passo 3: Envie pelo WhatsApp e combine valor, prazo e entrega");
  });

  it("mostra a prévia do guia só com os fatos confirmados", () => {
    render(<Inicio />);
    const secao = screen.getByRole("region", { name: "As cores do lenço" });
    expect(secao).toHaveTextContent(/lenço vermelho é chamado de maragato/);
    expect(secao).toHaveTextContent(/lenço branco é o chimango/);
    expect(secao).toHaveTextContent(/Revolução Federalista, de 1893/);
    expect(secao).toHaveTextContent(/Revolução de 1923/);
    expect(secao).toHaveTextContent(/bandeira do Rio Grande do Sul/);
    expect(secao).toHaveTextContent(/termina em 20 de setembro/);
    expect(caminho(within(secao).getByRole("link", { name: /Ler o guia do lenço/ }))).toBe("/guia-do-lenco");
  });

  it("chama os lojistas para a página de revenda", () => {
    render(<Inicio />);
    const secao = screen.getByRole("region", { name: /Revenda Republicasul/ });
    expect(caminho(within(secao).getByRole("link", { name: "Quero revender" }))).toBe("/lojistas");
  });

  it("responde as perguntas sem prometer prazo, frete ou pagamento", () => {
    const { container } = render(<Inicio />);
    const secao = screen.getByRole("region", { name: "Perguntas de balcão" });
    const itens = secao.querySelectorAll("details");
    expect(itens).toHaveLength(PERGUNTAS.length);
    expect(Array.from(itens).map((d) => d.querySelector("summary")?.textContent)).toEqual(PERGUNTAS.map((p) => p.pergunta));
    expect(within(secao).getByText("Combinamos a entrega na conversa do WhatsApp.")).toBeInTheDocument();
    expect(caminho(within(secao).getByRole("link", { name: "Página para lojistas" }))).toBe("/lojistas");

    const faq = Array.from(container.querySelectorAll('script[type="application/ld+json"]'))
      .map((s) => JSON.parse(s.textContent ?? "{}"))
      .find((d) => d["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(PERGUNTAS.length);
    expect(faq.mainEntity[3].acceptedAnswer.text).toBe("Combinamos a entrega na conversa do WhatsApp.");
  });

  it("fecha com o WhatsApp na faixa maragato e registra a origem", () => {
    window.gtag = vi.fn();
    render(<Inicio />);
    const secao = screen.getByRole("region", { name: /Chame a gente no WhatsApp/ });
    const botao = within(secao).getByRole("link", { name: /Chamar no WhatsApp/ });
    expect(botao).toHaveAttribute("href", linkWhatsApp(MENSAGEM_GERAL));
    fireEvent.click(botao);
    expect(window.gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "inicio-final", produto: undefined });
    expect(caminho(within(secao).getByRole("link", { name: "Ver seu pedido" }))).toBe("/pedido");
  });

  it("todo link de WhatsApp sai pelo linkWhatsApp e abre em nova aba", () => {
    const { container } = render(<Inicio />);
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me"]'));
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d*\?text=/);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener");
      expect(link).toHaveTextContent("(abre o WhatsApp em nova aba)");
    }
  });

  it("não inventa preço, medida, prazo, pagamento nem números da empresa", () => {
    const { container } = render(<Inicio />);
    const texto = container.textContent ?? "";
    expect(texto).not.toMatch(/R\$/);
    expect(texto).not.toMatch(/\d\s?cm\b/i);
    expect(texto).not.toMatch(/dias úteis|frete grátis|parcel|\bpix\b|cartão de crédito|boleto/i);
    expect(texto).not.toMatch(/mais vendid|o maior|anos de (mercado|tradição|experiência)|clientes satisfeitos|depoimento|avaliaç/i);
    expect(texto).not.toMatch(/a confirmar/i);
    // Nenhum produto tem preço confirmado: todos os destaques dizem "Valor pelo WhatsApp".
    expect(screen.getAllByText("Valor pelo WhatsApp")).toHaveLength(produtosEmDestaque().length);
  });

  it("tem título, descrição e canonical próprios", () => {
    expect(metadata.title).toEqual({ absolute: "Republicasul | Lenços e palas gaúchos tramados artesanalmente" });
    expect(metadata.description).toMatch(/WhatsApp/);
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe("/");
  });
});

describe("Lenço do herói", () => {
  const nome = () => screen.getByTestId("cor-do-heroi");

  it("usa os quatro lenços tradicionais do catálogo", () => {
    expect(CORES_HEROI.map((c) => c.nome)).toEqual(["Maragato", "Chimango", "Azul royal", "Verde esmeralda"]);
    expect(INTERVALO_HEROI).toBe(2800);
  });

  it("troca de cor sozinho sem ficar anunciando, e escreve o nome embaixo", () => {
    relogioFalso();
    render(<LencoHeroi />);
    expect(nome()).toHaveTextContent("Maragato");
    expect(nome()).toHaveAttribute("aria-live", "off");
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI));
    expect(nome()).toHaveTextContent("Chimango");
    expect(screen.getByRole("img", { name: "Desenho do lenço chimango" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI * 2));
    expect(nome()).toHaveTextContent("Verde esmeralda");
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI));
    expect(nome()).toHaveTextContent("Maragato");
  });

  it("o botão pausa e retoma a troca", () => {
    relogioFalso();
    render(<LencoHeroi />);
    fireEvent.click(screen.getByRole("button", { name: "Pausar a troca de cores do lenço" }));
    expect(nome()).toHaveAttribute("aria-live", "polite");
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI * 3));
    expect(nome()).toHaveTextContent("Maragato");
    fireEvent.click(screen.getByRole("button", { name: "Retomar a troca de cores do lenço" }));
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI));
    expect(nome()).toHaveTextContent("Chimango");
  });

  it("escolher uma cor mostra o lenço dela e para a troca", () => {
    relogioFalso();
    render(<LencoHeroi />);
    const verde = screen.getByRole("button", { name: "Verde esmeralda" });
    expect(verde).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(verde);
    expect(verde).toHaveAttribute("aria-pressed", "true");
    expect(nome()).toHaveTextContent("Verde esmeralda");
    expect(nome()).toHaveAttribute("aria-live", "polite");
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI * 2));
    expect(nome()).toHaveTextContent("Verde esmeralda");
  });

  it("para enquanto o foco do teclado está nele", () => {
    relogioFalso();
    render(
      <>
        <LencoHeroi />
        <button type="button">fora</button>
      </>,
    );
    const chimango = screen.getByRole("button", { name: "Chimango" });
    act(() => chimango.focus());
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI * 2));
    expect(nome()).toHaveTextContent("Maragato");
    act(() => screen.getByRole("button", { name: "fora" }).focus());
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI));
    expect(nome()).toHaveTextContent("Chimango");
  });

  it("com reduzir movimento fica parado no maragato, sem botão de pausa", () => {
    reduzirMovimento = true;
    relogioFalso();
    render(<LencoHeroi />);
    act(() => vi.advanceTimersByTime(INTERVALO_HEROI * 3));
    expect(nome()).toHaveTextContent("Maragato");
    expect(nome()).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("button", { name: /Pausar/ })).toBeNull();
    // A escolha manual continua valendo.
    fireEvent.click(screen.getByRole("button", { name: "Azul royal" }));
    expect(nome()).toHaveTextContent("Azul royal");
  });
});

describe("Mini-montador", () => {
  const legenda = () => screen.getByTestId("legenda-montador");

  it("junta nomes de cor como se fala", () => {
    expect(juntarNomes(["Vermelho"])).toBe("Vermelho");
    expect(juntarNomes(["Vermelho", "Azul"])).toBe("Vermelho e azul");
    expect(juntarNomes(["Verde", "Vermelho", "Amarelo"])).toBe("Verde, vermelho e amarelo");
  });

  it("começa no carijó de duas cores, com cores diferentes", () => {
    render(<MiniMontador />);
    expect(screen.getByRole("radio", { name: "Carijó duas cores" })).toBeChecked();
    expect(legenda()).toHaveTextContent("Lenço carijó duas cores");
    expect(legenda()).toHaveTextContent("Vermelho e azul");
    expect(screen.getByRole("img", { name: "Desenho do lenço carijó duas cores, vermelho e azul" })).toBeInTheDocument();
  });

  it("trocar a cor muda o desenho e a legenda", () => {
    render(<MiniMontador />);
    const segunda = screen.getByRole("group", { name: /Segunda cor/ });
    fireEvent.click(within(segunda).getByRole("radio", { name: "Verde" }));
    expect(legenda()).toHaveTextContent("Vermelho e verde");
    expect(screen.getByRole("img", { name: "Desenho do lenço carijó duas cores, vermelho e verde" })).toBeInTheDocument();
  });

  it("no liso, cada cor é um lenço tradicional e o link leva até ele", () => {
    render(<MiniMontador />);
    fireEvent.click(screen.getByRole("radio", { name: "Liso" }));
    fireEvent.click(screen.getByRole("radio", { name: "Chimango" }));
    expect(legenda()).toHaveTextContent("Lenço tradicional Chimango");
    expect(legenda()).toHaveTextContent("Branco");
    expect(caminho(screen.getByRole("link", { name: "Ver este lenço" }))).toBe("/produto/lenco-tradicional-chimango");
  });

  it("no farroupilha não há cor para escolher", () => {
    render(<MiniMontador />);
    fireEvent.click(screen.getByRole("radio", { name: "Farroupilha" }));
    expect(screen.queryByRole("group", { name: /cor/i })).toBeNull();
    expect(screen.getByText(/cores são as da bandeira do Rio Grande do Sul/)).toBeInTheDocument();
    expect(legenda()).toHaveTextContent("Verde, vermelho e amarelo");
  });

  // O next/link do ambiente de teste tira a barra final ("/montador?..."); no build, trailingSlash a devolve.
  const hrefSemBarra = (el: Element) => (el.getAttribute("href") ?? "").replace(/\/(\?|$)/, "$1");

  it("leva para o montador completo e para o lenço com as cores escolhidas", () => {
    render(<MiniMontador />);
    const segunda = screen.getByRole("group", { name: /Segunda cor/ });
    fireEvent.click(within(segunda).getByRole("radio", { name: "Verde" }));
    expect(hrefSemBarra(screen.getByRole("link", { name: "Abrir o montador" }))).toBe("/montador?modelo=carijo-duas-cores&cor-1=vermelho&cor-2=verde");
    expect(hrefSemBarra(screen.getByRole("link", { name: "Ver este lenço" }))).toBe("/produto/lenco-carijo-duas-cores?cor-1=vermelho&cor-2=verde");
  });

  it("no liso, o montador abre no tradicional da cor escolhida", () => {
    render(<MiniMontador />);
    fireEvent.click(screen.getByRole("radio", { name: "Liso" }));
    fireEvent.click(screen.getByRole("radio", { name: "Chimango" }));
    expect(hrefSemBarra(screen.getByRole("link", { name: "Abrir o montador" }))).toBe("/montador?modelo=tradicional&cor=chimango");
  });
});

describe("Lenços em destaque", () => {
  it("mostra só os produtos em destaque, com link e valor pelo WhatsApp", () => {
    render(<Destaques />);
    const destaques = produtosEmDestaque();
    expect(destaques.length).toBeGreaterThan(0);
    for (const produto of destaques) {
      expect(caminho(screen.getByRole("link", { name: produto.nome }))).toBe(`/produto/${produto.slug}`);
    }
    expect(screen.queryByRole("link", { name: "Lenço tradicional Azul royal" })).toBeNull();
    expect(caminho(screen.getByRole("link", { name: /Ver todos os lenços e palas/ }))).toBe("/catalogo");
  });

  it("mostra o preço só quando o dono confirmar", () => {
    const pala = produtoPorSlug("pala")!;
    expect(textoDoValor(pala)).toBe("Valor pelo WhatsApp");
    expect(textoDoValor({ ...pala, preco: 120 })).toMatch(/R\$\s?120,00/);
  });

  it("diz com que escolha o lenço entra na lista", () => {
    const carijo = produtoPorSlug("lenco-carijo-duas-cores")!;
    expect(resumoDaEscolha(carijo)).toBe("Vermelho · Azul · Medida padrão");
    render(<Destaques />);
    expect(screen.getByText("Vermelho · Azul · Medida padrão")).toBeInTheDocument();
  });

  it("adicionar ao pedido põe a escolha padrão na lista e dá retorno visível", () => {
    relogioFalso();
    render(<Destaques />);
    const carijo = produtoPorSlug("lenco-carijo-duas-cores")!;
    const botao = screen.getByRole("button", { name: "Adicionar ao pedido: Lenço carijó duas cores" });
    fireEvent.click(botao);

    expect(lerItens()).toEqual([{ produto: carijo.slug, escolhas: escolhasPadrao(carijo), quantidade: 1 }]);
    expect(botao).toHaveTextContent("Adicionado");
    expect(screen.getByText("Adicionado ao pedido: Lenço carijó duas cores. Na sua lista: 1 peça.")).toHaveAttribute("role", "status");
    expect(caminho(screen.getByRole("link", { name: "Ver pedido" }))).toBe("/pedido");

    fireEvent.click(botao);
    expect(lerItens()[0].quantidade).toBe(2);
    expect(screen.getByText("2 peças")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2600));
    expect(botao).toHaveTextContent("Adicionar ao pedido");
  });
});

describe("Imagem do produto", () => {
  const base = produtoPorSlug("lenco-tradicional-maragato")!;

  it("sem foto, desenha o lenço", () => {
    render(<ArteProduto produto={base} />);
    expect(screen.getByRole("img", { name: "Desenho do lenço tradicional maragato" }).tagName.toLowerCase()).toBe("svg");
  });

  it("com foto real, mostra a foto e não o desenho", () => {
    const comFoto: Produto = { ...base, fotos: ["/fotos/maragato.jpg"] };
    render(<ArteProduto produto={comFoto} />);
    const foto = screen.getByRole("img", { name: base.nome });
    expect(foto.tagName.toLowerCase()).toBe("img");
    expect(foto.getAttribute("src")).toBe("/fotos/maragato.jpg");
    expect(screen.queryByRole("img", { name: /Desenho/ })).toBeNull();
  });
});
