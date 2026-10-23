/*
 * Gera public/og.png (1200x630), a imagem de compartilhamento do site
 * (WhatsApp, Facebook, Google). Desenha o lenço, sem foto.
 *
 *   npm run og
 *
 * (Node 22.18 ou mais novo executa o content/site.ts direto; em versões
 * anteriores, rode com node --experimental-strip-types scripts/gerar-og.mjs)
 *
 * Por que um script e não app/opengraph-image.tsx: no export estático, o Next
 * grava a imagem gerada como "out/opengraph-image", sem extensão. Servidores
 * estáticos entregam isso como application/octet-stream e, com trailingSlash
 * na Vercel, "/opengraph-image" é redirecionado para "/opengraph-image/", que
 * não existe. Um PNG de verdade em public/ evita os dois problemas.
 *
 * Rode de novo quando mudar o nome, a cidade ou o desenho. O arquivo gerado
 * vai para o git (é pequeno e não muda a cada build).
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";
import { empresa } from "../content/site.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "public", "og.png");

const COURO = "#1b130e";
const COURO_2 = "#2a1d15";
const CREME = "#f3ecdf";
const CREME_2 = "#e6dccb";
const OURO = "#c9a14a";
const MARAGATO = "#b3121b";
const MARAGATO_ESCURO = "#8c0e15";

// Franjas finas nas duas bordas de baixo do lenço (pontos fixos, sem acaso).
function franjas() {
  const linhas = [];
  const passo = 9;
  for (let t = passo; t < 255; t += passo) {
    const k = t / Math.SQRT2;
    linhas.push(`M${(20 + k).toFixed(1)} ${(180 + k).toFixed(1)} l-6 6`);
    linhas.push(`M${(380 - k).toFixed(1)} ${(180 + k).toFixed(1)} l6 6`);
  }
  return linhas.join(" ");
}

// Lenço em losango dobrado em triângulo: a metade de cima tomba para trás,
// com sombra suave no vinco e a trama de fios cruzados por cima da cor.
function lenco() {
  const metadeCima = "M200 79 L380 180 L20 180 Z";
  const metadeBaixo = "M20 180 L380 180 L200 360 Z";
  return h(
    "svg",
    { width: 470, height: 470, viewBox: "0 0 400 400" },
    h(
      "defs",
      null,
      h(
        "pattern",
        { id: "trama", width: 6, height: 6, patternUnits: "userSpaceOnUse" },
        h("path", { d: "M0 0.5 H6 M0.5 0 V6", stroke: "#000", strokeOpacity: 0.16, strokeWidth: 1 }),
      ),
      h(
        "linearGradient",
        { id: "vinco", x1: 0, y1: 0, x2: 0, y2: 1 },
        h("stop", { offset: "0", stopColor: "#000", stopOpacity: 0.32 }),
        h("stop", { offset: "0.3", stopColor: "#000", stopOpacity: 0.06 }),
        h("stop", { offset: "1", stopColor: "#000", stopOpacity: 0 }),
      ),
    ),
    h("path", { d: franjas(), stroke: MARAGATO, strokeWidth: 2, strokeLinecap: "round" }),
    h("path", { d: metadeCima, fill: MARAGATO_ESCURO }),
    h("path", { d: metadeCima, fill: "url(#trama)" }),
    h("path", { d: metadeBaixo, fill: MARAGATO }),
    h("path", { d: metadeBaixo, fill: "url(#trama)" }),
    h("path", { d: metadeBaixo, fill: "url(#vinco)" }),
    h("path", { d: "M20 180 L380 180", stroke: "#000", strokeOpacity: 0.35, strokeWidth: 1.5 }),
    h("path", { d: "M50 190 L350 190 L200 336 Z", fill: "none", stroke: OURO, strokeWidth: 2.4, strokeDasharray: "9 7" }),
  );
}

const flex = (style, ...filhos) => h("div", { style: { display: "flex", ...style } }, ...filhos);

const arte = flex(
  {
    width: "100%",
    height: "100%",
    backgroundColor: COURO,
    backgroundImage: `linear-gradient(135deg, ${COURO_2} 0%, ${COURO} 55%)`,
    color: CREME,
    padding: "64px 72px",
    position: "relative",
  },
  // Pesponto dourado por dentro da borda, como couro costurado.
  flex({ position: "absolute", top: 22, left: 22, right: 22, bottom: 22, border: `2px dashed ${OURO}`, opacity: 0.55, borderRadius: 6 }),
  flex(
    { flexDirection: "column", justifyContent: "center", width: 640 },
    flex({ fontSize: 26, letterSpacing: 5, color: OURO, textTransform: "uppercase" }, `Lenços e palas · ${empresa.cidade}/${empresa.uf}`),
    flex({ fontSize: 112, lineHeight: 1, marginTop: 22, letterSpacing: -3, color: CREME }, empresa.nome),
    flex({ width: 520, height: 3, marginTop: 34, borderTop: `3px dashed ${OURO}` }),
    flex({ fontSize: 36, lineHeight: 1.3, marginTop: 30, color: CREME_2 }, "Lenços e palas da indumentária gaúcha, tramados artesanalmente."),
    flex({ fontSize: 26, marginTop: 28, color: OURO }, "Monte o pedido e mande pelo WhatsApp"),
  ),
  flex({ flex: 1, alignItems: "center", justifyContent: "center", transform: "rotate(-7deg)" }, lenco()),
);

const resposta = new ImageResponse(arte, { width: 1200, height: 630 });
const png = Buffer.from(await resposta.arrayBuffer());
await writeFile(destino, png);
console.log(`Gerado ${destino} (${Math.round(png.length / 1024)} KB)`);
