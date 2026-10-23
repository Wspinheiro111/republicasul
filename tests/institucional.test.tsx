import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import GuiaDoLenco, { metadata as metaGuia } from "../app/guia-do-lenco/page";
import Lojistas, { metadata as metaLojistas } from "../app/lojistas/page";
import NaoEncontrada, { metadata as metaNaoEncontrada } from "../app/not-found";
import robots, * as moduloRobots from "../app/robots";
import sitemap, * as moduloSitemap from "../app/sitemap";
import Sobre, { metadata as metaSobre } from "../app/sobre/page";
import { contatosConfirmados, formatarTelefone, redesConfirmadas } from "../components/conteudo/contatos";
import FormularioLojista from "../components/conteudo/FormularioLojista";
import { CAMPOS_VAZIOS, linkLojista, mascararCnpj, validarLojista } from "../components/conteudo/lojista";
import { caminhosDoSitemap, configuracaoVercel, IMAGEM_COMPARTILHAMENTO, ROTAS_ESTATICAS } from "../components/conteudo/seo";
import { categorias, produtos } from "../content/catalogo";
import { contato, empresa, links, redirecionamentosLegados, SITE_URL } from "../content/site";
import { linkWhatsApp, mensagemLojista, numeroLojistas } from "../lib/whatsapp";

// O vitest roda a partir da raiz do projeto.
const raiz = (arquivo: string) => join(process.cwd(), arquivo);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.gtag;
});

// Texto que o visitante lê numa página (sem os scripts JSON-LD).
function textoVisivel(container: HTMLElement): string {
  const copia = container.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("script").forEach((s) => s.remove());
  return copia.textContent ?? "";
}

function jsonLdDa(container: HTMLElement, tipo: string) {
  const blocos = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent ?? "{}"));
  return blocos.find((b) => b["@type"] === tipo);
}

// ------------------------------------------------------------------
// Sitemap e robots
// ------------------------------------------------------------------

describe("sitemap.xml", () => {
  const urls = sitemap().map((e) => e.url);

  it("é gerado no build (export estático)", () => {
    expect(moduloSitemap.dynamic).toBe("force-static");
  });

  it("inclui todos os produtos e todas as categorias do catálogo", () => {
    for (const produto of produtos) expect(urls).toContain(`${SITE_URL}/produto/${produto.slug}/`);
    for (const categoria of categorias) expect(urls).toContain(`${SITE_URL}/catalogo/${categoria.slug}/`);
  });

  it("inclui as páginas fixas e deixa a lista de pedido de fora", () => {
    for (const rota of ROTAS_ESTATICAS) expect(urls).toContain(new URL(rota, SITE_URL).toString());
    expect(urls).toContain(`${SITE_URL}/guia-do-lenco/`);
    expect(urls).toContain(`${SITE_URL}/lojistas/`);
    expect(urls).toContain(`${SITE_URL}/sobre/`);
    expect(urls.some((u) => u.includes("/pedido"))).toBe(false);
  });

  it("usa URL absoluta, com barra no fim e sem repetir", () => {
    for (const url of urls) {
      expect(url.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(url.endsWith("/")).toBe(true);
    }
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(ROTAS_ESTATICAS.length + categorias.length + produtos.length);
  });

  it("não declara datas nem prioridades que não temos", () => {
    for (const entrada of sitemap()) expect(Object.keys(entrada)).toEqual(["url"]);
  });
});

describe("robots.txt", () => {
  it("libera o site (sem Disallow no /pedido/, que usa noindex) e aponta o sitemap", () => {
    expect(moduloRobots.dynamic).toBe("force-static");
    const r = robots();
    const regras = Array.isArray(r.rules) ? r.rules : [r.rules];
    // Bloquear /pedido/ impediria o Google de ler o noindex da página.
    expect(regras).toEqual([{ userAgent: "*", allow: "/" }]);
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

// ------------------------------------------------------------------
// vercel.json
// ------------------------------------------------------------------

describe("vercel.json", () => {
  const arquivo = JSON.parse(readFileSync(raiz("vercel.json"), "utf8"));

  it("está em sincronia com redirecionamentosLegados (content/site.ts)", () => {
    const esperado = configuracaoVercel();
    expect(arquivo, `Atualize o vercel.json para:\n${JSON.stringify(esperado, null, 2)}`).toEqual(esperado);
  });

  it("redireciona cada URL antiga com 301 para uma página que existe", () => {
    const destinos = new Set(caminhosDoSitemap());
    const legados = Object.entries(redirecionamentosLegados);
    expect(arquivo.redirects).toHaveLength(legados.length);
    for (const [source, destination] of legados) {
      expect(arquivo.redirects).toContainEqual({ source, destination, statusCode: 301 });
      expect(destinos.has(destination), `${destination} não está no sitemap`).toBe(true);
      expect(destination.endsWith("/")).toBe(true);
    }
  });

  it("usa barra no fim e cache longo para /_next/static", () => {
    expect(arquivo.trailingSlash).toBe(true);
    const cache = arquivo.headers.find((h: { source: string }) => h.source === "/_next/static/(.*)");
    expect(cache.headers).toContainEqual({ key: "Cache-Control", value: "public, max-age=31536000, immutable" });
  });
});

describe("imagem de compartilhamento", () => {
  it("public/og.png existe e é um PNG 1200x630", () => {
    const png = readFileSync(raiz(`public${IMAGEM_COMPARTILHAMENTO.url}`));
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(IMAGEM_COMPARTILHAMENTO.width);
    expect(png.readUInt32BE(20)).toBe(IMAGEM_COMPARTILHAMENTO.height);
  });
});

// ------------------------------------------------------------------
// Metadados
// ------------------------------------------------------------------

describe("metadados das páginas de conteúdo", () => {
  const paginas = [
    { meta: metaGuia, caminho: "/guia-do-lenco/" },
    { meta: metaLojistas, caminho: "/lojistas/" },
    { meta: metaSobre, caminho: "/sobre/" },
  ];

  it("cada página tem título, descrição e canonical próprios", () => {
    const titulos = paginas.map((p) => p.meta.title);
    const descricoes = paginas.map((p) => p.meta.description);
    expect(new Set(titulos).size).toBe(paginas.length);
    expect(new Set(descricoes).size).toBe(paginas.length);
    for (const { meta, caminho } of paginas) {
      expect(meta.alternates?.canonical).toBe(caminho);
      expect(meta.openGraph).toMatchObject({ url: caminho, locale: "pt_BR", siteName: empresa.nome });
      expect(String(meta.description).length).toBeGreaterThan(70);
      expect(String(meta.description).length).toBeLessThanOrEqual(200);
    }
  });

  it("a 404 tem título próprio e não vai para o Google", () => {
    expect(metaNaoEncontrada.title).toBe("Página não encontrada");
    expect(metaNaoEncontrada.robots).toMatchObject({ index: false });
  });
});

// ------------------------------------------------------------------
// Guia do lenço
// ------------------------------------------------------------------

describe("Guia do lenço", () => {
  it("tem um h1 e um sumário com âncoras para seções que existem", () => {
    const { container } = render(<GuiaDoLenco />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const sumario = screen.getByRole("navigation", { name: "Neste guia" });
    const ancoras = within(sumario).getAllByRole("link");
    expect(ancoras.map((a) => a.getAttribute("href"))).toEqual([
      "#cores",
      "#farroupilha",
      "#liso-ou-carijo",
      "#como-escolher",
      "#cuidados",
    ]);
    for (const a of ancoras) expect(container.querySelector(a.getAttribute("href")!)).not.toBeNull();
  });

  it("conta só os fatos permitidos sobre as cores e a Semana Farroupilha", () => {
    const { container } = render(<GuiaDoLenco />);
    const texto = textoVisivel(container);
    expect(texto).toMatch(/lenço vermelho é chamado de maragato e o branco, de chimango/);
    expect(texto).toContain("Revolução Federalista de 1893");
    expect(texto).toContain("Revolução de 1923");
    expect(texto).toContain("verde, vermelho e amarelo");
    expect(texto).toContain("20 de setembro");
    expect(texto).toMatch(/xadrez miúdo/);
  });

  it("não contém palavras proibidas nem promessas inventadas", () => {
    const { container } = render(<GuiaDoLenco />);
    const tudo = [textoVisivel(container), String(metaGuia.title), String(metaGuia.description)].join(" ").toLowerCase();
    for (const proibida of ["o maior", "o que mais vende", "r$", "a confirmar", "mtg"]) {
      expect(tudo, `"${proibida}" não pode aparecer no guia`).not.toContain(proibida);
    }
    // Cuidados: nada de instrução de lavagem inventada, só pedir na conversa.
    const cuidados = textoVisivel(container.querySelector("#cuidados") as HTMLElement).toLowerCase();
    for (const instrucao of ["água", "máquina", "ferro", "alvejante", "sabão", "secar"]) expect(cuidados).not.toContain(instrucao);
    expect(cuidados).toContain("peça as recomendações");
  });

  it("ilustra cada padrão com o lenço desenhado", () => {
    render(<GuiaDoLenco />);
    expect(screen.getByRole("img", { name: /maragato, vermelho/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /chimango, branco/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /farroupilha, em verde, vermelho e amarelo/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /carijó de uma cor/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /carijó de duas cores/ })).toBeInTheDocument();
  });

  it("publica o JSON-LD Article em pt-BR com a Republicasul como editora", () => {
    const { container } = render(<GuiaDoLenco />);
    const artigo = jsonLdDa(container, "Article");
    expect(artigo).toMatchObject({
      "@context": "https://schema.org",
      headline: metaGuia.title,
      inLanguage: "pt-BR",
      publisher: { "@type": "Organization", name: "Republicasul" },
    });
    expect(jsonLdDa(container, "BreadcrumbList")).toBeTruthy();
  });

  it("os links do WhatsApp abrem em nova aba e registram a origem", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { container } = render(<GuiaDoLenco />);
    const whats = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]'));
    expect(whats.length).toBeGreaterThanOrEqual(2);
    for (const a of whats) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    }
    expect(decodeURIComponent(whats[0].href)).toContain("foto da pilcha");
    fireEvent.click(whats[0]);
    expect(gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "guia-do-lenco", produto: undefined });
  });
});

// ------------------------------------------------------------------
// Lojistas
// ------------------------------------------------------------------

describe("regras do formulário de lojista", () => {
  it("mascara o CNPJ enquanto a pessoa digita", () => {
    expect(mascararCnpj("00")).toBe("00");
    expect(mascararCnpj("00607")).toBe("00.607");
    expect(mascararCnpj("00607826")).toBe("00.607.826");
    expect(mascararCnpj("006078260001")).toBe("00.607.826/0001");
    expect(mascararCnpj("00607826000113")).toBe("00.607.826/0001-13");
    expect(mascararCnpj("00.607.826/0001-13999")).toBe("00.607.826/0001-13");
    expect(mascararCnpj("abc")).toBe("");
  });

  it("exige nome da loja e cidade; CNPJ só se vier completo", () => {
    expect(validarLojista(CAMPOS_VAZIOS)).toEqual({ loja: expect.any(String), cidade: expect.any(String) });
    expect(validarLojista({ ...CAMPOS_VAZIOS, loja: "  ", cidade: "Lages/SC" })).toHaveProperty("loja");
    expect(validarLojista({ ...CAMPOS_VAZIOS, loja: "Casa do Peão", cidade: "Lages/SC", cnpj: "12.345" })).toHaveProperty("cnpj");
    expect(validarLojista({ ...CAMPOS_VAZIOS, loja: "Casa do Peão", cidade: "Lages/SC" })).toEqual({});
    expect(validarLojista({ ...CAMPOS_VAZIOS, loja: "Casa do Peão", cidade: "Lages/SC", cnpj: "00.607.826/0001-13" })).toEqual({});
  });

  it("gera o link com mensagemLojista e o número dos lojistas", () => {
    const campos = { loja: "Casa do Peão", cnpj: "00607826000113", cidade: "Lages/SC", responsavel: "Ana", interesse: "Carijós" };
    expect(linkLojista(campos)).toBe(
      linkWhatsApp(
        mensagemLojista({ loja: "Casa do Peão", cnpj: "00.607.826/0001-13", cidade: "Lages/SC", responsavel: "Ana", interesse: "Carijós" }),
        numeroLojistas(),
      ),
    );
    // Sem CNPJ, a linha do CNPJ não entra na mensagem.
    expect(decodeURIComponent(linkLojista({ ...campos, cnpj: "" }))).not.toContain("CNPJ");
  });
});

describe("FormularioLojista", () => {
  let abrir: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    abrir = vi.fn(() => ({ opener: window }) as unknown as Window);
    vi.spyOn(window, "open").mockImplementation(abrir as unknown as typeof window.open);
  });

  function montar() {
    render(
      <>
        <h2 id="titulo-teste">Dados da loja</h2>
        <FormularioLojista idTitulo="titulo-teste" />
      </>,
    );
    return {
      form: screen.getByRole("form", { name: "Dados da loja" }),
      loja: screen.getByLabelText(/Nome da loja/),
      cnpj: screen.getByLabelText(/CNPJ/),
      cidade: screen.getByLabelText(/Cidade/),
      responsavel: screen.getByLabelText(/Responsável/),
      interesse: screen.getByLabelText(/O que você quer revender/),
      enviar: screen.getByRole("button", { name: /Enviar pelo WhatsApp/ }),
    };
  }

  it("todo campo tem label e os obrigatórios são marcados", () => {
    const f = montar();
    expect(f.loja).toBeRequired();
    expect(f.cidade).toBeRequired();
    expect(f.cnpj).not.toBeRequired();
    expect(f.responsavel).not.toBeRequired();
    expect(f.interesse.tagName).toBe("TEXTAREA");
  });

  it("não envia com campos obrigatórios vazios e liga os avisos aos campos", () => {
    const f = montar();
    fireEvent.click(f.enviar);
    expect(abrir).not.toHaveBeenCalled();

    for (const campo of [f.loja, f.cidade]) {
      expect(campo).toHaveAttribute("aria-invalid", "true");
      const ids = campo.getAttribute("aria-describedby")!.split(" ");
      const erro = ids.map((id) => document.getElementById(id)!).find((el) => el.id.endsWith("-erro"));
      expect(erro).toBeTruthy();
      expect(erro!.textContent).toMatch(/Escreva/);
    }
    expect(f.cnpj).not.toHaveAttribute("aria-invalid");
    expect(document.activeElement).toBe(f.loja);
    expect(screen.getByRole("alert")).toHaveTextContent("Falta corrigir 2 campos");
  });

  it("depois do primeiro envio, o aviso some quando o campo é corrigido", () => {
    const f = montar();
    fireEvent.click(f.enviar);
    fireEvent.change(f.loja, { target: { value: "Casa do Peão" } });
    expect(f.loja).not.toHaveAttribute("aria-invalid");
    expect(f.cidade).toHaveAttribute("aria-invalid", "true");
  });

  it("avisa CNPJ incompleto", () => {
    const f = montar();
    fireEvent.change(f.loja, { target: { value: "Casa do Peão" } });
    fireEvent.change(f.cidade, { target: { value: "Lages/SC" } });
    fireEvent.change(f.cnpj, { target: { value: "123" } });
    fireEvent.click(f.enviar);
    expect(abrir).not.toHaveBeenCalled();
    expect(f.cnpj).toHaveAttribute("aria-invalid", "true");
    expect(document.activeElement).toBe(f.cnpj);
  });

  it("com os dados certos, abre o WhatsApp dos lojistas com a mensagem pronta", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const f = montar();
    fireEvent.change(f.loja, { target: { value: "Casa do Peão" } });
    fireEvent.change(f.cnpj, { target: { value: "00607826000113" } });
    expect(f.cnpj).toHaveValue("00.607.826/0001-13");
    fireEvent.change(f.cidade, { target: { value: "Lages/SC" } });
    fireEvent.change(f.responsavel, { target: { value: "Ana" } });
    fireEvent.change(f.interesse, { target: { value: "Carijós e palas" } });
    act(() => {
      fireEvent.click(f.enviar);
    });

    const esperado = linkWhatsApp(
      mensagemLojista({ loja: "Casa do Peão", cnpj: "00.607.826/0001-13", cidade: "Lages/SC", responsavel: "Ana", interesse: "Carijós e palas" }),
      numeroLojistas(),
    );
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(abrir).toHaveBeenCalledWith(esperado, "_blank");
    expect(gtag).toHaveBeenCalledWith("event", "clique_whatsapp", { origem: "lojistas", produto: undefined });

    // Reserva, se a nova aba for bloqueada: o mesmo link, em nova aba.
    const reserva = screen.getByRole("link", { name: /Abrir o WhatsApp/ });
    expect(reserva).toHaveAttribute("href", esperado);
    expect(reserva).toHaveAttribute("target", "_blank");
  });
});

describe("página Para lojistas", () => {
  it("tem um h1, as linhas do catálogo e não inventa condições", () => {
    const { container } = render(<Lojistas />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const categoria of categorias) expect(screen.getByRole("heading", { level: 3, name: categoria.nome })).toBeInTheDocument();
    const texto = textoVisivel(container).toLowerCase();
    expect(texto).toContain("condições para lojistas");
    for (const inventado of ["pedido mínimo", "desconto", "r$", "%", "a confirmar"]) expect(texto).not.toContain(inventado);
    expect(container.querySelector("#formulario form")).not.toBeNull();
  });

  it("os links diretos do WhatsApp usam o número dos lojistas", () => {
    const { container } = render(<Lojistas />);
    const whats = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]'));
    expect(whats.length).toBeGreaterThan(0);
    for (const a of whats) {
      expect(a.getAttribute("href")!.startsWith(`https://wa.me/${numeroLojistas().replace(/\D/g, "")}?`)).toBe(true);
      expect(a).toHaveAttribute("data-origem", "lojistas");
      expect(a).toHaveAttribute("target", "_blank");
    }
  });
});

// ------------------------------------------------------------------
// Sobre
// ------------------------------------------------------------------

describe("Sobre a Republicasul", () => {
  it("mostra empresa, CNPJ, cidade e a seção #contato", () => {
    const { container } = render(<Sobre />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const texto = textoVisivel(container);
    expect(texto).toContain(empresa.cnpj);
    expect(texto).toContain(`${empresa.cidade}/${empresa.uf}`);
    expect(texto).toContain(empresa.assinatura);
    const secaoContato = container.querySelector("#contato") as HTMLElement;
    expect(secaoContato).not.toBeNull();
    expect(within(secaoContato).getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("no contato, só aparece o que está preenchido em content/site.ts", () => {
    const { container } = render(<Sobre />);
    const secaoContato = container.querySelector("#contato") as HTMLElement;
    const texto = textoVisivel(secaoContato);
    if (!contato.telefone) expect(texto).not.toContain("Telefone");
    if (!contato.email) expect(texto).not.toContain("E-mail");
    if (!contato.endereco) expect(texto).not.toContain("Endereço");
    if (!contato.horario) expect(texto).not.toContain("Horário");
    if (!links.instagram) expect(within(secaoContato).queryByRole("link", { name: /Instagram/ })).toBeNull();
    const facebook = within(secaoContato).getByRole("link", { name: /Facebook/ });
    expect(facebook).toHaveAttribute("href", links.facebook);
    expect(facebook).toHaveAttribute("target", "_blank");
    expect(textoVisivel(container).toLowerCase()).not.toContain("a confirmar");
  });

  it("contatosConfirmados e redesConfirmadas escondem campos vazios", () => {
    const vazio = { whatsapp: "", whatsappLojistas: "", telefone: "", email: "", endereco: "", horario: "" };
    expect(contatosConfirmados(vazio)).toEqual([]);
    const cheio = contatosConfirmados({ ...vazio, whatsapp: "5551999998888", email: "loja@exemplo.com", horario: " " });
    expect(cheio).toEqual([
      { rotulo: "WhatsApp", valor: "+55 51 99999-8888" },
      { rotulo: "E-mail", valor: "loja@exemplo.com", href: "mailto:loja@exemplo.com" },
    ]);
    expect(redesConfirmadas({ facebook: "https://facebook.com/x", instagram: "" })).toEqual([{ nome: "Facebook", href: "https://facebook.com/x" }]);
    expect(formatarTelefone("51 3333-4444")).toBe("51 3333-4444");
  });
});

// ------------------------------------------------------------------
// 404
// ------------------------------------------------------------------

describe("página 404", () => {
  it("fala gaúcho e oferece catálogo, montador e WhatsApp", () => {
    const { container } = render(<NaoEncontrada />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Esse caminho não leva a lugar nenhum, tchê");
    // next/link só acrescenta a barra final no build (trailingSlash); no teste ela pode faltar.
    expect(screen.getByRole("link", { name: "Ver os lenços" }).getAttribute("href")).toMatch(/^\/catalogo\/?$/);
    expect(screen.getByRole("link", { name: "Monte o seu lenço" }).getAttribute("href")).toMatch(/^\/montador\/?$/);
    const whats = container.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!;
    expect(whats).toHaveAttribute("target", "_blank");
    expect(whats).toHaveAttribute("data-origem", "404");
  });
});
