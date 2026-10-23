import type { Metadata } from "next";
import Link from "next/link";
import BotaoWhatsApp from "../../components/BotaoWhatsApp";
import CabecaPagina from "../../components/conteudo/CabecaPagina";
import { contatosConfirmados, redesConfirmadas } from "../../components/conteudo/contatos";
import LinkSeta, { Seta } from "../../components/conteudo/LinkSeta";
import { MENSAGEM_SOBRE } from "../../components/conteudo/mensagens";
import { caminhoCategoria, metadadosPagina } from "../../components/conteudo/seo";
import LencoArte from "../../components/LencoArte";
import Revelar from "../../components/Revelar";
import Selo from "../../components/Selo";
import { categorias, cores } from "../../content/catalogo";
import { empresa } from "../../content/site";

export const metadata: Metadata = metadadosPagina({
  titulo: "Sobre a Republicasul",
  descricao: `A Republicasul, de ${empresa.cidade}/${empresa.uf}, trabalha com lenços e palas da indumentária gaúcha tramados artesanalmente. Veja como comprar pelo WhatsApp e como falar com a gente.`,
  caminho: "/sobre/",
});

const passos = [
  { titulo: "Escolha", texto: "Veja o catálogo ou monte o seu lenço escolhendo as cores." },
  { titulo: "Junte no pedido", texto: "Cada peça entra na lista com a cor, a medida e a quantidade." },
  { titulo: "Mande pelo WhatsApp", texto: "A mensagem vai pronta. Valor, prazo e frete vêm na conversa." },
];

export default function Sobre() {
  const contatos = contatosConfirmados();
  const redes = redesConfirmadas();

  return (
    <>
      <CabecaPagina
        id="titulo-sobre"
        trilha={[{ nome: "Sobre", href: "/sobre/" }]}
        rotulo="Quem somos"
        titulo="Sobre a Republicasul"
        arte={
          <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-[20rem] md:max-w-[24rem]">
            <LencoArte padrao="liso" cores={[cores.vermelho.hex]} titulo="Desenho do lenço maragato na Trama Republicasul" />
            {/* O Selo já é "relative"; quem posiciona é este invólucro. */}
            <div className="absolute bottom-[4%] right-[2%] w-24 rotate-[-10deg] sm:w-28 md:-right-3">
              <Selo className="w-full" />
            </div>
          </div>
        }
      >
        <p>
          Lenços e palas da indumentária gaúcha, de {empresa.cidade}/{empresa.uf}.
        </p>
        <p className="text-[1.05rem]">Conheça a casa, veja como comprar e fale com a gente.</p>
      </CabecaPagina>

      {/* Quem é */}
      <section aria-labelledby="titulo-quem" className="secao-clara py-14 md:py-20">
        <div className="conteudo grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">
          <Revelar>
            <p className="rotulo text-ouro-escuro">Quem é</p>
            <h2 id="titulo-quem" className="mt-3">
              Uma casa de lenços e palas
            </h2>
            <p className="texto-grande mt-6">
              A {empresa.nome} é uma empresa de {empresa.cidade}/{empresa.uf} que trabalha com lenços e palas da indumentária gaúcha.
            </p>
            <figure className="mt-8 border-l-2 border-dashed border-ouro-escuro/60 pl-5">
              <blockquote className="font-titulo text-[1.45rem] font-medium leading-snug">
                <p>&ldquo;{empresa.assinatura}&rdquo;</p>
              </blockquote>
              <figcaption className="rotulo mt-3 text-ouro-escuro">Como a casa se apresenta</figcaption>
            </figure>
          </Revelar>

          <Revelar atraso={0.08}>
            <dl className="costura secao-escura trama grid gap-5 rounded-[var(--raio)] p-6 sm:p-7">
              <div>
                <dt className="rotulo text-ouro">Empresa</dt>
                <dd className="mt-1 font-titulo text-[1.35rem] font-semibold text-creme">{empresa.nome}</dd>
              </div>
              <div>
                <dt className="rotulo text-ouro">CNPJ</dt>
                <dd className="mt-1 text-creme tabular-nums">{empresa.cnpj}</dd>
              </div>
              <div>
                <dt className="rotulo text-ouro">Cidade</dt>
                <dd className="mt-1 text-creme">
                  {empresa.cidade}/{empresa.uf}
                </dd>
              </div>
            </dl>
          </Revelar>
        </div>
      </section>

      {/* O que faz */}
      <section aria-labelledby="titulo-faz" className="secao-escura trama py-14 md:py-20">
        <div className="conteudo grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Revelar>
            <p className="rotulo text-ouro">O que faz</p>
            <h2 id="titulo-faz" className="mt-3">
              Lenços e palas tramados artesanalmente
            </h2>
            <p className="texto-grande mt-6 text-creme-2">
              Os lenços tradicionais levam a Trama Republicasul, a trama que dá nome à casa.
            </p>
            <p className="mt-4 text-creme-2">Tem também o carijó, de uma ou duas cores, o lenço farroupilha e os palas.</p>
          </Revelar>

          <ul className="flex flex-col">
            {categorias.map((categoria, i) => (
              <Revelar como="li" key={categoria.slug} atraso={i * 0.05} className="border-t border-dashed border-ouro/35 last:border-b">
                <Link
                  href={caminhoCategoria(categoria.slug)}
                  className="group grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-4 text-creme no-underline"
                >
                  <span className="font-titulo text-[1.3rem] font-semibold group-hover:underline group-hover:decoration-ouro/70 group-hover:decoration-dashed group-hover:underline-offset-4">
                    {categoria.nome}
                  </span>
                  <span className="row-span-2 text-ouro transition-transform group-hover:translate-x-1">
                    <Seta className="h-5 w-5" />
                  </span>
                  <span className="text-[0.98rem] text-creme-2">{categoria.resumo}</span>
                </Link>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      {/* Como comprar */}
      <section aria-labelledby="titulo-comprar" className="secao-clara-2 py-14 md:py-20">
        <div className="conteudo">
          <Revelar className="max-w-2xl">
            <p className="rotulo text-ouro-escuro">Como comprar</p>
            <h2 id="titulo-comprar" className="mt-3">
              A venda fecha no WhatsApp
            </h2>
            <p className="texto-grande mt-6">No site você monta o pedido. O resto a gente acerta na conversa.</p>
          </Revelar>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {passos.map((passo, i) => (
              <Revelar como="li" key={passo.titulo} atraso={i * 0.08} className="rounded-[var(--raio)] border border-tinta/15 bg-creme p-5 sm:p-6">
                <span className="font-titulo text-[2.4rem] font-semibold leading-none text-ouro-escuro tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-3">{passo.titulo}</h3>
                <p className="mt-2">{passo.texto}</p>
              </Revelar>
            ))}
          </ol>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/catalogo/" className="botao-acao">
              Ver os lenços
            </Link>
            <Link href="/montador/" className="botao-contorno">
              Monte o seu lenço
            </Link>
            <LinkSeta href="/pedido/" className="sm:ml-3">
              Seu pedido
            </LinkSeta>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" aria-labelledby="titulo-contato" className="secao-escura trama py-14 md:py-20">
        <div className="conteudo grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
          <Revelar>
            <p className="rotulo text-ouro">Contato</p>
            <h2 id="titulo-contato" className="mt-3">
              Fale com a gente
            </h2>
            <p className="texto-grande mt-6 text-creme-2">A conversa é pelo WhatsApp. Conte o que procura que a gente ajuda a escolher.</p>
            <BotaoWhatsApp texto={MENSAGEM_SOBRE} origem="sobre" className="mt-7">
              Chamar no WhatsApp
            </BotaoWhatsApp>
            <p className="mt-8 text-creme-2">
              Tem loja de artigos gaúchos?{" "}
              <LinkSeta href="/lojistas/" tom="escuro">
                Veja a página para lojistas
              </LinkSeta>
            </p>
          </Revelar>

          <Revelar atraso={0.08} className="flex flex-col gap-8">
            {contatos.length > 0 && (
              <dl className="flex flex-col gap-4" data-testid="contatos">
                {contatos.map((c) => (
                  <div key={c.rotulo}>
                    <dt className="rotulo text-ouro">{c.rotulo}</dt>
                    <dd className="mt-1 text-creme">
                      {c.href ? (
                        <a href={c.href} className="inline-flex min-h-11 items-center underline decoration-ouro/60 decoration-dashed underline-offset-4">
                          {c.valor}
                        </a>
                      ) : (
                        c.valor
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {redes.length > 0 && (
              <div>
                <p className="rotulo text-ouro">Redes</p>
                <ul className="mt-2 flex flex-wrap gap-3">
                  {redes.map((rede) => (
                    <li key={rede.nome}>
                      <a href={rede.href} target="_blank" rel="noopener" className="botao-contorno botao-pequeno">
                        {rede.nome}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="rotulo text-ouro">Empresa</p>
              <p className="mt-2 text-creme-2">
                {empresa.nome}
                <br />
                CNPJ <span className="tabular-nums">{empresa.cnpj}</span>
                <br />
                {empresa.cidade}/{empresa.uf}
              </p>
            </div>
          </Revelar>
        </div>
      </section>
    </>
  );
}
