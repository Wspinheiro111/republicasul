import type { Metadata } from "next";
import Link from "next/link";
import BotaoWhatsApp from "../../components/BotaoWhatsApp";
import CabecaPagina from "../../components/conteudo/CabecaPagina";
import FichaLenco from "../../components/conteudo/FichaLenco";
import LencosEmLeque from "../../components/conteudo/LencosEmLeque";
import LinkSeta from "../../components/conteudo/LinkSeta";
import { MENSAGEM_CUIDADOS, MENSAGEM_FOTO_PILCHA } from "../../components/conteudo/mensagens";
import { caminhoCategoria, caminhoProduto, jsonLd, metadadosPagina, urlAbsoluta } from "../../components/conteudo/seo";
import Sumario from "../../components/conteudo/Sumario";
import LencoArte from "../../components/LencoArte";
import Revelar from "../../components/Revelar";
import { cores } from "../../content/catalogo";
import { empresa, SITE_URL } from "../../content/site";

const CAMINHO = "/guia-do-lenco/";
const TITULO = "Guia do lenço gaúcho: cores, nomes e padrões";
const DESCRICAO =
  "Maragato e chimango, o lenço farroupilha, liso ou carijó: um guia curto para escolher o lenço da pilcha. Na dúvida, mande uma foto no WhatsApp.";

export const metadata: Metadata = metadadosPagina({ titulo: TITULO, descricao: DESCRICAO, caminho: CAMINHO });

const secoes = [
  { id: "cores", nome: "As cores e seus nomes" },
  { id: "farroupilha", nome: "O lenço farroupilha" },
  { id: "liso-ou-carijo", nome: "Liso ou carijó" },
  { id: "como-escolher", nome: "Como escolher" },
  { id: "cuidados", nome: "Cuidados com o lenço" },
];

const artigo = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITULO,
  description: DESCRICAO,
  inLanguage: "pt-BR",
  mainEntityOfPage: urlAbsoluta(CAMINHO),
  url: urlAbsoluta(CAMINHO),
  image: urlAbsoluta("/og.png"),
  author: { "@type": "Organization", name: empresa.nome, url: SITE_URL },
  publisher: { "@type": "Organization", name: empresa.nome, url: SITE_URL },
};

function NumeroSecao({ n, tom = "claro" }: { n: number; tom?: "claro" | "escuro" }) {
  return (
    <span className={`rotulo ${tom === "escuro" ? "text-ouro" : "text-ouro-escuro"}`}>
      {String(n).padStart(2, "0")} · Guia do lenço
    </span>
  );
}

export default function GuiaDoLenco() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(artigo) }} />

      <CabecaPagina
        id="titulo-guia"
        trilha={[{ nome: "Guia do lenço", href: CAMINHO }]}
        rotulo="Para quem está começando"
        titulo="Guia do lenço"
        arte={
          <LencosEmLeque
            lencos={[
              { padrao: "carijo", cores: [cores.azul.hex, cores.branco.hex], titulo: "Lenço carijó azul" },
              { padrao: "farroupilha", cores: [cores.verde.hex, cores.vermelho.hex, cores.amarelo.hex], titulo: "Lenço farroupilha" },
              { padrao: "liso", cores: [cores.branco.hex], titulo: "Lenço chimango" },
              { padrao: "liso", cores: [cores.vermelho.hex], titulo: "Lenço maragato" },
            ]}
          />
        }
        rodape={<Sumario itens={secoes} />}
      >
        <p>As cores, os nomes e os padrões do lenço gaúcho, em poucas linhas.</p>
        <p className="text-[1.05rem]">Para quem vai pilchar pela primeira vez e para quem quer escolher com mais segurança.</p>
      </CabecaPagina>

      {/* 01 · Cores */}
      <section id="cores" aria-labelledby="titulo-cores" className="secao-clara py-14 md:py-20">
        <div className="conteudo grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-14">
          <Revelar>
            <NumeroSecao n={1} />
            <h2 id="titulo-cores" className="mt-3">
              As cores e seus nomes
            </h2>
            <div className="texto-grande mt-6 flex flex-col gap-4">
              <p>
                Na tradição gaúcha, o lenço vermelho é chamado de <strong>maragato</strong> e o branco, de <strong>chimango</strong>.
              </p>
              <p>
                Os nomes vêm das disputas políticas do Rio Grande do Sul, na Revolução Federalista de 1893 e na Revolução de 1923.
              </p>
            </div>
            <p className="mt-6">
              Na Republicasul, os dois fazem parte da linha de lenços tradicionais, ao lado do azul royal e do verde esmeralda.
            </p>
            <p className="mt-3">
              <LinkSeta href={caminhoCategoria("lencos-tradicionais")}>Ver os lenços tradicionais</LinkSeta>
            </p>
          </Revelar>

          <ul className="grid gap-4 sm:grid-cols-2" aria-label="Maragato e chimango">
            <Revelar como="li">
              <FichaLenco
                padrao="liso"
                cores={[cores.vermelho.hex]}
                nome="Maragato"
                texto="O lenço vermelho."
                tituloArte="Desenho do lenço maragato, vermelho"
                link={{ href: caminhoProduto("lenco-tradicional-maragato"), texto: "Ver o maragato" }}
              />
            </Revelar>
            <Revelar como="li" atraso={0.08}>
              <FichaLenco
                padrao="liso"
                cores={[cores.branco.hex]}
                nome="Chimango"
                texto="O lenço branco."
                tituloArte="Desenho do lenço chimango, branco"
                link={{ href: caminhoProduto("lenco-tradicional-chimango"), texto: "Ver o chimango" }}
              />
            </Revelar>
          </ul>
        </div>
      </section>

      {/* 02 · Farroupilha */}
      <section id="farroupilha" aria-labelledby="titulo-farroupilha" className="secao-escura trama py-14 md:py-20">
        <div className="conteudo grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
          <div className="order-last mx-auto w-full max-w-[15rem] sm:max-w-[18rem] md:order-first md:max-w-[22rem]">
            <LencoArte
              padrao="farroupilha"
              cores={[cores.verde.hex, cores.vermelho.hex, cores.amarelo.hex]}
              titulo="Desenho do lenço farroupilha, em verde, vermelho e amarelo"
            />
          </div>
          <Revelar>
            <NumeroSecao n={2} tom="escuro" />
            <h2 id="titulo-farroupilha" className="mt-3">
              O lenço farroupilha
            </h2>
            <p className="texto-grande mt-6 text-creme-2">
              O lenço farroupilha leva as três cores da bandeira do Rio Grande do Sul: verde, vermelho e amarelo.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3" aria-label="Cores da bandeira do Rio Grande do Sul">
              {[cores.verde, cores.vermelho, cores.amarelo].map((cor) => (
                <li key={cor.id} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-5 w-5 rounded-[var(--raio-pequeno)] border border-creme/30"
                    style={{ backgroundColor: cor.hex }}
                  />
                  <span className="rotulo text-creme">{cor.nome}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-creme-2">Combina com a Semana Farroupilha, que termina em 20 de setembro, e vale para o ano inteiro.</p>
            <p className="mt-4 border-l-2 border-dashed border-ouro/60 pl-4 text-creme">
              Vai usar na Semana Farroupilha? Chame no WhatsApp com tempo para combinar o prazo.
            </p>
            <p className="mt-6">
              <LinkSeta href={caminhoProduto("lenco-farroupilha")} tom="escuro">
                Ver o lenço farroupilha
              </LinkSeta>
            </p>
          </Revelar>
        </div>
      </section>

      {/* 03 · Liso ou carijó */}
      <section id="liso-ou-carijo" aria-labelledby="titulo-liso-carijo" className="secao-clara py-14 md:py-20">
        <div className="conteudo">
          <Revelar className="max-w-2xl">
            <NumeroSecao n={3} />
            <h2 id="titulo-liso-carijo" className="mt-3">
              Liso ou carijó
            </h2>
            <div className="texto-grande mt-6 flex flex-col gap-4">
              <p>O lenço liso tem uma cor só, de ponta a ponta.</p>
              <p>
                O <strong>carijó</strong> tem um xadrez miúdo tramado no próprio tecido. Ele pode vir em uma cor sobre o fundo claro ou em duas
                cores cruzadas.
              </p>
            </div>
          </Revelar>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Padrões do lenço">
            <Revelar como="li">
              <FichaLenco
                padrao="liso"
                cores={[cores.azulRoyal.hex]}
                nome="Liso"
                texto="Uma cor só. Na Republicasul, é a linha de lenços tradicionais."
                tituloArte="Desenho de lenço liso, azul royal"
                link={{ href: caminhoCategoria("lencos-tradicionais"), texto: "Ver os lisos" }}
              />
            </Revelar>
            <Revelar como="li" atraso={0.08}>
              <FichaLenco
                padrao="carijo"
                cores={[cores.azul.hex, cores.branco.hex]}
                nome="Carijó uma cor"
                texto="O xadrez em uma cor, sobre o fundo claro."
                tituloArte="Desenho de lenço carijó de uma cor, xadrez azul sobre fundo claro"
                link={{ href: caminhoCategoria("carijo-uma-cor"), texto: "Ver o carijó uma cor" }}
              />
            </Revelar>
            <Revelar como="li" atraso={0.16}>
              <FichaLenco
                padrao="carijo"
                cores={[cores.vermelho.hex, cores.verde.hex]}
                nome="Carijó duas cores"
                texto="Duas cores cruzadas na trama. Você escolhe a combinação."
                tituloArte="Desenho de lenço carijó de duas cores, vermelho e verde"
                link={{ href: caminhoCategoria("carijo-duas-cores"), texto: "Ver o carijó duas cores" }}
              />
            </Revelar>
          </ul>

          <div className="mt-10 flex flex-col gap-4 rounded-[var(--raio)] border border-dashed border-ouro-escuro/50 bg-creme-2/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="max-w-xl">
              Quer ver a combinação antes de pedir? No montador, você escolhe as cores e o desenho muda na hora.
            </p>
            <LinkSeta href="/montador/" className="shrink-0">
              Abrir o montador
            </LinkSeta>
          </div>
        </div>
      </section>

      {/* 04 · Como escolher */}
      <section id="como-escolher" aria-labelledby="titulo-escolher" className="secao-clara-2 py-14 md:py-20">
        <div className="conteudo grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <Revelar>
            <NumeroSecao n={4} />
            <h2 id="titulo-escolher" className="mt-3">
              Como escolher
            </h2>
            <p className="texto-grande mt-6">Dois pontos ajudam: a ocasião e o seu gosto.</p>

            <div className="costura secao-escura trama mt-8 rounded-[var(--raio)] p-6 sm:p-7">
              <p className="titulo-3 text-creme">Na dúvida, mande uma foto da pilcha no WhatsApp que a gente ajuda.</p>
              <BotaoWhatsApp texto={MENSAGEM_FOTO_PILCHA} origem="guia-do-lenco" className="relative z-[1] mt-5">
                Mandar foto no WhatsApp
              </BotaoWhatsApp>
            </div>
          </Revelar>

          <ol className="flex flex-col">
            {[
              {
                titulo: "A ocasião",
                texto:
                  "Pense onde o lenço vai: CTG, rodeio, desfile, apresentação da invernada ou uma roda de mate no galpão. Se o seu grupo combinou uma cor, siga o combinado.",
              },
              {
                titulo: "A pilcha",
                texto: "Olhe as cores da bombacha, da camisa, do colete ou do vestido de prenda. O lenço pode acompanhar essas cores ou fazer contraste.",
              },
              {
                titulo: "O seu gosto",
                texto: "Fora isso, vale o gosto: liso para quem quer a cor firme, carijó para quem quer desenho.",
              },
            ].map((passo, i) => (
              <Revelar como="li" key={passo.titulo} atraso={i * 0.08} className="flex gap-5 border-t border-dashed border-ouro-escuro/40 py-6 first:border-t-0 first:pt-0">
                <span className="w-8 shrink-0 text-center font-titulo text-[2.25rem] font-semibold leading-none text-ouro-escuro tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{passo.titulo}</h3>
                  <p className="mt-2">{passo.texto}</p>
                </div>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* 05 · Cuidados */}
      <section id="cuidados" aria-labelledby="titulo-cuidados" className="secao-escura trama py-14 md:py-20">
        <div className="conteudo grid items-center gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
          <Revelar className="max-w-2xl">
            <NumeroSecao n={5} tom="escuro" />
            <h2 id="titulo-cuidados" className="mt-3">
              Cuidados com o lenço
            </h2>
            <p className="texto-grande mt-6 text-creme-2">
              Antes de lavar ou guardar o seu lenço, peça as recomendações na conversa do WhatsApp. A gente explica como cuidar dele.
            </p>
            <BotaoWhatsApp texto={MENSAGEM_CUIDADOS} origem="guia-do-lenco" className="mt-7">
              Pedir as recomendações
            </BotaoWhatsApp>
          </Revelar>
          {/* Lenço dobrado, guardado: só enfeite. */}
          <div aria-hidden="true" className="mx-auto hidden w-full max-w-[17rem] -rotate-6 md:block">
            <LencoArte padrao="carijo" cores={[cores.verde.hex, cores.branco.hex]} titulo="" mostrarFranja={false} />
          </div>
        </div>
      </section>

      {/* Fecho */}
      <section aria-labelledby="titulo-pronto" className="secao-clara py-14 md:py-16">
        <div className="conteudo flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="titulo-pronto" className="titulo-faixa">
              Pronto para escolher?
            </h2>
            <p className="mt-3 max-w-xl">Escolha no catálogo ou monte o seu lenço. O pedido vai pronto pelo WhatsApp.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/catalogo/" className="botao-acao">
              Ver os lenços
            </Link>
            <Link href="/montador/" className="botao-contorno">
              Monte o seu lenço
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
