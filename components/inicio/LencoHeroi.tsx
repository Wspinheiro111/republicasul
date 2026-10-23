"use client";

/*
 * LencoHeroi: o lenço grande do herói. Balança de leve e troca de cor sozinho
 * (maragato, chimango, azul royal, verde esmeralda: os lenços tradicionais do
 * catálogo), com o nome da cor escrito embaixo.
 *
 * Acessibilidade (padrão de carrossel da WAI-ARIA):
 * - O nome tem aria-live: "off" enquanto troca sozinho (não fica anunciando a
 *   cada 2,8 s) e "polite" quando está parado, para anunciar a cor escolhida.
 * - A troca para com o botão de pausa (WCAG 2.2.2), com o foco do teclado
 *   dentro (até a pessoa mandar retomar) e quando o lenço sai da tela.
 * - As amostras de cor deixam escolher; escolher uma cor pausa a troca.
 * - O botão de pausa fica na mesma linha das amostras, embaixo do desenho.
 * - Com "reduzir movimento" fica parado no maragato e não balança.
 */

import { useInView } from "framer-motion";
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { produtosDaCategoria } from "../../content/catalogo";
import LencoArte from "../LencoArte";
import { useReduzirMovimento } from "../movimento";
import { IconePausa, IconeTocar } from "./Icones";

export type CorHeroi = { id: string; nome: string; cor: string };

/** Os lenços tradicionais do catálogo, na ordem dele. */
export const CORES_HEROI: CorHeroi[] = produtosDaCategoria("lencos-tradicionais")
  .filter((p) => p.coresDesenho.length > 0)
  .map((p) => ({
    id: p.slug,
    nome: p.nome.replace(/^Lenço tradicional\s+/i, ""),
    cor: p.coresDesenho[0],
  }));

export const INTERVALO_HEROI = 2800;

export type LencoHeroiProps = {
  variacoes?: CorHeroi[];
  intervalo?: number;
  className?: string;
  /** Enfeite posicionado sobre o desenho (ex.: o Selo, com position absolute). */
  selo?: ReactNode;
};

export default function LencoHeroi({ variacoes = CORES_HEROI, intervalo = INTERVALO_HEROI, className, selo }: LencoHeroiProps) {
  const reduzir = useReduzirMovimento();
  const ref = useRef<HTMLDivElement>(null);
  const emVista = useInView(ref, { amount: 0.25, initial: true });
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [interagindo, setInteragindo] = useState(false);

  const varias = variacoes.length > 1;
  const girando = varias && !pausado && !interagindo && !reduzir && emVista;

  useEffect(() => {
    if (!girando) return;
    const relogio = window.setInterval(() => setIndice((i) => (i + 1) % variacoes.length), intervalo);
    return () => window.clearInterval(relogio);
  }, [girando, intervalo, variacoes.length]);

  const atual = variacoes[indice % Math.max(variacoes.length, 1)];
  if (!atual) return null;

  const escolher = (i: number) => {
    setIndice(i);
    setPausado(true);
  };

  // "Retomar" vale mesmo com o foco no botão (que fica dentro do lenço).
  const alternarPausa = () => {
    if (pausado) setInteragindo(false);
    setPausado(!pausado);
  };

  const aoSairFoco = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInteragindo(false);
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} onFocus={() => setInteragindo(true)} onBlur={aoSairFoco}>
      <figure className="m-0">
        <div className="relative">
          <LencoArte
            padrao="liso"
            cores={[atual.cor]}
            titulo={`Desenho do lenço ${atual.nome.toLowerCase()}`}
            animado={!pausado && emVista}
          />
          {selo}
        </div>
        <figcaption className="-mt-1 flex flex-col items-center gap-0.5 text-center">
          <span className="rotulo text-ouro">Lenço tradicional</span>
          <span
            aria-live={girando ? "off" : "polite"}
            aria-atomic="true"
            data-testid="cor-do-heroi"
            className="font-titulo text-[1.6rem] font-semibold leading-tight text-creme md:text-[1.85rem]"
          >
            {atual.nome}
          </span>
        </figcaption>
      </figure>

      {varias && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <div role="group" aria-label="Ver o lenço em outra cor" className="flex gap-1">
            {variacoes.map((v, i) => {
              const marcado = v.id === atual.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => escolher(i)}
                  title={v.nome}
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <span className="sr-only">{v.nome}</span>
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: v.cor }}
                    className={`block h-7 w-7 rounded-full border border-white/25 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] transition-[box-shadow,transform] duration-200 group-hover:scale-110 ${
                      marcado ? "ring-2 ring-ouro ring-offset-[3px] ring-offset-couro" : ""
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {!reduzir && (
            <>
              <span aria-hidden="true" className="linha-de-ponto-vertical h-6! opacity-50!" />
              <button
                type="button"
                onClick={alternarPausa}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--raio)] border border-creme/25 text-creme-2 transition-colors hover:border-creme/60 hover:text-creme"
              >
                <span className="sr-only">{pausado ? "Retomar a troca de cores do lenço" : "Pausar a troca de cores do lenço"}</span>
                {pausado ? <IconeTocar className="h-4 w-4" /> : <IconePausa className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
