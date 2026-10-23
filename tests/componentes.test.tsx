import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalogo/",
}));

import BotaoWhatsApp from "../components/BotaoWhatsApp";
import Cabecalho from "../components/Cabecalho";
import LencoArte from "../components/LencoArte";
import Quantidade from "../components/Quantidade";
import SeletorOpcoes from "../components/SeletorOpcoes";
import Trilha from "../components/Trilha";
import { escolhasPadrao, produtoPorSlug } from "../content/catalogo";
import { __reiniciarPedido, adicionarItem } from "../lib/pedido";
import { linkWhatsApp } from "../lib/whatsapp";

afterEach(() => cleanup());

describe("LencoArte", () => {
  it("é uma imagem acessível com o título", () => {
    render(<LencoArte padrao="liso" cores={["#b3121b"]} titulo="Desenho do lenço maragato" />);
    const img = screen.getByRole("img", { name: "Desenho do lenço maragato" });
    expect(img.tagName.toLowerCase()).toBe("svg");
    expect(img.querySelector("title")?.textContent).toBe("Desenho do lenço maragato");
  });

  it("aplica as cores recebidas no desenho", () => {
    const { container } = render(<LencoArte padrao="farroupilha" cores={["#2e7d32", "#b3121b", "#e3b21c"]} titulo="Farroupilha" />);
    const preenchidos = Array.from(container.querySelectorAll<SVGElement>("[style]")).map((el) => el.style.fill.toLowerCase());
    const html = container.innerHTML.toLowerCase();
    for (const cor of ["#2e7d32", "#b3121b", "#e3b21c"]) {
      const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16)).join(", ")})`;
      expect(preenchidos.some((f) => f === cor || f === rgb) || html.includes(cor)).toBe(true);
    }
  });

  it("carijó e pala também desenham com as cores escolhidas", () => {
    const { container, rerender } = render(<LencoArte padrao="carijo" cores={["#2c5aa0", "#f3efe6"]} titulo="Carijó" />);
    expect(container.querySelector("pattern[id$='-carijo']")).not.toBeNull();
    rerender(<LencoArte padrao="pala" cores={["#6b3e23", "#f3efe6"]} titulo="Pala" />);
    expect(screen.getByRole("img", { name: "Pala" })).toBeInTheDocument();
  });

  it("usa ids únicos quando há dois desenhos na mesma página", () => {
    const { container } = render(
      <>
        <LencoArte padrao="carijo" cores={["#b3121b", "#f3efe6"]} titulo="Um" />
        <LencoArte padrao="carijo" cores={["#2e7d32", "#f3efe6"]} titulo="Dois" />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    expect(ids.length).toBeGreaterThan(4);
    expect(new Set(ids).size).toBe(ids.length);
    // Cada desenho referencia só os próprios padrões.
    const [um, dois] = Array.from(container.querySelectorAll("svg[role=img]"));
    const refs = (svg: Element) => (svg.innerHTML.match(/url\(#([^)]+)\)/g) ?? []).map((r) => r.slice(5, -1));
    for (const ref of refs(um)) expect(um.querySelector(`[id="${ref}"]`)).not.toBeNull();
    for (const ref of refs(dois)) expect(dois.querySelector(`[id="${ref}"]`)).not.toBeNull();
  });

  it("é determinístico: duas renderizações iguais geram o mesmo desenho", () => {
    const a = render(<LencoArte padrao="liso" cores={["#1f3fa6"]} titulo="A" />).container.innerHTML;
    const b = render(<LencoArte padrao="liso" cores={["#1f3fa6"]} titulo="A" />).container.innerHTML;
    const semIds = (s: string) => s.replace(/lenco[^"'#)\s-]*-/g, "ID-");
    expect(semIds(a)).toBe(semIds(b));
  });
});

describe("SeletorOpcoes", () => {
  const carijo = produtoPorSlug("lenco-carijo-uma-cor")!;

  it("clicar numa cor avisa a opção e o valor", () => {
    const aoMudar = vi.fn();
    render(<SeletorOpcoes opcoes={carijo.opcoes} escolhas={escolhasPadrao(carijo)} aoMudar={aoMudar} />);
    fireEvent.click(screen.getByRole("radio", { name: "Azul" }));
    expect(aoMudar).toHaveBeenCalledWith("cor", "azul");
  });

  it("agrupa cada opção com legenda, mostra a cor escolhida e a ajuda", () => {
    render(<SeletorOpcoes opcoes={carijo.opcoes} escolhas={{ cor: "verde", medida: "especial" }} aoMudar={() => {}} />);
    const grupo = screen.getByRole("group", { name: /Cor do xadrez/ });
    expect(grupo).toHaveAccessibleDescription("Outras cores sob consulta.");
    expect(screen.getByTestId("escolha-cor")).toHaveTextContent("Verde");
    expect(screen.getByRole("radio", { name: "Verde" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Medida especial" })).toBeChecked();
  });
});

describe("Quantidade", () => {
  it("respeita os limites de 1 a 99", () => {
    const aoMudar = vi.fn();
    const { rerender } = render(<Quantidade valor={1} aoMudar={aoMudar} />);
    expect(screen.getByRole("button", { name: "Diminuir quantidade" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    expect(aoMudar).toHaveBeenLastCalledWith(2);
    rerender(<Quantidade valor={99} aoMudar={aoMudar} />);
    expect(screen.getByRole("button", { name: "Aumentar quantidade" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "500" } });
    expect(aoMudar).toHaveBeenCalledTimes(1);
  });
});

describe("BotaoWhatsApp", () => {
  it("monta o link com a mensagem, abre em nova aba e registra o clique", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(
      <BotaoWhatsApp texto="Olá, Republicasul!" origem="produto" produto="pala" numero="5551999990000">
        Pedir agora no WhatsApp
      </BotaoWhatsApp>,
    );
    const link = screen.getByRole("link", { name: /Pedir agora no WhatsApp/ });
    expect(link).toHaveAttribute("href", linkWhatsApp("Olá, Republicasul!", "5551999990000"));
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    fireEvent.click(link);
    expect(gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "produto", produto: "pala" });
    delete window.gtag;
  });

  it("sem número usa o contato padrão do site", () => {
    render(<BotaoWhatsApp texto="oi" origem="rodape" />);
    expect(screen.getByRole("link", { name: /Chamar no WhatsApp/ })).toHaveAttribute("href", linkWhatsApp("oi"));
  });
});

describe("Cabecalho", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __reiniciarPedido();
  });

  it("o contador do pedido acompanha a lista", () => {
    render(<Cabecalho />);
    expect(screen.getByTestId("contador-pedido")).toHaveTextContent("0");
    act(() => {
      adicionarItem({ produto: "lenco-tradicional-maragato", escolhas: { medida: "padrao" }, quantidade: 2 });
      adicionarItem({ produto: "pala", escolhas: {}, quantidade: 1 });
    });
    expect(screen.getByTestId("contador-pedido")).toHaveTextContent("3");
    // No build (trailingSlash) o href sai "/pedido/"; no Vitest o next/link tira a barra final.
    expect(screen.getByRole("link", { name: /Seu pedido.*3 peças/ }).getAttribute("href")).toMatch(/^\/pedido\/?$/);
  });

  it("marca a página atual e abre/fecha o menu do celular com Esc", () => {
    render(<Cabecalho />);
    const principal = screen.getByRole("navigation", { name: "Principal" });
    expect(principal.querySelector('[aria-current="page"]')).toHaveTextContent("Lenços");
    const botao = screen.getByRole("button", { name: "Abrir menu" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("menu-celular")).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Trilha", () => {
  it("põe o Início, marca a página atual e gera o JSON-LD", () => {
    const { container } = render(
      <Trilha
        itens={[
          { nome: "Lenços", href: "/catalogo/" },
          { nome: "Pala", href: "/produto/pala/" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Trilha" });
    expect(nav.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText("Pala")).toHaveAttribute("aria-current", "page");
    const dados = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(dados["@type"]).toBe("BreadcrumbList");
    expect(dados.itemListElement[2].item).toBe("https://www.republicasul.com.br/produto/pala/");
  });
});
