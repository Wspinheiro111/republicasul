import type { Metadata } from "next";
import BotaoWhatsApp from "../../components/BotaoWhatsApp";
import CabecaPagina from "../../components/conteudo/CabecaPagina";
import FormularioLojista from "../../components/conteudo/FormularioLojista";
import LencosEmLeque from "../../components/conteudo/LencosEmLeque";
import LinkSeta from "../../components/conteudo/LinkSeta";
import { caminhoCategoria, metadadosPagina } from "../../components/conteudo/seo";
import LencoArte from "../../components/LencoArte";
import Revelar from "../../components/Revelar";
import { categorias, cores, produtosDaCategoria } from "../../content/catalogo";
import { numeroLojistas } from "../../lib/whatsapp";

export const metadata: Metadata = metadadosPagina({
  titulo: "Para lojistas: revenda lenços e palas tramados",
  descricao:
    "Tem loja de artigos gaúchos? Revenda os lenços e palas tramados pela Republicasul, de Porto Alegre/RS. Mande os dados da loja e combine pelo WhatsApp.",
  caminho: "/lojistas/",
});

// Mensagem curta para quem prefere chamar direto, sem preencher o formulário.
const MENSAGEM_DIRETA = "Olá, Republicasul! Tenho uma loja e quero saber as condições para lojistas.";

const passos = [
  { titulo: "Mande os dados da loja", texto: "Nome da loja e cidade já bastam. O resto ajuda a preparar a conversa." },
  { titulo: "Confira a mensagem", texto: "O WhatsApp abre com tudo escrito. Você confere e manda." },
  { titulo: "Combine na conversa", texto: "As condições para lojistas, os modelos e as cores ficam acertados pelo WhatsApp." },
];

// Cores do desenho de cada linha: as do primeiro produto da categoria.
function coresDaLinha(slug: string): string[] {
  return produtosDaCategoria(slug)[0]?.coresDesenho ?? [cores.vermelho.hex];
}

export default function Lojistas() {
  return (
    <>
      <CabecaPagina
        id="titulo-lojistas"
        trilha={[{ nome: "Para lojistas", href: "/lojistas/" }]}
        rotulo="Revenda"
        titulo="Para lojistas"
        arte={
          <LencosEmLeque
            lencos={[
              { padrao: "carijo", cores: [cores.vermelho.hex, cores.verde.hex], titulo: "Lenço carijó duas cores" },
              { padrao: "liso", cores: [cores.azulRoyal.hex], titulo: "Lenço azul royal" },
              { padrao: "carijo", cores: [cores.azul.hex, cores.branco.hex], titulo: "Lenço carijó uma cor" },
              { padrao: "liso", cores: [cores.verdeEsmeralda.hex], titulo: "Lenço verde esmeralda" },
            ]}
          />
        }
      >
        <p>Tem loja de artigos gaúchos? Leve os lenços e palas da Republicasul para a sua vitrine.</p>
        <p className="text-[1.05rem]">As condições para lojistas a gente passa pelo WhatsApp.</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="#formulario" className="botao-acao">
            Mandar os dados da loja
          </a>
          <BotaoWhatsApp texto={MENSAGEM_DIRETA} numero={numeroLojistas()} origem="lojistas" variante="contorno">
            Chamar no WhatsApp
          </BotaoWhatsApp>
        </div>
      </CabecaPagina>

      {/* O que revender: as linhas do catálogo. */}
      <section aria-labelledby="titulo-linhas-lojista" className="secao-clara py-14 md:py-20">
        <div className="conteudo">
          <Revelar className="max-w-2xl">
            <p className="rotulo text-ouro-escuro">Para a sua vitrine</p>
            <h2 id="titulo-linhas-lojista" className="mt-3">
              O que a sua loja pode oferecer
            </h2>
            <p className="texto-grande mt-5">Lenços e palas da indumentária gaúcha, tramados artesanalmente.</p>
          </Revelar>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categorias.map((categoria, i) => (
              <Revelar
                como="li"
                key={categoria.slug}
                atraso={i * 0.06}
                className="flex gap-4 rounded-[var(--raio)] border border-tinta/15 bg-creme-2/60 p-4 sm:flex-col sm:gap-0"
              >
                {/* No celular o cartão fica deitado; do sm para cima, em pé. */}
                <div className="secao-escura trama w-24 shrink-0 self-start rounded-[var(--raio-pequeno)] p-2 sm:mx-auto sm:w-full sm:p-4">
                  <LencoArte
                    padrao={categoria.padrao}
                    cores={coresDaLinha(categoria.slug)}
                    titulo={`Desenho: ${categoria.nome}`}
                    xadrez="graudo"
                    mostrarFranja={false}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="text-[1.2rem] sm:mt-4">{categoria.nome}</h3>
                  <p className="mt-1.5 text-[0.98rem] text-tinta/85">{categoria.resumo}</p>
                  <p className="mt-auto pt-2 sm:pt-3">
                    <LinkSeta href={caminhoCategoria(categoria.slug)}>Ver no catálogo</LinkSeta>
                  </p>
                </div>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section aria-labelledby="titulo-como-lojista" className="secao-escura trama py-14 md:py-20">
        <div className="conteudo">
          <p className="rotulo text-ouro">Sem cadastro no site</p>
          <h2 id="titulo-como-lojista" className="mt-3">
            Como funciona
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
            {passos.map((passo, i) => (
              <Revelar
                como="li"
                key={passo.titulo}
                atraso={i * 0.08}
                className="relative flex gap-4 md:flex-col md:gap-3 md:border-l md:border-dashed md:border-ouro/35 md:px-7 md:first:border-l-0 md:first:pl-0"
              >
                {/* Largura fixa: os números da Fraunces têm larguras diferentes e desalinhavam os títulos no celular. */}
                <span
                  className="w-9 shrink-0 text-center font-titulo text-[2.6rem] font-semibold leading-none text-ouro tabular-nums md:w-auto md:text-left"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-creme">{passo.titulo}</h3>
                  <p className="mt-2 text-creme-2">{passo.texto}</p>
                </div>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* Formulário */}
      <section id="formulario" aria-labelledby="titulo-formulario-lojista" className="secao-clara-2 py-14 md:py-20">
        <div className="conteudo grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <p className="rotulo text-ouro-escuro">Formulário</p>
            <h2 id="titulo-formulario-lojista" className="mt-3">
              Dados da loja
            </h2>
            <p className="texto-grande mt-5">Só o nome da loja e a cidade são obrigatórios.</p>
            <p className="mt-4">
              {/* Sem número em content/site.ts o link não chega à Republicasul: a frase não promete isso. */}
              {numeroLojistas()
                ? "Ao enviar, o WhatsApp abre com a mensagem pronta para a Republicasul. As condições para lojistas vêm na conversa."
                : "Ao enviar, o WhatsApp abre com a mensagem pronta. As condições para lojistas vêm na conversa."}
            </p>
            <hr className="linha-de-ponto mt-8 max-w-xs" />
            <p className="mt-6 text-[0.98rem] text-tinta/80">Prefere conversar direto?</p>
            <BotaoWhatsApp texto={MENSAGEM_DIRETA} numero={numeroLojistas()} origem="lojistas" variante="contorno" className="mt-3">
              Chamar no WhatsApp
            </BotaoWhatsApp>
          </div>
          <div className="rounded-[var(--raio-grande)] border border-tinta/15 bg-creme p-5 sm:p-8">
            <FormularioLojista idTitulo="titulo-formulario-lojista" />
          </div>
        </div>
      </section>
    </>
  );
}
