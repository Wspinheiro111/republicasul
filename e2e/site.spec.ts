import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { redirecionamentosLegados } from "../content/site";

// Testes de navegação sobre o export estático (out/). Rode `npm run build` antes:
// o webServer do playwright.config.ts só serve a pasta out/.

const raiz = process.cwd();

/** Caminhos do sitemap gerado no build ("/", "/catalogo/", ...). */
function rotasDoSitemap(): string[] {
  let xml: string;
  try {
    xml = readFileSync(join(raiz, "out", "sitemap.xml"), "utf8");
  } catch {
    throw new Error("out/sitemap.xml não encontrado. Rode `npm run build` antes dos testes e2e.");
  }
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

// O /pedido/ fica fora do sitemap (noindex), mas é página do site e entra na varredura.
const ROTAS = [...rotasDoSitemap(), "/pedido/"];

/** Nada sai para a internet: o site não depende de terceiros para abrir. */
async function soLocal(page: Page) {
  await page.route(/^https?:\/\/(?!localhost(:\d+)?\/)/, (route) => route.abort());
}

function vigiarErros(page: Page): string[] {
  const erros: string[] = [];
  page.on("pageerror", (erro) => erros.push(`pageerror: ${erro.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") erros.push(`console: ${msg.text()}`);
  });
  return erros;
}

async function excessoHorizontal(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/** Desce a página inteira (sem rolagem suave), para as revelações rodarem. */
async function rolarAteOFim(page: Page) {
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  const passo = Math.round((page.viewportSize()?.height ?? 800) * 0.8);
  for (let y = 0; y < altura; y += passo) {
    await page.evaluate((valor) => window.scrollTo({ top: valor, behavior: "instant" }), y);
    await page.waitForTimeout(120);
  }
}

/** Abre e espera o React assumir a página (hidratação) antes de interagir. */
async function abrir(page: Page, caminho: string) {
  const resposta = await page.goto(caminho);
  await page.waitForLoadState("networkidle");
  return resposta;
}

/**
 * Escolhe uma opção como a pessoa faz: tocando no rótulo. Os radios das
 * opções são visualmente escondidos (sr-only) e o rótulo é o que aparece.
 */
async function escolher(radio: Locator) {
  await radio.locator("xpath=ancestor::label[1]").click();
  await expect(radio).toBeChecked();
}

test.beforeEach(async ({ page }) => soLocal(page));

test.describe("todas as rotas do sitemap", () => {
  test("o sitemap lista as páginas, as linhas e os produtos", () => {
    expect(ROTAS).toEqual(expect.arrayContaining(["/", "/catalogo/", "/montador/", "/produto/lenco-carijo-duas-cores/"]));
    expect(ROTAS.length).toBeGreaterThan(10);
  });

  for (const rota of ROTAS) {
    test(`${rota} abre sem erro de console e sem rolagem horizontal`, async ({ page }) => {
      const erros = vigiarErros(page);
      const resposta = await abrir(page, rota);
      expect(resposta?.status(), "status HTTP").toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      expect(await excessoHorizontal(page), "rolagem horizontal no topo").toBeLessThanOrEqual(0);
      await rolarAteOFim(page);
      expect(await excessoHorizontal(page), "rolagem horizontal depois de rolar").toBeLessThanOrEqual(0);
      expect(erros).toEqual([]);
    });
  }
});

test("caminho inexistente mostra a página 404 do site", async ({ page }) => {
  const resposta = await page.goto("/caminho-que-nao-existe/");
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Esse caminho não leva a lugar nenhum");
  await expect(page.getByRole("link", { name: "Ver os lenços" })).toBeVisible();
});

test("produto carijó duas cores: escolhe as cores, adiciona e o pedido leva tudo para o WhatsApp", async ({ page }) => {
  const erros = vigiarErros(page);
  await abrir(page, "/produto/lenco-carijo-duas-cores/");

  const painel = page.getByRole("region", { name: "Lenço carijó duas cores" });
  await escolher(painel.getByRole("group", { name: /Primeira cor/ }).getByRole("radio", { name: "Azul" }));
  await escolher(painel.getByRole("group", { name: /Segunda cor/ }).getByRole("radio", { name: "Branco" }));
  await escolher(painel.getByRole("group", { name: /Medida/ }).getByRole("radio", { name: "Medida especial" }));

  // O React registrou as escolhas: legenda, resumo e URL acompanham.
  await expect(painel.getByTestId("escolha-cor-1")).toHaveText("Azul");
  await expect(painel.getByTestId("escolha-cor-2")).toHaveText("Branco");
  await expect(painel.getByTestId("resumo-escolha")).toContainText("Medida: Medida especial");
  await expect(page).toHaveURL(/cor-1=azul/);
  await expect(page).toHaveURL(/cor-2=branco/);

  await painel.getByRole("button", { name: "Adicionar ao pedido", exact: true }).click();
  await expect(painel.getByRole("status")).toContainText("Adicionado ao seu pedido");
  await painel.getByRole("link", { name: "Ver seu pedido" }).click();

  await expect(page).toHaveURL(/\/pedido\/$/);
  const enviar = page.getByRole("link", { name: /Enviar pedido pelo WhatsApp/ });
  await expect(enviar).toBeVisible();
  await expect(enviar).toHaveAttribute("target", "_blank");
  const href = (await enviar.getAttribute("href")) ?? "";
  expect(href.startsWith("https://wa.me/")).toBe(true);
  const mensagem = decodeURIComponent(href);
  expect(mensagem).toContain("Lenço carijó duas cores");
  expect(mensagem).toContain("Primeira cor: Azul");
  expect(mensagem).toContain("Segunda cor: Branco");
  expect(mensagem).toContain("Medida: Medida especial");
  expect(mensagem).toContain("Quantidade: 1");
  expect(erros).toEqual([]);
});

test("montador gera o link com a combinação e reabre igual", async ({ page, context }) => {
  // Guarda o que o botão copiaria, sem depender da permissão da área de transferência.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (texto: string) => {
          (window as unknown as { __copiado?: string }).__copiado = texto;
        },
      },
    });
  });
  const erros = vigiarErros(page);
  await abrir(page, "/montador/");

  await escolher(page.getByRole("radio", { name: "Carijó uma cor" }));
  await escolher(page.getByRole("group", { name: /Cor do xadrez/ }).getByRole("radio", { name: "Verde" }));
  await escolher(page.getByRole("group", { name: /Medida/ }).getByRole("radio", { name: "Medida especial" }));

  await expect(page).toHaveURL(/\/montador\/\?modelo=carijo-uma-cor&cor=verde&medida=especial$/);

  await page.getByRole("button", { name: "Copiar link desta combinação" }).click();
  await expect(page.getByRole("button", { name: "Link copiado" })).toBeVisible();
  const copiado = await page.evaluate(() => (window as unknown as { __copiado?: string }).__copiado ?? "");
  const link = new URL(copiado);
  expect(link.pathname).toBe("/montador/");
  expect(Object.fromEntries(link.searchParams)).toEqual({ modelo: "carijo-uma-cor", cor: "verde", medida: "especial" });
  expect(erros).toEqual([]);

  // Outra aba, só com o link: volta a mesma combinação.
  const outra = await context.newPage();
  await soLocal(outra);
  const errosOutra = vigiarErros(outra);
  await abrir(outra, `${link.pathname}${link.search}`);
  await expect(outra.getByRole("radio", { name: "Carijó uma cor" })).toBeChecked();
  await expect(outra.getByRole("group", { name: /Cor do xadrez/ }).getByRole("radio", { name: "Verde" })).toBeChecked();
  await expect(outra.getByRole("group", { name: /Medida/ }).getByRole("radio", { name: "Medida especial" })).toBeChecked();
  const palco = outra.getByRole("region", { name: "Prévia do lenço" });
  await expect(palco).toContainText("Lenço carijó uma cor");
  await expect(palco).toContainText("Verde");
  await expect(outra).toHaveURL(/modelo=carijo-uma-cor&cor=verde&medida=especial$/);
  expect(errosOutra).toEqual([]);
});

test("as URLs antigas .php estão no vercel.json e levam a páginas que existem", async ({ page }) => {
  const vercel = JSON.parse(readFileSync(join(raiz, "vercel.json"), "utf8")) as {
    trailingSlash?: boolean;
    redirects: { source: string; destination: string; statusCode?: number; permanent?: boolean }[];
  };
  expect(vercel.trailingSlash).toBe(true);
  const legados = Object.entries(redirecionamentosLegados);
  expect(legados.length).toBeGreaterThan(0);

  for (const [origem, destino] of legados) {
    expect(origem).toMatch(/\.php$/);
    const regra = vercel.redirects.find((r) => r.source === origem);
    expect(regra, `${origem} no vercel.json`).toBeDefined();
    expect(regra?.destination).toBe(destino);
    expect(regra?.statusCode).toBe(301);

    const resposta = await page.goto(destino);
    expect(resposta?.status(), `${origem} -> ${destino}`).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveURL(new URL(destino, page.url()).toString());
  }
  // Nenhuma regra sobrando no vercel.json que não venha de content/site.ts.
  expect(vercel.redirects.map((r) => r.source).sort()).toEqual(legados.map(([origem]) => origem).sort());
});
