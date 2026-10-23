/*
 * Chamada final em vermelho maragato: WhatsApp para tirar dúvida ou mandar o
 * pedido. O botão do WhatsApp vai em creme sobre o vermelho (o verde do
 * WhatsApp brigaria com o maragato); o ícone continua verde.
 */

import Link from "next/link";
import BotaoWhatsApp from "../BotaoWhatsApp";
import { MENSAGEM_GERAL } from "../navegacao";
import Selo from "../Selo";
import estilos from "./Inicio.module.css";

export default function ChamadaFinal() {
  return (
    <section aria-labelledby="inicio-chamada" className={`${estilos.maragato} trama relative overflow-hidden py-14 md:py-20`}>
      <div className="conteudo relative grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-2xl">
          <p className="rotulo text-creme">A venda fecha no WhatsApp</p>
          <h2 id="inicio-chamada" className="mt-3">
            Ficou na dúvida? Chama a gente no WhatsApp.
          </h2>
          <p className="texto-grande mt-4 text-creme">
            A gente ajuda a escolher o lenço, a cor e a medida. Se a lista já está pronta, é só abrir o seu pedido e enviar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BotaoWhatsApp
              texto={MENSAGEM_GERAL}
              origem="inicio-final"
              variante="contorno"
              className="border-creme! bg-creme text-tinta! shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:bg-creme-2! [&>svg]:text-whats"
            >
              Chamar no WhatsApp
            </BotaoWhatsApp>
            <Link href="/pedido/" className="botao-contorno text-creme">
              Ver seu pedido
            </Link>
          </div>
        </div>
        <Selo girando className="hidden w-40 rotate-[-8deg] md:block lg:w-48" />
      </div>
    </section>
  );
}
