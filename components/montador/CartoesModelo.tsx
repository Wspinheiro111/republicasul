"use client";

/*
 * CartoesModelo: passo 1 do montador. Um cartão por modelo (tradicional liso,
 * carijó uma cor, carijó duas cores, farroupilha, pala), cada um com o
 * desenho em miniatura nas cores que a pessoa já escolheu para ele.
 *
 *   <CartoesModelo modelos={MODELOS} escolhido="carijo-uma-cor" aoEscolher={...}
 *     desenhoDe={(m) => ({ padrao, cores })} idTitulo="titulo-passo-1" />
 *
 * Radios nativos (role="radiogroup"): setas do teclado trocam o modelo.
 * O nome do cartão é o rótulo do radio; o resumo é a descrição.
 * Com número ímpar de modelos, o último ocupa a linha inteira.
 */

import { useId } from "react";
import type { Padrao } from "../../content/catalogo";
import LencoArte from "../LencoArte";
import { IconeCheck } from "./Icones";
import type { Modelo } from "./combinacao";

export type CartoesModeloProps = {
  modelos: Modelo[];
  escolhido: string;
  aoEscolher: (modeloId: string) => void;
  desenhoDe: (modelo: Modelo) => { padrao: Padrao; cores: string[] };
  idTitulo: string;
};

export default function CartoesModelo({ modelos, escolhido, aoEscolher, desenhoDe, idTitulo }: CartoesModeloProps) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const nomeGrupo = `${base}-modelo`;
  const impar = modelos.length % 2 === 1;

  return (
    <div role="radiogroup" aria-labelledby={idTitulo} className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
      {modelos.map((modelo, i) => {
        const marcado = modelo.id === escolhido;
        const largo = impar && i === modelos.length - 1;
        const idNome = `${base}-${modelo.id}-nome`;
        const idResumo = `${base}-${modelo.id}-resumo`;
        const { padrao, cores } = desenhoDe(modelo);
        return (
          <label key={modelo.id} className={`relative block cursor-pointer ${largo ? "col-span-2" : ""}`}>
            <input
              type="radio"
              name={nomeGrupo}
              value={modelo.id}
              checked={marcado}
              onChange={() => aoEscolher(modelo.id)}
              aria-labelledby={idNome}
              aria-describedby={idResumo}
              className="peer sr-only"
            />
            <span
              className={`flex h-full gap-3 rounded-[var(--raio)] border border-tinta/20 bg-white/45 p-3 transition-[background-color,border-color,box-shadow] duration-150 hover:border-tinta/50 hover:bg-white/70 peer-checked:border-tinta peer-checked:bg-white/85 peer-checked:shadow-[inset_0_0_0_1px_var(--tinta)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--foco)] ${
                largo ? "flex-row items-center" : "flex-col sm:flex-row sm:items-center"
              }`}
            >
              <span aria-hidden="true" className="block w-12 shrink-0 overflow-hidden rounded-[var(--raio-pequeno)] bg-couro px-1 pb-1 sm:w-14">
                <span className="-mt-[12%] block">
                  <LencoArte padrao={padrao} cores={cores} titulo="" mostrarFranja={false} />
                </span>
              </span>
              <span className="min-w-0 pr-6">
                <span id={idNome} className="block font-titulo text-[1.06rem] font-semibold leading-tight">
                  {modelo.nome}
                </span>
                <span id={idResumo} className="mt-1 block text-[0.88rem] leading-snug text-tinta/75">
                  {modelo.resumo}
                </span>
              </span>
            </span>
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 hidden h-6 w-6 place-items-center rounded-full bg-maragato text-white peer-checked:grid"
            >
              <IconeCheck className="h-4 w-4" />
            </span>
          </label>
        );
      })}
    </div>
  );
}
