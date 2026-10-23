/*
 * Faixa de categorias: as cinco linhas do catálogo em cartões com o desenho
 * do padrão. No celular e no tablet vira uma rolagem lateral com scroll-snap
 * dentro do próprio trilho (a página não rola para o lado); do lg para cima,
 * grade de cinco colunas.
 */

import Link from "next/link";
import { categorias, produtosDaCategoria } from "../../content/catalogo";
import LencoArte from "../LencoArte";
import CabecaSecao from "./CabecaSecao";
import { IconeSeta } from "./Icones";
import estilos from "./Inicio.module.css";
import LinkSeta from "./LinkSeta";
import Trilho from "./Trilho";

// As cores do desenho de cada categoria vêm do primeiro produto dela.
function coresDaCategoria(slug: string): string[] {
  return produtosDaCategoria(slug)[0]?.coresDesenho ?? [];
}

export default function Categorias() {
  return (
    <section aria-labelledby="inicio-categorias" className="secao-clara py-14 md:py-20">
      <div className="conteudo">
        <CabecaSecao
          id="inicio-categorias"
          rotulo="As linhas da casa"
          titulo="Escolha pelo desenho"
          acao={<LinkSeta href="/catalogo/">Ver o catálogo completo</LinkSeta>}
        />

        <Trilho
          className={`${estilos.trilho} -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-5 pt-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:mt-10 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0`}
        >
          {categorias.map((categoria) => {
            const idNome = `categoria-${categoria.slug}`;
            return (
              <li key={categoria.slug} className="flex w-[72%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-auto">
                {/* O cartão inteiro é o link: o foco do teclado traz o cartão todo para dentro do trilho. */}
                <Link
                  href={`/catalogo/${categoria.slug}/`}
                  aria-labelledby={idNome}
                  className="group flex w-full flex-col overflow-hidden rounded-[var(--raio)] border border-tinta/15 bg-creme no-underline transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-tinta/35 focus-visible:outline-offset-2"
                >
                  <div aria-hidden="true" className="secao-escura trama px-7 pb-3 pt-5">
                    <LencoArte
                      padrao={categoria.padrao}
                      cores={coresDaCategoria(categoria.slug)}
                      titulo={`Desenho: ${categoria.nome.toLowerCase()}`}
                      mostrarFranja={false}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 id={idNome} className="text-[1.2rem]">
                      {categoria.nome}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-snug text-tinta/75">{categoria.resumo}</p>
                    <span aria-hidden="true" className="rotulo mt-auto flex items-center gap-1.5 pt-4 text-ouro-escuro">
                      Ver modelos
                      <IconeSeta className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </Trilho>
      </div>
    </section>
  );
}
