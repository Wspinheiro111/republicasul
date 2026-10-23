import type { Metadata } from "next";
import Montador from "../../components/montador/Montador";
import Trilha from "../../components/Trilha";
import { IMAGEM_COMPARTILHAMENTO } from "../../components/conteudo/seo";
import { empresa } from "../../content/site";

const titulo = "Monte o seu lenço";
const descricao =
  "Monte o seu lenço gaúcho: escolha o modelo, as cores e a medida e veja o desenho mudar na hora. Depois ponha no pedido ou mande direto pelo WhatsApp para a Republicasul.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: "/montador/" },
  // O openGraph da página substitui o do layout por inteiro: locale e siteName vão de novo.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: empresa.nome,
    title: `${titulo} | ${empresa.nome}`,
    description: descricao,
    url: "/montador/",
    images: [IMAGEM_COMPARTILHAMENTO],
  },
};

export default function PaginaMontador() {
  return (
    <Montador
      topo={
        <>
          <Trilha itens={[{ nome: titulo, href: "/montador/" }]} />
          <p className="rotulo mt-5 text-ouro-escuro">Montador · prévia ao vivo</p>
          <h1 className="titulo-pagina mt-2">{titulo}</h1>
          <p className="texto-grande mt-4 text-tinta/80">
            Escolha o modelo, as cores e a medida. O desenho acompanha cada escolha. Depois é só pôr no pedido ou mandar direto pelo
            WhatsApp.
          </p>
        </>
      }
    />
  );
}
