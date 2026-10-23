import type { Metadata } from "next";
import ListaPedido from "../../components/pedido/ListaPedido";
import Trilha from "../../components/Trilha";
import { IMAGEM_COMPARTILHAMENTO } from "../../components/conteudo/seo";
import { empresa } from "../../content/site";

const titulo = "Seu pedido";
const descricao = "A sua lista de lenços e palas da Republicasul, pronta para mandar pelo WhatsApp.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: "/pedido/" },
  // A lista é de cada visitante: nada para o Google indexar aqui.
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: empresa.nome,
    title: `${titulo} | ${empresa.nome}`,
    description: descricao,
    url: "/pedido/",
    images: [IMAGEM_COMPARTILHAMENTO],
  },
};

export default function PaginaPedido() {
  return (
    <>
      <section className="secao-escura trama" aria-labelledby="titulo-pedido">
        <div className="conteudo pb-10 pt-6 md:pb-14 md:pt-8">
          <Trilha itens={[{ nome: titulo, href: "/pedido/" }]} tom="escuro" />
          <p className="rotulo mt-6 text-ouro">Lista de pedido · venda pelo WhatsApp</p>
          <h1 id="titulo-pedido" className="titulo-pagina mt-3">
            {titulo}
          </h1>
          <p className="texto-grande mt-4 max-w-2xl text-creme-2">
            Confira as peças, ajuste as quantidades e mande tudo de uma vez pelo WhatsApp.
          </p>
        </div>
        <div aria-hidden="true" className="linha-de-ponto" />
      </section>

      <section className="secao-clara py-10 md:py-14" aria-label="Itens do pedido e envio">
        <div className="conteudo">
          <ListaPedido />
        </div>
      </section>
    </>
  );
}
