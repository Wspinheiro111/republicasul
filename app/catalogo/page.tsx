import type { Metadata } from "next";
import Link from "next/link";
import BlocoAjuda from "../../components/catalogo/BlocoAjuda";
import { MENSAGEM_CATALOGO, pecas, variacoesDaCategoria } from "../../components/catalogo/funcoes";
import GradeProdutos from "../../components/catalogo/GradeProdutos";
import { caminhoCategoria, metadadosDaPagina } from "../../components/catalogo/seo";
import LencoArte from "../../components/LencoArte";
import Revelar from "../../components/Revelar";
import Trilha from "../../components/Trilha";
import { categorias, cores, produtos, produtosDaCategoria } from "../../content/catalogo";

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Lenços e palas",
  descricao:
    "Lenços tradicionais, carijós, farroupilha e palas tramados artesanalmente pela Republicasul, de Porto Alegre/RS. Escolha cor e medida e mande o pedido pronto pelo WhatsApp.",
  caminho: "/catalogo/",
});

export default function Catalogo() {
  return (
    <>
      <section className="secao-escura trama relative overflow-hidden" aria-labelledby="titulo-catalogo">
        <div className="conteudo grid items-center gap-8 pb-10 pt-6 md:grid-cols-[1.3fr_1fr] md:pb-14 md:pt-8">
          <div>
            <Trilha itens={[{ nome: "Lenços", href: "/catalogo/" }]} tom="escuro" />
            <p className="rotulo mt-6 text-ouro">Catálogo · venda pelo WhatsApp</p>
            <h1 id="titulo-catalogo" className="titulo-pagina mt-3">
              Lenços e palas
            </h1>
            <p className="texto-grande mt-5 max-w-xl text-creme-2">
              Lenço tradicional, carijó, farroupilha e pala. Escolha a cor e a medida, junte tudo no seu pedido e mande pronto pelo
              WhatsApp. O valor vem na conversa.
            </p>
          </div>
          {/* Lenços dobrados sobre o balcão: só enfeite. */}
          <div aria-hidden="true" className="relative mx-auto hidden aspect-[4/3] w-full max-w-[26rem] md:block">
            <div className="absolute left-0 top-[18%] w-[46%] -rotate-[14deg]">
              <LencoArte padrao="carijo" cores={[cores.verde.hex, cores.branco.hex]} titulo="" />
            </div>
            <div className="absolute right-0 top-[18%] w-[46%] rotate-[12deg]">
              <LencoArte padrao="farroupilha" cores={[cores.verde.hex, cores.vermelho.hex, cores.amarelo.hex]} titulo="" />
            </div>
            <div className="absolute left-1/2 top-0 w-[54%] -translate-x-1/2">
              <LencoArte padrao="liso" cores={[cores.vermelho.hex]} titulo="" />
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="linha-de-ponto" />
      </section>

      <section className="secao-clara-2 py-10 md:py-14" aria-labelledby="titulo-vitrine">
        <div className="conteudo">
          <h2 id="titulo-vitrine" className="sr-only">
            Todas as peças
          </h2>
          <GradeProdutos produtos={produtos} filtro />
        </div>
      </section>

      <section className="secao-escura trama py-14 md:py-20" aria-labelledby="titulo-linhas">
        <div className="conteudo">
          <Revelar>
            <p className="rotulo text-ouro">Por linha</p>
            <h2 id="titulo-linhas" className="mt-2">
              Cada linha, um desenho
            </h2>
          </Revelar>
          <hr className="linha-de-ponto my-8" />
          <ul role="list" className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria, i) => {
              const variacao = variacoesDaCategoria(categoria.slug, 1)[0];
              const quantos = produtosDaCategoria(categoria.slug).length;
              return (
                <Revelar como="li" key={categoria.slug} atraso={(i % 3) * 0.06} className="min-w-0">
                  <Link
                    href={caminhoCategoria(categoria.slug)}
                    className="group flex h-full items-center gap-4 rounded-[var(--raio)] border border-creme/15 bg-couro-2 p-3 no-underline transition-colors hover:border-ouro/60"
                  >
                    <span className="relative block w-24 shrink-0 overflow-hidden rounded-[var(--raio-pequeno)] bg-couro p-2 sm:w-28">
                      {variacao && <LencoArte padrao={variacao.padrao} cores={variacao.cores} titulo={variacao.titulo} mostrarFranja={false} />}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-titulo text-[1.2rem] font-semibold leading-snug">{categoria.nome}</span>
                      <span className="text-[0.95rem] leading-snug text-creme-2">{categoria.resumo}</span>
                      <span className="rotulo mt-1 inline-flex items-center gap-1 text-ouro">
                        Ver a linha · {pecas(quantos)}
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                    </span>
                  </Link>
                </Revelar>
              );
            })}
          </ul>
        </div>
      </section>

      <BlocoAjuda
        titulo="Não achou o que procura? Chame no WhatsApp"
        texto="Manda uma mensagem contando a cor, a medida ou o modelo que você quer."
        mensagem={MENSAGEM_CATALOGO}
        origem="catalogo"
        tom="claro"
      />
    </>
  );
}
