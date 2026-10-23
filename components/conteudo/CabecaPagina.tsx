/*
 * CabecaPagina: abertura das páginas de conteúdo (guia, lojistas, sobre).
 * Couro com trama, trilha, rótulo dourado, o h1 da página, o texto de
 * abertura e uma arte ao lado (o lenço desenhado). Fecha com a linha de ponto.
 *
 *   <CabecaPagina
 *     id="titulo-guia"
 *     trilha={[{ nome: "Guia do lenço", href: "/guia-do-lenco/" }]}
 *     rotulo="Para quem está começando"
 *     titulo="Guia do lenço"
 *     arte={<LencosEmLeque />}
 *     rodape={<Sumario itens={...} />}
 *   >
 *     <p>Texto de abertura.</p>
 *   </CabecaPagina>
 */

import type { ReactNode } from "react";
import Trilha, { type ItemTrilha } from "../Trilha";

export type CabecaPaginaProps = {
  /** id do h1 (a seção usa aria-labelledby). */
  id: string;
  trilha: ItemTrilha[];
  rotulo: string;
  titulo: ReactNode;
  children?: ReactNode;
  /** Arte à direita (no celular vem embaixo do texto). Decorativa. */
  arte?: ReactNode;
  /** Conteúdo extra embaixo, ainda no couro (ex.: o sumário). */
  rodape?: ReactNode;
};

export default function CabecaPagina({ id, trilha, rotulo, titulo, children, arte, rodape }: CabecaPaginaProps) {
  return (
    <section className="secao-escura trama relative overflow-hidden" aria-labelledby={id}>
      <div className={`conteudo grid gap-8 pb-10 pt-6 md:items-center md:pb-14 md:pt-8 ${arte ? "md:grid-cols-[1.35fr_1fr]" : ""}`}>
        <div className="min-w-0">
          <Trilha itens={trilha} tom="escuro" />
          <p className="rotulo mt-6 text-ouro">{rotulo}</p>
          <h1 id={id} className="titulo-pagina mt-3">
            {titulo}
          </h1>
          {children && <div className="texto-grande mt-5 flex max-w-xl flex-col gap-4 text-creme-2">{children}</div>}
        </div>
        {arte && (
          <div aria-hidden="true" className="min-w-0">
            {arte}
          </div>
        )}
      </div>
      {rodape && <div className="conteudo pb-10 md:pb-14">{rodape}</div>}
      <div aria-hidden="true" className="linha-de-ponto" />
    </section>
  );
}
