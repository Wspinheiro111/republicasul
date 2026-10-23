/*
 * "Como comprar": os três passos reais da venda pelo WhatsApp. É uma
 * sequência, então vai numa lista ordenada; o número grande é só visual e o
 * leitor de tela ouve "Passo 1", "Passo 2"...
 */

import Revelar from "../Revelar";
import CabecaSecao from "./CabecaSecao";
import { IconeConversa, IconeEscolher, IconeLista } from "./Icones";
import LinkSeta from "./LinkSeta";

export const PASSOS = [
  {
    titulo: "Escolha o lenço e as variações",
    texto: "Veja os modelos e escolha a cor e a medida. Cada lenço mostra as opções que tem.",
    Icone: IconeEscolher,
  },
  {
    titulo: "Junte tudo na sua lista de pedido",
    texto: "Ponha quantos lenços quiser, cada um com a sua cor, a sua medida e a sua quantidade.",
    Icone: IconeLista,
  },
  {
    titulo: "Envie pelo WhatsApp e combine valor, prazo e entrega",
    texto: "A mensagem sai pronta, com tudo o que você escolheu. O resto a gente acerta na conversa.",
    Icone: IconeConversa,
  },
];

export default function ComoComprar() {
  return (
    <section aria-labelledby="inicio-como-comprar" className="secao-clara-2 trama py-14 md:py-20">
      <div className="conteudo">
        <CabecaSecao id="inicio-como-comprar" rotulo="Como comprar" titulo="Do site para o WhatsApp, em três passos">
          <p>Sem carrinho e sem cadastro. Você monta o pedido aqui e fecha com a gente na conversa.</p>
        </CabecaSecao>

        <ol className="mt-10 grid gap-10 md:mt-14 md:grid-cols-3 md:gap-8">
          {PASSOS.map(({ titulo, texto, Icone }, i) => (
            <Revelar como="li" key={titulo} atraso={i * 0.09} className="relative">
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="font-titulo text-[3.4rem] font-semibold leading-none text-ouro-escuro">
                  {i + 1}
                </span>
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-ouro-escuro/70 bg-creme text-tinta">
                  <Icone className="h-9 w-9" />
                </span>
                {i < PASSOS.length - 1 && <span aria-hidden="true" className="linha-de-ponto hidden flex-1 md:block" />}
              </div>
              <h3 className="mt-5 max-w-[22ch]">
                <span className="sr-only">Passo {i + 1}: </span>
                {titulo}
              </h3>
              <p className="mt-2 max-w-sm text-tinta/80">{texto}</p>
            </Revelar>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 md:mt-12">
          <LinkSeta href="/catalogo/">Começar pelos lenços</LinkSeta>
          <LinkSeta href="/pedido/">Ver a sua lista de pedido</LinkSeta>
        </div>
      </div>
    </section>
  );
}
