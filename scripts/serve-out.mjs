/*
 * Servidor estático mínimo para a pasta out/ (export do Next).
 * Usado pelos testes visuais com Playwright. Uso: npm run serve [porta]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const raiz = join(process.cwd(), "out");
const porta = Number(process.argv[2] || process.env.PORT || 4173);
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

createServer(async (req, res) => {
  let caminho = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let arquivo = join(raiz, caminho);
  try {
    if ((await stat(arquivo)).isDirectory()) arquivo = join(arquivo, "index.html");
  } catch {}
  try {
    const corpo = await readFile(arquivo);
    res.writeHead(200, { "content-type": tipos[extname(arquivo)] || "application/octet-stream" });
    res.end(corpo);
  } catch {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(await readFile(join(raiz, "404.html")).catch(() => "404"));
  }
}).listen(porta, () => console.log(`Servindo out/ em http://localhost:${porta}`));
