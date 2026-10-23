/*
 * Verifica os links internos do site exportado (pasta out/).
 * Percorre cada página .html e confere se todo href/src interno, o canonical,
 * o og:url e o og:image apontam para um arquivo que existe no export, e se a
 * âncora (#id) existe na página de destino. Confere também as URLs do
 * sitemap.xml, o Sitemap do robots.txt e os destinos dos redirecionamentos do
 * vercel.json (URLs antigas .php).
 * Lê SITE_URL de content/site.ts (Node 22.18+ executa TypeScript simples).
 *
 * Uso: npm run build && npm run check:links
 * Sai com código 1 se algum link interno estiver quebrado.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { SITE_URL } from "../content/site.ts";

const raiz = join(process.cwd(), "out");
if (!existsSync(raiz)) {
  console.error("Pasta out/ não encontrada. Rode `npm run build` antes.");
  process.exit(1);
}

const origem = new URL(SITE_URL).origin;
// Links que saem do site ou não são páginas.
const ignorar = /^(mailto:|tel:|sms:|javascript:|data:|blob:|#$)/i;

function listarHtml(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return listarHtml(caminho);
    return nome.endsWith(".html") ? [caminho] : [];
  });
}

// out/catalogo/index.html -> /catalogo/ · out/404.html -> /404.html
function urlDaPagina(arquivo) {
  const rel = relative(raiz, arquivo).split(sep).join("/");
  return "/" + (rel.endsWith("index.html") ? rel.slice(0, -"index.html".length) : rel);
}

// Caminho do site -> arquivo em out/ (ou null). Com trailingSlash, "/sobre/" é out/sobre/index.html.
function arquivoDoCaminho(caminho) {
  let limpo;
  try {
    limpo = decodeURIComponent(caminho);
  } catch {
    return null;
  }
  const alvo = join(raiz, limpo);
  if (!alvo.startsWith(raiz)) return null;
  if (limpo.endsWith("/")) return existsSync(join(alvo, "index.html")) ? join(alvo, "index.html") : null;
  if (existsSync(alvo) && statSync(alvo).isFile()) return alvo;
  return null;
}

const decodificar = (texto) =>
  texto.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const idsPorArquivo = new Map();
function idsDe(arquivo) {
  if (!idsPorArquivo.has(arquivo)) {
    const html = readFileSync(arquivo, "utf8");
    idsPorArquivo.set(arquivo, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decodificar(m[1]))));
  }
  return idsPorArquivo.get(arquivo);
}

const problemas = [];
const avisos = [];
let verificados = 0;

/** Confere um link encontrado em `onde`, resolvido a partir de `base` (URL da página). */
function conferir(bruto, onde, base, { exigirBarra = true } = {}) {
  const valor = decodificar(bruto.trim());
  if (!valor || ignorar.test(valor)) return;
  let url;
  try {
    url = new URL(valor, origem + base);
  } catch {
    problemas.push({ onde, link: valor, motivo: "URL inválida" });
    return;
  }
  if (url.origin !== origem) return; // link externo (WhatsApp, Facebook...): não é deste script
  verificados++;
  const caminho = url.pathname;
  const arquivo = arquivoDoCaminho(caminho);
  if (!arquivo) {
    // Sem a barra final, a hospedagem redireciona ("/sobre" -> "/sobre/"); avisa, mas não quebra.
    if (!caminho.endsWith("/") && arquivoDoCaminho(caminho + "/")) {
      if (exigirBarra) avisos.push({ onde, link: valor, motivo: "sem a barra final (vai redirecionar)" });
      return;
    }
    problemas.push({ onde, link: valor, motivo: "página ou arquivo inexistente" });
    return;
  }
  const ancora = url.hash ? decodeURIComponent(url.hash.slice(1)) : "";
  if (ancora && arquivo.endsWith(".html") && !idsDe(arquivo).has(ancora)) {
    problemas.push({ onde, link: valor, motivo: `âncora #${ancora} não existe na página` });
  }
}

// 1. Páginas: href, src e as metas com URL absoluta do site (og:url, og:image).
const paginas = listarHtml(raiz);
for (const arquivo of paginas) {
  const html = readFileSync(arquivo, "utf8");
  const base = urlDaPagina(arquivo);
  const onde = relative(process.cwd(), arquivo);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) conferir(m[1], onde, base);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const parte of m[1].split(",")) conferir(parte.trim().split(/\s+/)[0] ?? "", onde, base);
  }
  for (const m of html.matchAll(/<meta\s[^>]*content="([^"]*)"[^>]*>/g)) {
    if (m[1].startsWith(origem + "/")) conferir(m[1], onde, base);
  }
}

// 2. sitemap.xml e robots.txt.
const sitemap = join(raiz, "sitemap.xml");
if (existsSync(sitemap)) {
  for (const m of readFileSync(sitemap, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) conferir(m[1], "out/sitemap.xml", "/");
} else {
  problemas.push({ onde: "out/", link: "sitemap.xml", motivo: "sitemap.xml não foi gerado" });
}
const robots = join(raiz, "robots.txt");
if (existsSync(robots)) {
  for (const m of readFileSync(robots, "utf8").matchAll(/^Sitemap:\s*(\S+)/gim)) conferir(m[1], "out/robots.txt", "/");
}

// 3. Redirecionamentos do vercel.json (URLs antigas do site em PHP).
const vercel = join(process.cwd(), "vercel.json");
if (existsSync(vercel)) {
  const { redirects = [] } = JSON.parse(readFileSync(vercel, "utf8"));
  for (const r of redirects) conferir(r.destination, `vercel.json (${r.source})`, "/");
}

const linhas = [
  "# Verificação de links internos",
  "",
  `${paginas.length} páginas, ${verificados} links internos verificados, ${problemas.length} com problema.`,
  "",
];
if (problemas.length) {
  linhas.push("| Onde | Link | Problema |", "| --- | --- | --- |");
  for (const p of problemas) linhas.push(`| ${p.onde} | ${p.link} | ${p.motivo} |`);
  linhas.push("");
}
if (avisos.length) {
  linhas.push(`Avisos (${avisos.length}):`, "");
  for (const a of avisos) linhas.push(`- ${a.onde}: ${a.link} (${a.motivo})`);
}
const relatorio = linhas.join("\n");
console.log(relatorio);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, relatorio + "\n");
}
process.exit(problemas.length ? 1 : 0);
