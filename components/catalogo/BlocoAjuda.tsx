/*
 * BlocoAjuda: chamada para o WhatsApp no fim das páginas do catálogo.
 *
 *   <BlocoAjuda
 *     titulo="Não achou a cor ou a medida? Chame no WhatsApp"
 *     texto="Manda uma mensagem contando o que procura."
 *     mensagem={mensagemCategoria(categoria)}
 *     origem="categoria"
 *   />
 *
 * Renderiza uma <section> com trama, título (h2), texto e o botão.
 * tom: "escuro" (padrão, couro) ou "claro" (creme), para alternar com a
 * seção de cima e com o rodapé.
 */

import { cores } from "../../content/catalogo";
import BotaoWhatsApp from "../BotaoWhatsApp";
import LencoArte from "../LencoArte";

export type BlocoAjudaProps = {
  titulo: string;
  texto: string;
  mensagem: string;
  origem: string;
  produto?: string;
  id?: string;
  tom?: "escuro" | "claro";
};

export default function BlocoAjuda({ titulo, texto, mensagem, origem, produto, id = "ajuda", tom = "escuro" }: BlocoAjudaProps) {
  const escuro = tom === "escuro";
  return (
    <section className={`${escuro ? "secao-escura" : "secao-clara-2"} trama relative overflow-hidden`} aria-labelledby={`${id}-titulo`}>
      <div aria-hidden="true" className="linha-de-ponto" />
      <div className="conteudo grid items-center gap-8 py-14 md:grid-cols-[1fr_auto] md:py-16">
        <div className="max-w-2xl">
          <p className={`rotulo ${escuro ? "text-ouro" : "text-ouro-escuro"}`}>Atendimento pelo WhatsApp</p>
          <h2 id={`${id}-titulo`} className="titulo-faixa mt-3">
            {titulo}
          </h2>
          <p className={`texto-grande mt-4 ${escuro ? "text-creme-2" : "text-tinta/80"}`}>{texto}</p>
          <BotaoWhatsApp texto={mensagem} origem={origem} produto={produto} className="mt-7">
            Chamar no WhatsApp
          </BotaoWhatsApp>
        </div>
        {/* Três lenços dobrados, só enfeite. */}
        <div aria-hidden="true" className="relative hidden h-44 w-64 md:block">
          <div className="absolute left-0 top-4 w-32 -rotate-12 opacity-90">
            <LencoArte padrao="carijo" cores={[cores.azul.hex, cores.branco.hex]} titulo="" mostrarFranja={false} />
          </div>
          <div className="absolute right-0 top-4 w-32 rotate-12 opacity-90">
            <LencoArte padrao="liso" cores={[escuro ? cores.branco.hex : cores.verdeEsmeralda.hex]} titulo="" mostrarFranja={false} />
          </div>
          <div className="absolute left-1/2 top-0 w-36 -translate-x-1/2">
            <LencoArte padrao="liso" cores={[cores.vermelho.hex]} titulo="" />
          </div>
        </div>
      </div>
    </section>
  );
}
