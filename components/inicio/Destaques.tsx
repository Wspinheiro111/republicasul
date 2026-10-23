/*
 * Lenços em destaque: os produtos com destaque: true no catálogo. Cada cartão
 * tem o desenho (ou a foto, quando houver), nome, resumo, o valor (só quando o
 * dono confirmar o preço; sem preço, "Valor pelo WhatsApp"), link para o
 * produto e o "Adicionar ao pedido" rápido com a escolha padrão.
 *
 * O desenho usa as mesmas cores da escolha padrão, para o cartão mostrar
 * exatamente o que entra na lista.
 */

import Link from "next/link";
import { coresDasEscolhas, escolhasPadrao, produtos, type Produto } from "../../content/catalogo";
import Revelar from "../Revelar";
import Selo from "../Selo";
import AdicionarRapido from "./AdicionarRapido";
import ArteProduto from "./ArteProduto";
import CabecaSecao from "./CabecaSecao";
import { IconeSeta } from "./Icones";

export const produtosEmDestaque = () => produtos.filter((p) => p.destaque);

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function textoDoValor(produto: Produto): string {
  return typeof produto.preco === "number" && produto.preco > 0 ? reais.format(produto.preco) : "Valor pelo WhatsApp";
}

/** "Vermelho · Azul · Medida padrão": os valores da escolha padrão. */
export function resumoDaEscolha(produto: Produto): string {
  const escolhas = escolhasPadrao(produto);
  return produto.opcoes
    .map((o) => o.valores.find((v) => v.id === escolhas[o.id])?.nome)
    .filter(Boolean)
    .join(" · ");
}

export default function Destaques() {
  const lista = produtosEmDestaque();
  if (lista.length === 0) return null;

  return (
    <section aria-labelledby="inicio-destaques" className="secao-clara py-14 md:py-20">
      <div className="conteudo">
        <CabecaSecao id="inicio-destaques" rotulo="Em destaque" titulo="Os lenços da vitrine">
          <p>Ponha na lista com um toque. Quer outra cor ou outra medida? Abra o lenço e escolha.</p>
        </CabecaSecao>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {lista.map((produto, i) => {
            const escolha = resumoDaEscolha(produto);
            return (
              <Revelar
                como="li"
                key={produto.slug}
                atraso={(i % 3) * 0.07}
                className="group relative grid grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-[var(--raio)] border border-tinta/15 bg-creme has-[h3_a:focus-visible]:outline-3 has-[h3_a:focus-visible]:outline-offset-2 has-[h3_a:focus-visible]:outline-[var(--foco)] sm:grid-cols-1 sm:grid-rows-[auto_1fr]"
              >
                <div className="secao-escura trama flex items-center px-2.5 py-3 sm:px-10 sm:pb-4 sm:pt-7">
                  <ArteProduto
                    produto={produto}
                    cores={coresDasEscolhas(produto, escolhasPadrao(produto))}
                    className="transition-transform duration-500 group-hover:-translate-y-1"
                  />
                </div>
                <div className="flex min-w-0 flex-col p-4 sm:p-5">
                  <h3 className="text-[1.15rem] sm:text-[1.25rem]">
                    <Link
                      href={`/produto/${produto.slug}/`}
                      className="no-underline after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
                    >
                      {produto.nome}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-[0.95rem] leading-snug text-tinta/75">{produto.resumo}</p>
                  <p className="rotulo mt-3 text-ouro-escuro">{textoDoValor(produto)}</p>
                  {escolha && (
                    <p className="mt-2 text-[0.88rem] leading-snug text-tinta/70">
                      Vai com: <span className="text-tinta">{escolha}</span>
                    </p>
                  )}
                  <AdicionarRapido slug={produto.slug} className="relative z-10 mt-auto pt-4" />
                </div>
              </Revelar>
            );
          })}

          <li className="relative flex">
            <Link
              href="/catalogo/"
              className="secao-escura trama costura group flex w-full flex-col justify-between gap-6 rounded-[var(--raio)] p-7 no-underline sm:p-8"
            >
              <span>
                <span className="rotulo block text-ouro">Catálogo</span>
                <span className="titulo-3 mt-3 block text-[1.6rem]">Ver todos os lenços e palas</span>
                <span className="mt-3 block text-creme-2">Tradicionais, carijós, farroupilha e palas, cada um com as suas opções.</span>
              </span>
              <div aria-hidden="true" className="hidden justify-center sm:flex">
                <Selo className="w-32 opacity-90 transition-transform duration-500 group-hover:rotate-[-8deg] lg:w-36" />
              </div>
              <span aria-hidden="true" className="rotulo flex items-center gap-2 text-ouro">
                Abrir o catálogo
                <IconeSeta className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
