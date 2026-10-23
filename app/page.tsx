// Página inicial da Republicasul.
// Em 5 segundos: o que é (lenço gaúcho tramado, de Porto Alegre), o lenço
// desenhado no herói e como comprar (monta o pedido e fecha pelo WhatsApp).
// As seções ficam em components/inicio/.

import type { Metadata } from "next";
import Categorias from "../components/inicio/Categorias";
import ChamadaFinal from "../components/inicio/ChamadaFinal";
import ComoComprar from "../components/inicio/ComoComprar";
import CoresDoLenco from "../components/inicio/CoresDoLenco";
import DestaqueMontador from "../components/inicio/DestaqueMontador";
import Destaques from "../components/inicio/Destaques";
import FaixaLojistas from "../components/inicio/FaixaLojistas";
import Heroi from "../components/inicio/Heroi";
import Perguntas from "../components/inicio/Perguntas";
import { IMAGEM_COMPARTILHAMENTO } from "../components/conteudo/seo";
import { empresa } from "../content/site";

const TITULO = "Republicasul | Lenços e palas gaúchos tramados artesanalmente";
const DESCRICAO =
  "Lenços gaúchos tramados artesanalmente: maragato, chimango, carijó, farroupilha e palas. Monte o seu pedido no site e feche pelo WhatsApp. Republicasul, Porto Alegre/RS.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: empresa.nome,
    url: "/",
    title: TITULO,
    description: DESCRICAO,
    images: [IMAGEM_COMPARTILHAMENTO],
  },
};

export default function Inicio() {
  return (
    <>
      <Heroi />
      <Categorias />
      <ComoComprar />
      <DestaqueMontador />
      <Destaques />
      <CoresDoLenco />
      <FaixaLojistas />
      <Perguntas />
      <ChamadaFinal />
    </>
  );
}
