"use client";

/*
 * LencoArte: o DESENHO do lenço (ou do pala) em SVG. Ilustração, não foto.
 * Usado enquanto o produto não tem fotografia real e como peça central do visual.
 *
 *   <LencoArte padrao="liso" cores={["#b3121b"]} titulo="Desenho do lenço maragato" />
 *   <LencoArte padrao="carijo" cores={coresDasEscolhas(produto, escolhas)} titulo="..." animado />
 *
 * Props
 * - padrao: "liso" | "carijo" | "farroupilha" | "pala"
 * - cores: string[] em hex. liso = [cor]; carijo = [xadrez, fundo claro] ou
 *   [cor 1, cor 2] (ver coresDasEscolhas no catálogo); farroupilha = [verde,
 *   vermelho, amarelo]; pala = [campo, listra, listra opcional].
 * - titulo: vira <title> e aria-label (role="img"). Obrigatório.
 * - className: classes do <svg> (ele ocupa 100% da largura, proporção 1:1,
 *   viewBox fixo 0 0 400 400).
 * - animado: balanço suave (Framer Motion). Desligado com "reduzir movimento".
 * - mostrarFranja: franjas finas nas bordas (padrão: true).
 *
 * O lenço é um quadrado visto em losango, levemente dobrado em triângulo na
 * diagonal (a metade de cima tomba para trás), com sombra suave na dobra,
 * trama de fios cruzados por cima da cor e franjas finas.
 *
 * Determinístico (sem Math.random): o mesmo SVG no servidor e no navegador.
 * Ids de pattern/clip únicos por instância (useId), então várias instâncias
 * convivem na mesma página. A troca de cores tem transição suave via CSS.
 *
 * Também exporta <LencoCiclo>, que alterna variações de cor com balanço,
 * botão de pausa e respeito a "reduzir movimento" (bom para o herói), e
 * luminancia(hex), útil para escolher texto claro/escuro sobre uma cor.
 */

import { motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { Padrao } from "../content/catalogo";
import { useReduzirMovimento } from "./movimento";

export type LencoArteProps = {
  padrao: Padrao;
  cores: string[];
  titulo: string;
  className?: string;
  animado?: boolean;
  mostrarFranja?: boolean;
};

const PADRAO_CORES: Record<Padrao, string[]> = {
  liso: ["#b3121b"],
  carijo: ["#b3121b", "#f3efe6"],
  farroupilha: ["#2e7d32", "#b3121b", "#e3b21c"],
  pala: ["#6b3e23", "#f3efe6"],
};

const BRANCO = "#f3efe6";
const TRANSICAO = "fill 0.7s ease, stroke 0.7s ease";

// ------------------------------------------------------------------
// Utilidades de cor (só hex; outras cores caem num meio-termo seguro).
// ------------------------------------------------------------------

function canais(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, "");
  const cheio = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(cheio)) return null;
  return [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16)) as [number, number, number];
}

/** Luminância relativa (WCAG) de uma cor hex, de 0 (preto) a 1 (branco). */
export function luminancia(hex: string): number {
  const c = canais(hex);
  if (!c) return 0.3;
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ehClara = (hex: string) => luminancia(hex) > 0.45;

// Número "aleatório" fixo a partir de um inteiro (hash), entre 0 e 1.
function ruido(n: number): number {
  return ((Math.imul(n + 1, 2654435761) >>> 0) % 1000) / 1000;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

// ------------------------------------------------------------------
// Geometria do lenço.
// Coordenadas do pano: losango com pontas em (200,0) (380,180) (200,360) (20,180).
// A diagonal horizontal (y = 180) é o vinco; a metade de cima tomba para trás,
// então aparece achatada (fator ACHATAR) na tela.
// ------------------------------------------------------------------

type Ponto = { x: number; y: number };
const TOPO: Ponto = { x: 200, y: 0 };
const DIR: Ponto = { x: 380, y: 180 };
const BAIXO: Ponto = { x: 200, y: 360 };
const ESQ: Ponto = { x: 20, y: 180 };
const VINCO = 180;
const ACHATAR = 0.56;
const TOPO_TELA = r1(VINCO - VINCO * ACHATAR);
const PERSPECTIVA = `matrix(1 0 0 ${ACHATAR} 0 ${r1(VINCO * (1 - ACHATAR))})`;
const DESLOCAR = "translate(0 -10)";

const projetarY = (y: number) => (y < VINCO ? VINCO - (VINCO - y) * ACHATAR : y);

const SILHUETA = `M200 ${TOPO_TELA} L${DIR.x} ${DIR.y} L${BAIXO.x} ${BAIXO.y} L${ESQ.x} ${ESQ.y} Z`;
const METADE_CIMA_TELA = `M200 ${TOPO_TELA} L${DIR.x} ${VINCO} L${ESQ.x} ${VINCO} Z`;
const METADE_CIMA_PANO = `M200 0 L${DIR.x} ${VINCO} L${ESQ.x} ${VINCO} Z`;
const METADE_BAIXO = `M${ESQ.x} ${VINCO} L${DIR.x} ${VINCO} L${BAIXO.x} ${BAIXO.y} Z`;

function losangoRecuado(d: number): string {
  const k = d * Math.SQRT2;
  return `M200 ${r1(TOPO.y + k)} L${r1(DIR.x - k)} 180 L200 ${r1(BAIXO.y - k)} L${r1(ESQ.x + k)} 180 Z`;
}

// Faixas do farroupilha (verde em cima, vermelho na diagonal, amarelo embaixo).
const FAIXA_VERMELHA = { de: 132, ate: 228 };

type Franja = { d: string; indiceCor: number };

/*
 * Franjas ao longo das quatro bordas, apontando para fora, já projetadas na
 * tela (as da metade de cima ficam achatadas junto com o pano).
 * Agrupadas por índice de cor para virar poucos <path>.
 */
function franjasDoLosango(corPorY: (y: number) => number): Franja[] {
  const bordas: [Ponto, Ponto][] = [
    [TOPO, DIR],
    [DIR, BAIXO],
    [BAIXO, ESQ],
    [ESQ, TOPO],
  ];
  const passo = 3.7;
  const grupos = new Map<number, string>();
  let n = 0;
  for (const [a, b] of bordas) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const comp = Math.hypot(dx, dy);
    const ux = dx / comp;
    const uy = dy / comp;
    // Normal para fora (o losango é percorrido no sentido horário).
    const nx = uy;
    const ny = -ux;
    for (let s = 5; s <= comp - 5; s += passo) {
      n++;
      const x = a.x + ux * s;
      const y = a.y + uy * s;
      const tam = 7 + ruido(n) * 5;
      const torto = (ruido(n * 7) - 0.5) * 2.2;
      const x2 = x + nx * tam + ux * torto;
      const y2 = y + ny * tam + uy * torto;
      const seg = `M${r1(x)} ${r1(projetarY(y))}L${r1(x2)} ${r1(projetarY(y2))}`;
      const i = corPorY(y);
      grupos.set(i, (grupos.get(i) ?? "") + seg);
    }
  }
  return [...grupos.entries()].map(([indiceCor, d]) => ({ indiceCor, d }));
}

// ------------------------------------------------------------------
// Geometria do pala: retângulo largo, listras verticais, franjas nas pontas.
// ------------------------------------------------------------------

const PALA = { x0: 40, x1: 360, y0: 96, y1: 304 };

function franjasDoPala() {
  let d = "";
  let nos = "";
  let n = 0;
  for (let y = PALA.y0 + 5; y <= PALA.y1 - 5; y += 3.4) {
    n++;
    const tam = 16 + ruido(n) * 6;
    const torto = (ruido(n * 3) - 0.5) * 3;
    d += `M${PALA.x0 + 1} ${r1(y)}L${r1(PALA.x0 - tam)} ${r1(y + torto)}`;
    d += `M${PALA.x1 - 1} ${r1(y)}L${r1(PALA.x1 + tam)} ${r1(y - torto)}`;
    if (n % 3 === 0) {
      nos += `M${PALA.x0 - 6} ${r1(y - 3.4)}m-1.9 0a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0`;
      nos += `M${PALA.x1 + 6} ${r1(y - 3.4)}m-1.9 0a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0 -3.8 0`;
    }
  }
  return { d, nos };
}
const FRANJAS_PALA = franjasDoPala();

// Listras perto de cada ponta: [deslocamento a partir da ponta, largura, índice da cor].
const LISTRAS_PALA: [number, number, number][] = [
  [14, 10, 1],
  [28, 3, 1],
  [35, 3, 2],
  [42, 3, 1],
  [51, 13, 2],
  [69, 3, 1],
];

// Contorno levemente ondulado (caimento do pano).
const CONTORNO_PALA =
  `M${PALA.x0} ${PALA.y0 + 2} C 110 ${PALA.y0 - 5}, 150 ${PALA.y0 + 5}, 200 ${PALA.y0} S 300 ${PALA.y0 - 4}, ${PALA.x1} ${PALA.y0 + 2}` +
  ` L ${PALA.x1} ${PALA.y1 - 2} C 300 ${PALA.y1 + 5}, 250 ${PALA.y1 - 4}, 200 ${PALA.y1 + 1} S 100 ${PALA.y1 + 5}, ${PALA.x0} ${PALA.y1 - 2} Z`;

// ------------------------------------------------------------------
// Componente
// ------------------------------------------------------------------

export default function LencoArte({ padrao, cores, titulo, className, animado = false, mostrarFranja = true }: LencoArteProps) {
  const idBruto = useId();
  const base = `lenco${idBruto.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const id = (nome: string) => `${base}-${nome}`;
  const url = (nome: string) => `url(#${id(nome)})`;

  const reduzir = useReduzirMovimento();
  const balancar = animado && !reduzir;

  const paleta = cores.length > 0 ? cores : PADRAO_CORES[padrao];
  const c = (i: number) => paleta[i] ?? paleta[paleta.length - 1] ?? PADRAO_CORES[padrao][i] ?? "#b3121b";

  const tinta = (cor: string) => ({ fill: cor, transition: TRANSICAO });
  const traco = (cor: string) => ({ stroke: cor, transition: TRANSICAO });

  const balanco = balancar
    ? {
        animate: { rotate: [0, 1.5, 0, -1.5, 0], y: [0, 3, 0, 3, 0] },
        transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
      }
    : { animate: { rotate: 0, y: 0 }, transition: { duration: 0.6 } };

  // Trama: fios finos cruzados, por cima da cor, em baixa opacidade.
  const padraoTrama = (girar: boolean) => (
    <pattern id={id("trama")} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform={girar ? "rotate(45)" : undefined}>
      <rect width="5" height="1" fill="#fff" opacity="0.12" />
      <rect y="2.5" width="5" height="1" fill="#000" opacity="0.09" />
      <rect width="1" height="5" fill="#000" opacity="0.07" />
      <rect x="2.5" width="1" height="5" fill="#fff" opacity="0.07" />
    </pattern>
  );

  const svgProps = {
    viewBox: "0 0 400 400",
    role: "img",
    "aria-label": titulo,
    className,
    style: { width: "100%", height: "auto", display: "block", overflow: "visible" } as const,
  };

  const desfoque = (
    <filter id={id("desfoque")} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="7" />
    </filter>
  );

  // ---------------- Pala ----------------
  if (padrao === "pala") {
    const campo = c(0);
    const contraste = ehClara(campo) ? "#6b3e23" : BRANCO;
    const listra = (i: number) => (i === 0 ? campo : (paleta[i] ?? paleta[1] ?? contraste));
    const fioTom = ehClara(campo) ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
    const largura = PALA.x1 - PALA.x0;
    return (
      <svg {...svgProps}>
        <title>{titulo}</title>
        <defs>
          {padraoTrama(false)}
          {desfoque}
          <clipPath id={id("corpo")}>
            <path d={CONTORNO_PALA} />
          </clipPath>
          <linearGradient id={id("caimento")} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.22" />
            <stop offset="0.12" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="0.26" stopColor="#000" stopOpacity="0.12" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0.09" />
            <stop offset="0.55" stopColor="#000" stopOpacity="0.08" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="0.85" stopColor="#000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0.24" />
          </linearGradient>
          <linearGradient id={id("luz")} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <motion.g style={{ originX: "50%", originY: "0%" }} initial={false} {...balanco}>
          <path d={CONTORNO_PALA} transform="translate(0 12)" fill="#000" opacity="0.3" filter={url("desfoque")} />
          {mostrarFranja && (
            <g aria-hidden="true">
              <path d={FRANJAS_PALA.d} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
              <path d={FRANJAS_PALA.d} fill="none" strokeWidth="1.15" strokeLinecap="round" style={traco(campo)} />
              <path d={FRANJAS_PALA.nos} style={tinta(campo)} />
              <path d={FRANJAS_PALA.nos} fill="#000" opacity="0.22" />
            </g>
          )}
          <g clipPath={url("corpo")}>
            <rect x="0" y="0" width="400" height="400" style={tinta(campo)} />
            {/* Fios finos tom sobre tom no campo do pala. */}
            {Array.from({ length: Math.floor(largura / 11) }, (_, i) => (
              <rect key={i} x={PALA.x0 + 5 + i * 11} y="0" width="1.4" height="400" fill={fioTom} />
            ))}
            {LISTRAS_PALA.flatMap(([desloc, larg, indice], i) => [
              <rect key={`e${i}`} x={PALA.x0 + desloc} y="0" width={larg} height="400" style={tinta(listra(indice))} />,
              <rect key={`d${i}`} x={PALA.x1 - desloc - larg} y="0" width={larg} height="400" style={tinta(listra(indice))} />,
            ])}
            <rect x="0" y="0" width="400" height="400" fill={url("trama")} />
            <rect x="0" y="0" width="400" height="400" fill={url("caimento")} />
            <rect x="0" y="0" width="400" height="400" fill={url("luz")} />
          </g>
          <path d={CONTORNO_PALA} fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1.2" />
        </motion.g>
      </svg>
    );
  }

  // ---------------- Lenço (liso, carijó, farroupilha) ----------------

  const claro = ehClara(c(0));
  const corOurela = claro ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)";

  // Carijó: com fundo claro (uma cor) o xadrez cruza a mesma cor nos dois
  // sentidos; com duas cores, uma vai na horizontal e a outra na vertical.
  const umaCorCarijo = paleta.length < 2 || ehClara(c(1));
  const fundoCarijo = umaCorCarijo && paleta.length > 1 ? c(1) : BRANCO;
  const corH = c(0);
  const corV = umaCorCarijo ? c(0) : c(1);
  const opacidadeCarijo = umaCorCarijo ? 0.55 : 0.72;

  const corPorY = (y: number) => {
    if (padrao !== "farroupilha") return 0;
    if (y < FAIXA_VERMELHA.de) return 0;
    if (y < FAIXA_VERMELHA.ate) return 1;
    return 2;
  };
  const franjas = mostrarFranja ? franjasDoLosango(corPorY) : [];

  // O pano em coordenadas do tecido. Desenhado duas vezes: metade de baixo
  // como está, metade de cima achatada pela dobra.
  const tecido = () => {
    if (padrao === "farroupilha") {
      return (
        <>
          <rect x="0" y="0" width="400" height={FAIXA_VERMELHA.de} style={tinta(c(0))} />
          <rect x="0" y={FAIXA_VERMELHA.de} width="400" height={FAIXA_VERMELHA.ate - FAIXA_VERMELHA.de} style={tinta(c(1))} />
          <rect x="0" y={FAIXA_VERMELHA.ate} width="400" height={400 - FAIXA_VERMELHA.ate} style={tinta(c(2))} />
          <rect x="0" y="0" width="400" height="400" fill={url("trama")} />
        </>
      );
    }
    if (padrao === "carijo") {
      return (
        <>
          <rect x="0" y="0" width="400" height="400" fill={url("carijo")} />
          <rect x="0" y="0" width="400" height="400" fill={url("trama")} opacity="0.7" />
        </>
      );
    }
    return (
      <>
        <rect x="0" y="0" width="400" height="400" style={tinta(c(0))} />
        <rect x="0" y="0" width="400" height="400" fill={url("trama")} />
        {/* Ourela: barra fina perto da borda, tom sobre tom. */}
        <path d={losangoRecuado(10)} fill="none" stroke={corOurela} strokeWidth="2.4" />
        <path d={losangoRecuado(15)} fill="none" stroke={corOurela} strokeWidth="0.9" />
      </>
    );
  };

  return (
    <svg {...svgProps}>
      <title>{titulo}</title>
      <defs>
        {padraoTrama(true)}
        {desfoque}
        {padrao === "carijo" && (
          <pattern id={id("carijo")} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="9" height="9" style={tinta(fundoCarijo)} />
            <rect width="9" height="4.5" opacity={opacidadeCarijo} style={tinta(corH)} />
            <rect width="4.5" height="9" opacity={opacidadeCarijo} style={tinta(corV)} />
          </pattern>
        )}
        <clipPath id={id("cima")}>
          <path d={METADE_CIMA_PANO} />
        </clipPath>
        <clipPath id={id("baixo")}>
          <path d={METADE_BAIXO} />
        </clipPath>
        {/* Luz geral: de cima à esquerda para baixo à direita. */}
        <linearGradient id={id("luz")} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.26" />
        </linearGradient>
        {/* Metade de cima, tombada para trás: mais escura perto do vinco. */}
        <linearGradient id={id("tombada")} x1="0" y1={TOPO_TELA} x2="0" y2={VINCO} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        {/* Sombra suave da dobra sobre a metade de baixo. */}
        <linearGradient id={id("dobra")} x1="0" y1={VINCO} x2="0" y2={VINCO + 46} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.g style={{ originX: "50%", originY: "0%" }} initial={false} {...balanco}>
        <g transform={DESLOCAR}>
          {/* Sombra do pano sobre o fundo. */}
          <path d={SILHUETA} transform="translate(0 12)" fill="#000" opacity="0.3" filter={url("desfoque")} />

          {mostrarFranja && (
            <g aria-hidden="true">
              {franjas.map(({ indiceCor, d }) => (
                <g key={indiceCor}>
                  <path d={d} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="1.8" strokeLinecap="round" />
                  <path d={d} fill="none" strokeWidth="1" strokeLinecap="round" style={traco(c(indiceCor))} />
                </g>
              ))}
            </g>
          )}

          {/* Metade de baixo, de frente. */}
          <g clipPath={url("baixo")}>{tecido()}</g>
          {/* Metade de cima, tombada para trás (achatada). */}
          <g transform={PERSPECTIVA}>
            <g clipPath={url("cima")}>{tecido()}</g>
          </g>

          <path d={METADE_CIMA_TELA} fill={url("tombada")} />
          <path d={METADE_BAIXO} fill={url("dobra")} />
          <path d={SILHUETA} fill={url("luz")} />
          {/* Vinco: um fio de luz bem na dobra. */}
          <path d={`M${ESQ.x + 3} ${VINCO} L${DIR.x - 3} ${VINCO}`} stroke="#fff" strokeOpacity="0.32" strokeWidth="1.2" strokeLinecap="round" />
          {/* Bainha. */}
          <path d={SILHUETA} fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1.1" strokeLinejoin="round" />
        </g>
      </motion.g>
    </svg>
  );
}

// ------------------------------------------------------------------
// LencoCiclo: o lenço que balança e troca de cor sozinho.
// ------------------------------------------------------------------

export type VariacaoLenco = {
  nome: string;
  cores: string[];
  padrao?: Padrao;
};

export type LencoCicloProps = {
  variacoes: VariacaoLenco[];
  /** Tempo de cada cor, em milissegundos (padrão 3600). */
  intervalo?: number;
  /** Monta o título acessível do desenho a partir do nome da variação. */
  titulo?: (nome: string) => string;
  className?: string;
  /** Mostra o nome da cor atual embaixo do desenho (padrão: true). */
  mostrarNome?: boolean;
  /** Conteúdo extra na legenda, antes do nome (ex.: um rótulo). */
  antesDoNome?: ReactNode;
};

/*
 * Alterna as variações (ex.: maragato, chimango, azul royal, verde esmeralda)
 * com balanço suave. Tem botão "Pausar animação" (WCAG 2.2.2) e, com
 * "reduzir movimento", fica parado na primeira variação.
 *
 * Acessibilidade (padrão de carrossel da WAI-ARIA): o botão troca o rótulo
 * ("Pausar"/"Retomar") e por isso não usa aria-pressed; o nome da cor tem
 * aria-live "off" enquanto troca sozinho e "polite" quando está parado.
 */
export function LencoCiclo({
  variacoes,
  intervalo = 3600,
  titulo = (nome) => `Desenho do lenço ${nome}`,
  className,
  mostrarNome = true,
  antesDoNome,
}: LencoCicloProps) {
  const reduzir = useReduzirMovimento();
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const parado = pausado || reduzir || variacoes.length < 2;

  useEffect(() => {
    if (parado) return;
    const relogio = window.setInterval(() => setIndice((i) => (i + 1) % variacoes.length), intervalo);
    return () => window.clearInterval(relogio);
  }, [parado, intervalo, variacoes.length]);

  const atual = variacoes[indice % Math.max(variacoes.length, 1)];
  if (!atual) return null;

  return (
    <figure className={`relative m-0 ${className ?? ""}`}>
      <LencoArte padrao={atual.padrao ?? "liso"} cores={atual.cores} titulo={titulo(atual.nome)} animado={!parado} />
      {mostrarNome && (
        <figcaption className="mt-3 flex items-baseline justify-center gap-2 text-center">
          {antesDoNome}
          <span aria-live={parado ? "polite" : "off"} aria-atomic="true" className="font-titulo text-xl font-semibold">
            {atual.nome}
          </span>
        </figcaption>
      )}
      {!reduzir && variacoes.length > 1 && (
        <button
          type="button"
          onClick={() => setPausado((p) => !p)}
          className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-[var(--raio)] border border-current/25 opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="sr-only">{pausado ? "Retomar animação do lenço" : "Pausar animação do lenço"}</span>
          {pausado ? (
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M6 4l10 6-10 6z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
    </figure>
  );
}
