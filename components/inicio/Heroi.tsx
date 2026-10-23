/*
 * Herói da página inicial: o que é (lenço gaúcho tramado, de Porto Alegre),
 * o lenço grande trocando de cor e como comprar (catálogo, montador, WhatsApp).
 *
 * Ordem no HTML: título, lenço, texto e botões. No celular o lenço aparece
 * logo abaixo do título (sem esperar a rolagem), menor, e os botões sobem
 * para logo depois dele (order-first), para caberem na primeira tela acima
 * da barra fixa; do md para cima o lenço vai para a coluna da direita
 * (grid-template-areas) e o texto volta para antes dos botões.
 */

import Link from "next/link";
import { empresa } from "../../content/site";
import { MENSAGEM_GERAL } from "../navegacao";
import Selo from "../Selo";
import estilos from "./Inicio.module.css";
import LencoHeroi from "./LencoHeroi";
import LinkWhatsApp from "./LinkWhatsApp";

export default function Heroi() {
  return (
    <section aria-labelledby="inicio-titulo" className="secao-escura trama relative overflow-hidden">
      <div
        aria-hidden="true"
        className={`${estilos.luz} pointer-events-none absolute left-1/2 top-[13rem] h-[28rem] w-[28rem] -translate-x-1/2 md:left-auto md:right-[-8rem] md:top-1/2 md:h-[48rem] md:w-[48rem] md:-translate-y-1/2 md:translate-x-0`}
      />
      <div className="conteudo relative grid gap-y-5 pb-12 pt-8 sm:pt-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-x-10 md:gap-y-0 md:py-16 md:[grid-template-areas:'titulo_lenco''acoes_lenco'] lg:gap-x-16 lg:py-20">
        <div className="md:self-end md:[grid-area:titulo]">
          <p className="rotulo flex items-center gap-3 text-ouro">
            <span aria-hidden="true" className="linha-de-ponto w-7! shrink-0" />
            Porto Alegre · Rio Grande do Sul
          </p>
          <h1 id="inicio-titulo" className="mt-4 max-w-[13ch]">
            {"Lenço gaúcho "}
            <span className={estilos.costurado}>
              tramado
              <span aria-hidden="true" className={estilos.ponto} />
            </span>
            , do galpão ao desfile
          </h1>
        </div>

        {/* A margem negativa come o vazio de cima do desenho (a metade dobrada). */}
        <div className="relative mx-auto -mt-7 w-full max-w-[14rem] sm:-mt-4 sm:max-w-[21rem] md:mt-0 md:max-w-[29rem] md:self-center md:[grid-area:lenco]">
          <LencoHeroi
            selo={
              <div className="absolute -left-3 bottom-[3%] w-14 sm:-left-6 sm:w-24 md:-left-10 md:w-28">
                <Selo girando />
              </div>
            }
          />
        </div>

        <div className="flex flex-col md:self-start md:pt-7 md:[grid-area:acoes]">
          <p className="texto-grande mt-6 max-w-xl text-creme-2 md:mt-0">{empresa.assinatura}</p>
          <p className="mt-3 max-w-xl text-creme-2">
            Escolha o modelo e as cores, junte tudo na sua lista de pedido e feche pelo WhatsApp.
          </p>
          <div className="order-first mt-0 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:order-none md:mt-7">
            <Link href="/catalogo/" className="botao-acao">
              Ver os lenços
            </Link>
            <Link href="/montador/" className="botao-contorno">
              Monte o seu lenço
            </Link>
          </div>
          <LinkWhatsApp texto={MENSAGEM_GERAL} origem="inicio-heroi" className="mt-4 self-start text-creme-2 hover:text-creme">
            Prefere conversar? Chame no WhatsApp
          </LinkWhatsApp>
        </div>
      </div>
      <div aria-hidden="true" className="linha-de-ponto opacity-40!" />
    </section>
  );
}
