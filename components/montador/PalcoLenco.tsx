"use client";

/*
 * PalcoLenco: o lenço grande do montador, num palco de couro com a trama e
 * luz quente, e a ficha da combinação embaixo (no celular, ao lado).
 *
 *   <PalcoLenco produto={produto} cores={cores} titulo="Desenho do..." quantidade={2} />
 *
 * - O desenho balança de leve (LencoArte animado) e as cores mudam com
 *   transição suave. Trocar o padrão (liso, carijó, farroupilha, pala) faz
 *   uma passagem curta entre os desenhos.
 * - Botão para pausar o balanço; com "reduzir movimento" nada se mexe e o
 *   botão some.
 * - A ficha (nome + escolhas em texto) é aria-live: quem usa leitor de tela
 *   ouve a combinação a cada troca.
 * - No celular o palco é compacto e fica grudado no topo (quem posiciona é o
 *   Montador); no computador, o desenho ocupa a coluna inteira.
 * - Quando o produto tiver foto real e a foto for exatamente desta peça
 *   (sem opção de cor), ela aparece na ficha; o desenho segue como prévia.
 */

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { Produto } from "../../content/catalogo";
import { descreverEscolhas } from "../../lib/whatsapp";
import LencoArte from "../LencoArte";
import { useReduzirMovimento } from "../movimento";
import Selo from "../Selo";
import { fotoCorresponde } from "./combinacao";
import { IconePausa } from "./Icones";
import estilos from "./Montador.module.css";

export type PalcoLencoProps = {
  produto: Produto;
  escolhas: Record<string, string>;
  cores: string[];
  titulo: string;
  quantidade: number;
};

function FotosDaPeca({ produto }: { produto: Produto }) {
  const [falhas, setFalhas] = useState<string[]>([]);
  const fotos = produto.fotos.filter((f) => !falhas.includes(f)).slice(0, 3);
  if (fotos.length === 0) return null;
  return (
    <ul className="m-0 mt-3 hidden list-none gap-2 p-0 lg:flex lg:justify-center" aria-label={`Fotos do ${produto.nome}`}>
      {fotos.map((foto, i) => (
        <li key={foto} className="relative h-16 w-16 overflow-hidden rounded-[var(--raio)] border border-ouro/40">
          <Image
            src={foto}
            alt={`Foto ${i + 1} do ${produto.nome}`}
            fill
            unoptimized
            sizes="64px"
            className="object-cover"
            onError={() => setFalhas((f) => [...f, foto])}
          />
        </li>
      ))}
    </ul>
  );
}

export default function PalcoLenco({ produto, escolhas, cores, titulo, quantidade }: PalcoLencoProps) {
  const reduzir = useReduzirMovimento();
  const [pausado, setPausado] = useState(false);
  const descricao = descreverEscolhas(produto, escolhas);
  const partes = [...(descricao ? descricao.split(" · ") : []), `Quantidade: ${quantidade}`];
  const corDoReflexo = cores[0] ?? "transparent";

  return (
    <div className="relative px-4 py-3 sm:px-6 lg:flex lg:h-full lg:flex-col lg:items-center lg:justify-center lg:px-10 lg:py-10">
      {/* Pesponto dourado por dentro do palco. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 rounded-[var(--raio)] border border-dashed border-ouro/30 lg:inset-4" />
      <p aria-hidden="true" className="rotulo absolute left-10 top-9 hidden text-ouro lg:block">
        Prévia ao vivo
      </p>

      <div className="relative flex items-center gap-4 lg:w-full lg:flex-col lg:gap-5">
        <div className="relative w-[6.75rem] shrink-0 sm:w-[8rem] lg:w-[min(100%,34rem,56dvh)]">
          <div aria-hidden="true" className={`${estilos.reflexo} absolute inset-[8%] rounded-full`} style={{ color: corDoReflexo }} />
          <div aria-hidden="true" className={`${estilos.chao} absolute inset-x-[16%] bottom-[-4%] h-[12%]`} />
          {/* O alto do desenho é vazio (a metade de cima tomba para trás): sobe um pouco. */}
          <div className="relative -my-[7%] grid [&>*]:[grid-area:1/1]" data-testid="desenho-montador">
            <AnimatePresence initial={false}>
              <motion.div
                key={produto.padrao}
                initial={{ opacity: 0, scale: 0.94, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: reduzir ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <LencoArte padrao={produto.padrao} cores={cores} titulo={titulo} animado={!pausado} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div
          className="min-w-0 flex-1 pr-11 lg:w-full lg:max-w-[30rem] lg:flex-none lg:pr-0 lg:text-center"
          aria-live="polite"
          aria-atomic="true"
          data-testid="ficha"
        >
          <p className="rotulo text-ouro">Sua combinação</p>
          <p className="mt-1 font-titulo text-[1.08rem] font-semibold leading-tight text-creme sm:text-[1.25rem] lg:text-[1.9rem]">
            {produto.nome}
          </p>
          <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-2 p-0 text-[0.9rem] leading-snug text-creme-2 lg:mt-2.5 lg:justify-center lg:text-[1.02rem]">
            {partes.map((parte, i) => (
              <li key={parte} className="inline-flex gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-ouro">
                    ·
                  </span>
                )}
                <span>{parte}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 hidden text-[0.88rem] text-creme-2/80 lg:block">Ilustração da peça. As cores acompanham a sua escolha.</p>
          {fotoCorresponde(produto) && <FotosDaPeca key={produto.slug} produto={produto} />}
        </div>
      </div>

      {!reduzir && (
        <button
          type="button"
          onClick={() => setPausado((p) => !p)}
          aria-pressed={pausado}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-[var(--raio)] border border-creme/25 text-creme/80 transition-colors hover:border-creme/60 hover:text-creme lg:right-8 lg:top-8"
        >
          <span className="sr-only">Pausar o balanço do lenço</span>
          <IconePausa pausado={pausado} className="h-4 w-4" />
        </button>
      )}

      <div className="absolute bottom-8 right-8 hidden w-20 xl:block">
        <Selo className="w-full" />
      </div>
    </div>
  );
}
