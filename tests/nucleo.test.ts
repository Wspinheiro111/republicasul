import { beforeEach, describe, expect, it } from "vitest";
import { categorias, coresDasEscolhas, escolhasPadrao, produtoPorSlug, produtos } from "../content/catalogo";
import { redirecionamentosLegados } from "../content/site";
import { linkWhatsApp, mensagemLojista, mensagemPedido, mensagemProduto } from "../lib/whatsapp";
import { __reiniciarPedido, adicionarItem, alterarQuantidade, lerItens, removerItem, totalDePecas } from "../lib/pedido";

describe("catálogo", () => {
  it("tem slugs únicos e toda categoria de produto existe", () => {
    const slugs = produtos.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const cats = new Set(categorias.map((c) => c.slug));
    for (const p of produtos) expect(cats.has(p.categoria)).toBe(true);
    for (const c of categorias) expect(produtos.some((p) => p.categoria === c.slug)).toBe(true);
  });

  it("não publica preço sem confirmação", () => {
    for (const p of produtos) expect(p.preco).toBeUndefined();
  });

  it("redirecionamentos antigos apontam para categorias que existem", () => {
    for (const destino of Object.values(redirecionamentosLegados)) {
      if (destino === "/") continue;
      const slug = destino.split("/")[2];
      expect(categorias.some((c) => c.slug === slug)).toBe(true);
    }
  });

  it("usa as cores escolhidas no desenho do carijó", () => {
    const carijo = produtoPorSlug("lenco-carijo-duas-cores")!;
    expect(coresDasEscolhas(carijo, { "cor-1": "azul", "cor-2": "branco", medida: "padrao" })).toEqual(["#2c5aa0", "#f3efe6"]);
    const uma = produtoPorSlug("lenco-carijo-uma-cor")!;
    expect(coresDasEscolhas(uma, { cor: "verde" })).toEqual(["#2e7d32", "#f3efe6"]);
  });
});

describe("mensagens do WhatsApp", () => {
  it("leva produto, variações e quantidade", () => {
    const p = produtoPorSlug("lenco-carijo-duas-cores")!;
    const texto = mensagemProduto({ produto: p.slug, escolhas: { ...escolhasPadrao(p), "cor-2": "branco" }, quantidade: 2 });
    expect(texto).toContain("Lenço carijó duas cores");
    expect(texto).toContain("Primeira cor: Vermelho · Segunda cor: Branco · Medida: Medida padrão");
    expect(texto).toContain("Quantidade: 2");
  });

  it("numera os itens do pedido e soma as peças", () => {
    const texto = mensagemPedido(
      [
        { produto: "lenco-tradicional-maragato", escolhas: { medida: "padrao" }, quantidade: 3 },
        { produto: "lenco-farroupilha", escolhas: { medida: "especial" }, quantidade: 1 },
        { produto: "nao-existe", escolhas: {}, quantidade: 5 },
      ],
      { nome: " Ana ", cidade: "Santa Maria" },
    );
    expect(texto).toContain("1) Lenço tradicional Maragato");
    expect(texto).toContain("2) Lenço farroupilha");
    expect(texto).toContain("Medida: Medida especial");
    expect(texto).toContain("Total de peças: 4");
    expect(texto).toContain("Nome: Ana");
    expect(texto).not.toContain("nao-existe");
  });

  it("codifica o texto no link", () => {
    expect(linkWhatsApp("Olá & tchau", "+55 (51) 99999-0000")).toBe("https://wa.me/5551999990000?text=Ol%C3%A1%20%26%20tchau");
    expect(linkWhatsApp("oi", "")).toBe("https://wa.me/?text=oi");
  });

  it("mensagem de lojista omite campos vazios", () => {
    const texto = mensagemLojista({ loja: "Bolicho do Sul", cidade: "Pelotas", cnpj: " " });
    expect(texto).toContain("Loja: Bolicho do Sul");
    expect(texto).not.toContain("CNPJ");
  });
});

describe("lista de pedido", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __reiniciarPedido();
  });

  it("junta a mesma variação e separa variações diferentes", () => {
    adicionarItem({ produto: "lenco-carijo-uma-cor", escolhas: { cor: "azul", medida: "padrao" }, quantidade: 1 });
    adicionarItem({ produto: "lenco-carijo-uma-cor", escolhas: { medida: "padrao", cor: "azul" }, quantidade: 2 });
    adicionarItem({ produto: "lenco-carijo-uma-cor", escolhas: { cor: "verde", medida: "padrao" }, quantidade: 1 });
    expect(lerItens()).toHaveLength(2);
    expect(lerItens()[0].quantidade).toBe(3);
    expect(totalDePecas(lerItens())).toBe(4);
  });

  it("limita a quantidade e remove itens", () => {
    adicionarItem({ produto: "pala", escolhas: {}, quantidade: 1 });
    alterarQuantidade(0, 500);
    expect(lerItens()[0].quantidade).toBe(99);
    alterarQuantidade(0, 0);
    expect(lerItens()[0].quantidade).toBe(1);
    removerItem(0);
    expect(lerItens()).toHaveLength(0);
  });

  it("guarda no navegador e ignora dados corrompidos", () => {
    adicionarItem({ produto: "pala", escolhas: {}, quantidade: 2 });
    expect(JSON.parse(window.localStorage.getItem("republicasul:pedido:v1")!)).toHaveLength(1);
    window.localStorage.setItem("republicasul:pedido:v1", "[{\"produto\":\"x\"}, 3, null]");
    __reiniciarPedido();
    expect(lerItens()).toEqual([]);
  });
});
