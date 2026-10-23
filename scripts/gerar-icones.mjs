/*
 * Gera, a partir do app/icon.svg (o mesmo desenho, sem arte nova):
 *
 *   app/favicon.ico     32x32, para navegadores e leitores que pedem /favicon.ico
 *   app/apple-icon.png  180x180, fundo couro (#1b130e) sem transparência, para
 *                       o ícone na tela inicial do iPhone (o iOS não usa SVG)
 *
 *   node scripts/gerar-icones.mjs
 *
 * O Next põe as tags <link> sozinho (convenção de arquivos do App Router) e,
 * no export estático, grava out/favicon.ico e out/apple-icon.png.
 * Rode de novo quando mudar o app/icon.svg. Os arquivos gerados vão para o git.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origem = join(raiz, "app", "icon.svg");
const COURO = "#1b130e";

/** Um .ico com uma imagem PNG dentro (formato aceito por todos os navegadores atuais). */
function icoComPng(png, tamanho) {
  const cabecalho = Buffer.alloc(6);
  cabecalho.writeUInt16LE(0, 0); // reservado
  cabecalho.writeUInt16LE(1, 2); // tipo: ícone
  cabecalho.writeUInt16LE(1, 4); // uma imagem
  const entrada = Buffer.alloc(16);
  entrada.writeUInt8(tamanho >= 256 ? 0 : tamanho, 0); // largura
  entrada.writeUInt8(tamanho >= 256 ? 0 : tamanho, 1); // altura
  entrada.writeUInt8(0, 2); // sem paleta
  entrada.writeUInt8(0, 3); // reservado
  entrada.writeUInt16LE(1, 4); // planos
  entrada.writeUInt16LE(32, 6); // bits por pixel
  entrada.writeUInt32LE(png.length, 8); // tamanho dos dados
  entrada.writeUInt32LE(6 + 16, 12); // onde os dados começam
  return Buffer.concat([cabecalho, entrada, png]);
}

const svg = await readFile(origem);

// Favicon: mantém a transparência dos cantos arredondados.
const png32 = await sharp(svg, { density: 384 }).resize(32, 32).png().toBuffer();
await writeFile(join(raiz, "app", "favicon.ico"), icoComPng(png32, 32));

// Apple: quadrado cheio, sem transparência (o iOS arredonda os cantos sozinho).
const apple = await sharp(svg, { density: 1440 }).resize(180, 180).flatten({ background: COURO }).png().toBuffer();
await writeFile(join(raiz, "app", "apple-icon.png"), apple);

console.log("Gerados app/favicon.ico (32x32) e app/apple-icon.png (180x180).");
