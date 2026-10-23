import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlocoAjuda from "../../../components/catalogo/BlocoAjuda";
import CicloCategoria from "../../../components/catalogo/CicloCategoria";
import {
  mensagemCategoria,
  mensagemCategoriaSemOpcoes,
  passosDaCompra,
  pecas,
  tituloDaLinha,
} from "../../../components/catalogo/funcoes";
import GradeProdutos from "../../../components/catalogo/GradeProdutos";
import { caminhoCategoria, caminhoProduto, descricaoCategoria, metadadosDaPagina } from "../../../components/catalogo/seo";
import Trilha from "../../../components/Trilha";
import { categoriaPorSlug, categorias, produtosDaCategoria, type Produto } from "../../../content/catalogo";

type Props = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categorias.map((c) => ({ categoria: c.slug }));
}

/** Link da peça única da linha: diz o que a pessoa vai escolher lá. */
function textoVerPeca(produto: Produto): string {
  if (produto.opcoes.some((o) => o.tipo === "cor")) return "Ver a peça e escolher as cores";
  if (produto.opcoes.length > 0) return "Ver a peça e escolher a medida";
  // "Ver a peça" já é o link do topo que desce até o cartão.
  return "Abrir a página da peça";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return {};
  // Título da linha no plural ("Lenços carijó de duas cores"): não disputa a busca com a página do produto.
  return metadadosDaPagina({
    titulo: tituloDaLinha(categoria),
    descricao: descricaoCategoria(categoria),
    caminho: caminhoCategoria(categoria.slug),
  });
}

export default async function PaginaCategoria({ params }: Props) {
  const { categoria: slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) notFound();

  const lista = produtosDaCategoria(categoria.slug);
  const outras = categorias.filter((c) => c.slug !== categoria.slug);
  const titulo = tituloDaLinha(categoria);
  const unica = lista.length === 1 ? lista[0] : undefined;
  // Linha em que nenhuma peça tem cor ou medida para escolher no site (os palas).
  const semOpcoes = lista.length > 0 && lista.every((p) => p.opcoes.length === 0);

  return (
    <>
      <section className="secao-escura trama relative overflow-hidden" aria-labelledby="titulo-categoria">
        <div className="conteudo grid items-center gap-8 pb-10 pt-6 md:grid-cols-[1.2fr_1fr] md:gap-12 md:pb-14 md:pt-8">
          <div className="min-w-0">
            <Trilha
              itens={[
                { nome: "Lenços", href: "/catalogo/" },
                { nome: titulo, href: caminhoCategoria(categoria.slug) },
              ]}
              tom="escuro"
            />
            <p className="rotulo mt-6 text-ouro">Linha · {pecas(lista.length)}</p>
            <h1 id="titulo-categoria" className="titulo-pagina mt-3">
              {titulo}
            </h1>
            <p className="texto-grande mt-5 max-w-xl text-creme-2">{categoria.descricao}</p>
            <a href="#pecas" className="botao-contorno mt-8">
              Ver {lista.length === 1 ? "a peça" : "as peças"}
            </a>
          </div>
          <div className="mx-auto w-full max-w-[17rem] sm:max-w-[20rem] md:max-w-[24rem]">
            <CicloCategoria slug={categoria.slug} />
          </div>
        </div>
        <div aria-hidden="true" className="linha-de-ponto" />
      </section>

      <section id="pecas" className="secao-clara-2 py-10 md:py-14" aria-labelledby="titulo-pecas">
        <div className="conteudo">
          <h2 id="titulo-pecas" className="titulo-3 mb-6 text-[1.5rem] md:mb-8">
            {lista.length === 1 ? "A peça desta linha" : "Peças desta linha"}
          </h2>
          {unica ? (
            // Uma peça só: o cartão e, ao lado, como comprar e o link para a peça (sem faixa vazia ao lado).
            <div className="grid items-center gap-8 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
              <GradeProdutos produtos={lista} mostrarCategoria={false} classeGrade="grid" className="mx-auto w-full max-w-[20rem] sm:max-w-none" />
              <div className="max-w-xl">
                <h3 className="titulo-3 text-[1.35rem]">Como funciona a compra</h3>
                <ol role="list" className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
                  {passosDaCompra(unica).map((passo, i) => (
                    <li key={passo} className="flex items-start gap-4">
                      <span aria-hidden="true" className="w-6 shrink-0 font-titulo text-[1.8rem] font-bold leading-none text-ouro-escuro">
                        {i + 1}
                      </span>
                      <span className="pt-1">{passo}</span>
                    </li>
                  ))}
                </ol>
                <Link href={caminhoProduto(unica.slug)} className="botao-contorno mt-7">
                  {textoVerPeca(unica)}
                </Link>
              </div>
            </div>
          ) : (
            <GradeProdutos produtos={lista} mostrarCategoria={false} />
          )}
        </div>
      </section>

      <BlocoAjuda
        id="ajuda-categoria"
        titulo={semOpcoes ? "Conte o modelo e a cor do pala que você procura" : "Não achou a cor ou a medida? Chame no WhatsApp"}
        texto="Mande uma mensagem contando o que você procura nesta linha."
        mensagem={semOpcoes ? mensagemCategoriaSemOpcoes(categoria) : mensagemCategoria(categoria)}
        origem="categoria"
      />

      <nav aria-labelledby="titulo-outras-linhas" className="secao-clara py-10 md:py-12">
        <div className="conteudo">
          <h2 id="titulo-outras-linhas" className="titulo-3 text-[1.35rem]">
            Outras linhas
          </h2>
          <ul role="list" className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
            {outras.map((c) => (
              <li key={c.slug}>
                <Link
                  href={caminhoCategoria(c.slug)}
                  className="inline-flex min-h-11 items-center rounded-[var(--raio)] border border-tinta/30 px-4 text-[0.98rem] font-medium no-underline transition-colors hover:border-tinta/70"
                >
                  {c.nome}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/catalogo/"
                className="inline-flex min-h-11 items-center px-2 text-[0.98rem] font-medium underline decoration-ouro-escuro decoration-dashed underline-offset-4"
              >
                Todo o catálogo
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
