// PÁGINA PROVISÓRIA: vitrine dos componentes da base visual.
// Será substituída pelo agente da página inicial. Ao substituir, a pasta
// app/_vitrine/ (demonstração do seletor) pode ser apagada.

import Link from "next/link";
import BotaoWhatsApp from "../components/BotaoWhatsApp";
import LencoArte, { LencoCiclo } from "../components/LencoArte";
import Revelar from "../components/Revelar";
import Selo from "../components/Selo";
import { cores, produtos } from "../content/catalogo";
import { MENSAGEM_GERAL } from "../components/navegacao";
import DemoSeletor from "./_vitrine/DemoSeletor";

const tradicionais = [
  { nome: "Maragato", cores: [cores.vermelho.hex] },
  { nome: "Chimango", cores: [cores.branco.hex] },
  { nome: "Azul royal", cores: [cores.azulRoyal.hex] },
  { nome: "Verde esmeralda", cores: [cores.verdeEsmeralda.hex] },
];

export default function Inicio() {
  return (
    <>
      <section className="secao-escura trama overflow-hidden">
        <div className="conteudo grid items-center gap-10 py-14 md:grid-cols-[1.05fr_1fr] md:py-20">
          <div>
            <p className="rotulo text-ouro">Porto Alegre/RS · venda pelo WhatsApp</p>
            <h1 className="mt-4">Lenços e palas tramados artesanalmente</h1>
            <p className="texto-grande mt-6 max-w-xl text-creme-2">
              Escolha o modelo, a cor e a medida. A gente recebe o pedido pronto no WhatsApp e combina o resto na conversa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalogo/" className="botao-acao">
                Ver os lenços
              </Link>
              <BotaoWhatsApp texto={MENSAGEM_GERAL} origem="inicio" variante="contorno">
                Chamar no WhatsApp
              </BotaoWhatsApp>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[30rem]">
            <LencoCiclo variacoes={tradicionais} antesDoNome={<span className="rotulo text-ouro">Trama Republicasul</span>} />
            <Selo className="absolute -bottom-2 -left-2 w-24 sm:w-28" girando />
          </div>
        </div>
      </section>

      <section className="secao-clara py-14 md:py-20" aria-labelledby="padroes">
        <div className="conteudo">
          <p className="rotulo text-ouro-escuro">Os desenhos</p>
          <h2 id="padroes" className="mt-2">
            Cada linha, um desenho
          </h2>
          <hr className="linha-de-ponto my-8" />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {produtos.map((p, i) => (
              <Revelar como="li" key={p.slug} atraso={(i % 4) * 0.07}>
                <LencoArte padrao={p.padrao} cores={p.coresDesenho} titulo={`Desenho do ${p.nome}`} />
                <h3 className="mt-3 text-[1.1rem]">{p.nome}</h3>
                <p className="text-[0.95rem] text-tinta/75">{p.resumo}</p>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      <section className="secao-escura trama py-14 md:py-20" aria-labelledby="botoes">
        <div className="conteudo">
          <p className="rotulo text-ouro">Botões e detalhes</p>
          <h2 id="botoes" className="mt-2">
            Do balcão para o WhatsApp
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="botao-acao">
              Pôr na lista
            </button>
            <BotaoWhatsApp texto={MENSAGEM_GERAL} origem="vitrine" />
            <button type="button" className="botao-contorno">
              Ver detalhes
            </button>
            <BotaoWhatsApp texto={MENSAGEM_GERAL} origem="vitrine" variante="compacto">
              WhatsApp
            </BotaoWhatsApp>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {["Lenço maragato", "Lenço chimango", "Lenço farroupilha"].map((t) => (
              <Revelar key={t} className="costura rounded-[var(--raio-grande)] bg-couro-2 p-7">
                <p className="rotulo text-ouro">Exemplo de cartão</p>
                <h3 className="mt-2">{t}</h3>
                <p className="mt-2 text-creme-2">Valor pelo WhatsApp</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      <section className="secao-clara trama py-14 md:py-20" aria-labelledby="seletor">
        <div className="conteudo">
          <p className="rotulo text-ouro-escuro">Seletor de opções</p>
          <h2 id="seletor" className="mb-10 mt-2">
            Escolha as cores
          </h2>
          <DemoSeletor slug="lenco-carijo-duas-cores" />
          <div className="mt-14 flex items-center gap-6">
            <Selo tom="claro" className="w-28" />
            <p className="max-w-md text-tinta/80">Selo da trama, versão para fundo claro.</p>
          </div>
        </div>
      </section>
    </>
  );
}
