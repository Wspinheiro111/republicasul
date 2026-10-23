import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { outrosProdutos, passoEscolha } from "../../../components/catalogo/funcoes";
import GradeProdutos from "../../../components/catalogo/GradeProdutos";
import PainelProduto from "../../../components/catalogo/PainelProduto";
import {
  caminhoCategoria,
  caminhoProduto,
  descricaoProduto,
  jsonLdProduto,
  jsonParaScript,
  metadadosDaPagina,
  urlAbsoluta,
} from "../../../components/catalogo/seo";
import Revelar from "../../../components/Revelar";
import Trilha from "../../../components/Trilha";
import { categoriaPorSlug, produtoPorSlug, produtos } from "../../../content/catalogo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return produtos.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produto = produtoPorSlug(slug);
  if (!produto) return {};
  return metadadosDaPagina({
    titulo: produto.nome,
    descricao: descricaoProduto(produto),
    caminho: caminhoProduto(produto.slug),
    imagens: produto.fotos.map(urlAbsoluta),
  });
}

export default async function PaginaProduto({ params }: Props) {
  const { slug } = await params;
  const produto = produtoPorSlug(slug);
  if (!produto) notFound();

  const categoria = categoriaPorSlug(produto.categoria);
  // Linha com um produto só costuma ter o mesmo nome dele: não repete na trilha.
  const linhaNaTrilha = categoria && categoria.nome.toLowerCase() !== produto.nome.toLowerCase() ? categoria : undefined;
  const outros = outrosProdutos(produto, 4);
  const passos = [
    passoEscolha(produto),
    "Adicione ao seu pedido, junto com outras peças, ou peça agora pelo WhatsApp.",
    "Na conversa a gente passa o valor, o prazo e o frete e combina o resto.",
  ];

  const topo = (
    <div>
      <Trilha
        itens={[
          { nome: "Lenços", href: "/catalogo/" },
          ...(linhaNaTrilha ? [{ nome: linhaNaTrilha.nome, href: caminhoCategoria(linhaNaTrilha.slug) }] : []),
          { nome: produto.nome, href: caminhoProduto(produto.slug) },
        ]}
      />
      {linhaNaTrilha && (
        <p className="rotulo mt-4 text-ouro-escuro">{linhaNaTrilha.nome}</p>
      )}
      <h1 id="titulo-produto" className={`${linhaNaTrilha ? "mt-2" : "mt-4"} text-[clamp(2.2rem,4.6vw,3.6rem)]`}>
        {produto.nome}
      </h1>
      <p className="texto-grande mt-4 text-tinta/80">{produto.resumo}</p>
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonParaScript(jsonLdProduto(produto)) }} />

      <section className="secao-clara pb-14 pt-6 md:pb-20 md:pt-8" aria-labelledby="titulo-produto">
        <div className="conteudo">
          <PainelProduto produto={produto} topo={topo} />
        </div>
      </section>

      <section className="secao-escura trama relative overflow-hidden" aria-labelledby="titulo-sobre">
        <div aria-hidden="true" className="linha-de-ponto" />
        <div className="conteudo grid gap-12 py-14 md:grid-cols-2 md:gap-16 md:py-20">
          <Revelar>
            <p className="rotulo text-ouro">{categoria?.nome ?? "A peça"}</p>
            <h2 id="titulo-sobre" className="mt-2">
              Sobre esta peça
            </h2>
            <p className="texto-grande mt-5 text-creme-2">{produto.descricao}</p>
            {categoria && <p className="mt-4 text-creme-2">{categoria.descricao}</p>}
          </Revelar>

          <Revelar atraso={0.08}>
            <div className="costura rounded-[var(--raio)] bg-couro-2 p-6 sm:p-8">
              <h2 id="titulo-compra" className="text-[clamp(1.6rem,2.8vw,2.2rem)]">
                Como funciona a compra
              </h2>
              <ol role="list" className="m-0 mt-6 flex list-none flex-col gap-5 p-0">
                {passos.map((passo, i) => (
                  <li key={passo} className="flex items-start gap-4">
                    <span aria-hidden="true" className="w-6 shrink-0 font-titulo text-[2rem] font-bold leading-none text-ouro">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-creme">{passo}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Revelar>
        </div>
      </section>

      {outros.length > 0 && (
        <section className="secao-clara-2 py-14 md:py-20" aria-labelledby="titulo-outros">
          <div className="conteudo">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="rotulo text-ouro-escuro">Veja também</p>
                <h2 id="titulo-outros" className="mt-2">
                  Outros lenços
                </h2>
              </div>
              <Link
                href="/catalogo/"
                className="inline-flex min-h-11 items-center font-medium underline decoration-ouro-escuro decoration-dashed underline-offset-4"
              >
                Ver todo o catálogo
              </Link>
            </div>
            <hr className="linha-de-ponto my-8" />
            <GradeProdutos produtos={outros} />
          </div>
        </section>
      )}
    </>
  );
}
