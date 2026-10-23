import type { Metadata } from "next";
import Link from "next/link";
import BotaoWhatsApp from "../components/BotaoWhatsApp";
import LinkSeta from "../components/conteudo/LinkSeta";
import { MENSAGEM_404 } from "../components/conteudo/mensagens";
import LencoArte from "../components/LencoArte";
import { cores } from "../content/catalogo";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "Esse caminho não leva a lugar nenhum. Veja os lenços, monte o seu ou chame a Republicasul no WhatsApp.",
  // Substitui o "index, follow" herdado do layout (o Next ainda acrescenta o próprio noindex).
  robots: { index: false, follow: true },
};

export default function NaoEncontrada() {
  return (
    <section aria-labelledby="titulo-404" className="secao-escura trama relative overflow-hidden">
      <div className="conteudo grid items-center gap-10 py-14 md:grid-cols-[1.3fr_1fr] md:py-24">
        <div className="min-w-0">
          <p className="rotulo text-ouro">Erro 404 · página não encontrada</p>
          <h1 id="titulo-404" className="titulo-pagina mt-4">
            Esse caminho não leva a lugar nenhum, tchê
          </h1>
          <p className="texto-grande mt-6 max-w-xl text-creme-2">
            A página que você procurou não existe ou mudou de lugar. Os lenços continuam aqui: escolha por onde seguir.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/catalogo/" className="botao-acao">
              Ver os lenços
            </Link>
            <Link href="/montador/" className="botao-contorno">
              Monte o seu lenço
            </Link>
          </div>
          <div className="mt-3">
            <BotaoWhatsApp texto={MENSAGEM_404} origem="404" variante="contorno" className="w-full sm:w-auto">
              Pedir ajuda no WhatsApp
            </BotaoWhatsApp>
          </div>
          <p className="mt-6">
            <LinkSeta href="/" tom="escuro">
              Voltar ao início
            </LinkSeta>
          </p>
        </div>

        {/* O 404 em dourado e o lenço caído no chão do galpão: só enfeite (some no celular). */}
        <div aria-hidden="true" className="relative mx-auto hidden aspect-square w-full max-w-[24rem] md:block">
          <span className="absolute left-0 top-0 select-none font-titulo text-[10rem] font-bold leading-none tracking-[-0.04em] text-ouro/30">
            404
          </span>
          <div className="absolute bottom-[4%] right-0 w-[78%] rotate-[16deg]">
            <LencoArte padrao="liso" cores={[cores.vermelho.hex]} titulo="" />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="linha-de-ponto" />
    </section>
  );
}
