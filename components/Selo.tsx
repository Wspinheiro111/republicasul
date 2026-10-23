/*
 * Selo: selo circular "Trama Republicasul · tramado artesanalmente", com o
 * texto correndo em volta e o emblema do lenço no meio. Usado em destaques
 * (herói, cartões, página do produto).
 *
 *   <Selo className="w-28" />
 *   <Selo tom="claro" className="w-24 rotate-[-8deg]" />
 *
 * Props
 * - tom?: "escuro" (padrão: dourado sobre couro) | "claro" (tinta/dourado queimado sobre creme)
 * - className?: defina a largura (w-24, w-32...); a altura acompanha.
 * - girando?: gira devagar (CSS); para com "reduzir movimento".
 * O texto do anel é decorativo; o selo inteiro tem role="img" com aria-label.
 */

import { useId } from "react";
import { EmblemaLenco } from "./Marca";

export type SeloProps = {
  tom?: "escuro" | "claro";
  className?: string;
  girando?: boolean;
};

const TEXTO = "Trama Republicasul · tramado artesanalmente · ";

export default function Selo({ tom = "escuro", className, girando = false }: SeloProps) {
  const id = `selo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const claro = tom === "claro";
  const fundo = claro ? "var(--creme)" : "var(--couro)";
  const linha = claro ? "var(--ouro-escuro)" : "var(--ouro)";
  const texto = claro ? "var(--tinta)" : "var(--creme)";

  return (
    <div role="img" aria-label="Selo Trama Republicasul, tramado artesanalmente" className={`relative aspect-square ${className ?? ""}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
        <defs>
          <path id={`${id}-circulo`} d="M100 100 m-71 0 a71 71 0 1 1 142 0 a71 71 0 1 1 -142 0" />
        </defs>
        <circle cx="100" cy="100" r="97" fill={fundo} />
        <circle cx="100" cy="100" r="97" fill="none" stroke={linha} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="91" fill="none" stroke={linha} strokeWidth="1.2" strokeDasharray="5 4" opacity="0.8" />
        <circle cx="100" cy="100" r="52" fill="none" stroke={linha} strokeWidth="1.2" strokeDasharray="5 4" opacity="0.8" />
        <g className={girando ? "selo-girando" : undefined} style={{ transformOrigin: "100px 100px" }}>
          <text
            fill={texto}
            style={{ fontFamily: "var(--font-rotulo)", fontWeight: 600, textTransform: "uppercase" }}
            fontSize="19.5"
            dominantBaseline="central"
          >
            <textPath href={`#${id}-circulo`} textLength="440" lengthAdjust="spacing">
              {TEXTO}
            </textPath>
          </text>
        </g>
      </svg>
      <EmblemaLenco className="absolute left-1/2 top-1/2 h-[36%] w-[36%] -translate-x-1/2 -translate-y-[54%]" />
    </div>
  );
}
