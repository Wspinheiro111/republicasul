"use client";

/*
 * Quantidade: stepper "− número +" com limites 1..99 (QUANTIDADE_MAXIMA).
 * Controlado.
 *
 *   <Quantidade valor={qtd} aoMudar={setQtd} />
 *   <Quantidade valor={item.quantidade} aoMudar={(n) => alterarQuantidade(i, n)} rotulo={`Quantidade de ${nome}`} rotuloVisivel={false} />
 *
 * Props
 * - valor: number; aoMudar(n): recebe sempre um número já limitado a 1..99.
 * - rotulo?: texto do label (padrão "Quantidade").
 * - rotuloVisivel?: mostra o label acima (padrão true; false deixa só para leitor de tela).
 * - tom?: "claro" (padrão) | "escuro". className?: classes do contêiner.
 * Botões e campo com 48px de altura; os botões desligam nos limites.
 */

import { useEffect, useId, useState } from "react";
import { QUANTIDADE_MAXIMA } from "../lib/pedido";

export const QUANTIDADE_MINIMA = 1;

export type QuantidadeProps = {
  valor: number;
  aoMudar: (quantidade: number) => void;
  rotulo?: string;
  rotuloVisivel?: boolean;
  tom?: "claro" | "escuro";
  className?: string;
};

export function limitarQuantidade(n: number): number {
  if (!Number.isFinite(n)) return QUANTIDADE_MINIMA;
  return Math.max(QUANTIDADE_MINIMA, Math.min(QUANTIDADE_MAXIMA, Math.round(n)));
}

export default function Quantidade({ valor, aoMudar, rotulo = "Quantidade", rotuloVisivel = true, tom = "claro", className }: QuantidadeProps) {
  const id = useId();
  const [texto, setTexto] = useState(String(valor));
  const escuro = tom === "escuro";

  useEffect(() => {
    setTexto(String(valor));
  }, [valor]);

  const mudar = (n: number) => {
    const limitado = limitarQuantidade(n);
    setTexto(String(limitado));
    if (limitado !== valor) aoMudar(limitado);
  };

  const botao = `inline-flex h-12 w-12 items-center justify-center text-[1.4rem] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
    escuro ? "text-creme hover:bg-white/10" : "text-tinta hover:bg-black/5"
  }`;

  return (
    <div className={className}>
      <label htmlFor={id} className={rotuloVisivel ? `rotulo mb-2 block ${escuro ? "text-ouro" : "text-ouro-escuro"}` : "sr-only"}>
        {rotulo}
      </label>
      {/*
        Sem overflow-hidden no contêiner: ele cortava o anel de foco dos três
        controles. As pontas arredondadas ficam nos próprios botões.
      */}
      <div
        className={`inline-flex items-stretch rounded-[var(--raio)] border ${
          escuro ? "border-creme/50 bg-white/5" : "border-tinta/55 bg-white/60"
        }`}
      >
        <button
          type="button"
          className={`${botao} rounded-l-[var(--raio)]`}
          onClick={() => mudar(valor - 1)}
          disabled={valor <= QUANTIDADE_MINIMA}
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          aria-controls={id}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={QUANTIDADE_MINIMA}
          max={QUANTIDADE_MAXIMA}
          step={1}
          value={texto}
          onChange={(e) => {
            const limpo = e.target.value.replace(/\D/g, "");
            setTexto(limpo);
            const n = parseInt(limpo, 10);
            if (!Number.isNaN(n)) {
              const limitado = limitarQuantidade(n);
              if (limitado !== valor) aoMudar(limitado);
            }
          }}
          onBlur={() => setTexto(String(valor))}
          className={`h-12 w-14 border-x bg-transparent text-center font-semibold tabular-nums ${
            escuro ? "border-creme/25 text-creme" : "border-tinta/20 text-tinta"
          }`}
        />
        <button
          type="button"
          className={`${botao} rounded-r-[var(--raio)]`}
          onClick={() => mudar(valor + 1)}
          disabled={valor >= QUANTIDADE_MAXIMA}
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          aria-controls={id}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
