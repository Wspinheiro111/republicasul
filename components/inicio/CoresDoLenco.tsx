/*
 * "As cores do lenço": prévia do guia, só com os fatos confirmados para o site
 * (maragato e chimango, Revolução Federalista de 1893 e Revolução de 1923;
 * as cores da bandeira do RS; a Semana Farroupilha termina em 20 de setembro).
 */

import Link from "next/link";
import { cores, produtoPorSlug } from "../../content/catalogo";
import LencoArte from "../LencoArte";
import Revelar from "../Revelar";
import CabecaSecao from "./CabecaSecao";
import { IconeSeta } from "./Icones";
import LinkSeta from "./LinkSeta";

export const CORES_DO_GUIA = [
  {
    nome: "Maragato",
    padrao: "liso" as const,
    cores: [cores.vermelho.hex],
    titulo: "Desenho do lenço vermelho, o maragato",
    texto: "Na tradição gaúcha, o lenço vermelho é chamado de maragato.",
    produto: "lenco-tradicional-maragato",
  },
  {
    nome: "Chimango",
    padrao: "liso" as const,
    cores: [cores.branco.hex],
    titulo: "Desenho do lenço branco, o chimango",
    texto: "O lenço branco é o chimango.",
    produto: "lenco-tradicional-chimango",
  },
  {
    nome: "Farroupilha",
    padrao: "farroupilha" as const,
    cores: [cores.verde.hex, cores.vermelho.hex, cores.amarelo.hex],
    titulo: "Desenho do lenço farroupilha, verde, vermelho e amarelo",
    texto:
      "Leva o verde, o vermelho e o amarelo da bandeira do Rio Grande do Sul. Para a Semana Farroupilha, que termina em 20 de setembro, e para o ano inteiro.",
    produto: "lenco-farroupilha",
  },
];

export default function CoresDoLenco() {
  return (
    <section aria-labelledby="inicio-cores" className="secao-escura-2 trama py-14 md:py-20">
      <div className="conteudo">
        <CabecaSecao
          id="inicio-cores"
          tom="escuro"
          rotulo="Guia do lenço"
          titulo="As cores do lenço"
          acao={
            <LinkSeta href="/guia-do-lenco/" tom="escuro">
              Ler o guia do lenço
            </LinkSeta>
          }
        >
          <p>
            Os nomes maragato e chimango vêm das disputas políticas do Rio Grande do Sul, na Revolução Federalista, de 1893, e
            na Revolução de 1923.
          </p>
        </CabecaSecao>

        <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6 md:mt-14 lg:gap-10">
          {CORES_DO_GUIA.map((item, i) => {
            const produto = produtoPorSlug(item.produto);
            return (
              <Revelar como="li" key={item.nome} atraso={i * 0.08} className="grid grid-cols-[6.5rem_minmax(0,1fr)] content-start items-start gap-5 sm:grid-cols-1">
                <div className="mx-auto w-full max-w-[13rem] sm:px-4">
                  <LencoArte padrao={item.padrao} cores={item.cores} titulo={item.titulo} />
                </div>
                <div>
                  <h3 className="text-[1.5rem]">{item.nome}</h3>
                  <hr aria-hidden="true" className="linha-de-ponto my-3 w-12! opacity-60!" />
                  <p className="text-creme-2">{item.texto}</p>
                  {produto && (
                    <Link
                      href={`/produto/${produto.slug}/`}
                      className="group mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-creme underline decoration-ouro/50 underline-offset-4 hover:decoration-ouro"
                    >
                      Ver o lenço {item.nome.toLowerCase()}
                      <IconeSeta className="h-4 w-4 text-ouro transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  )}
                </div>
              </Revelar>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
