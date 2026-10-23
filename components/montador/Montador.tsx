"use client";

/*
 * Montador: "Monte o seu lenço". Tela dividida entre o palco (o lenço grande,
 * ao vivo) e o painel de escolhas em três passos.
 *
 *   <Montador topo={<><Trilha ... /><h1>Monte o seu lenço</h1>...</>} />
 *
 * - topo: trilha, h1 e texto de abertura, renderizados no servidor.
 * - Passo 1, modelo: cartões ligados aos produtos do catálogo.
 *   Passo 2, cores: SeletorOpcoes com as cores do produto (no tradicional
 *   liso, as cores dos lenços tradicionais; trocar a cor troca o produto).
 *   Passo 3, medida e quantidade.
 * - Ações: "Adicionar ao pedido" (lib/pedido), "Pedir agora no WhatsApp"
 *   (mensagemProduto, origem "montador") e "Copiar link desta combinação".
 * - A combinação vai para a URL (history.replaceState) e é lida dela ao
 *   abrir, só com ids que existem no catálogo (combinacao.ts).
 * - No celular o palco fica grudado no topo enquanto a pessoa escolhe; no
 *   computador ocupa a coluna da esquerda inteira.
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { adicionarItem, lerItens } from "../../lib/pedido";
import { descreverEscolhas, mensagemProduto } from "../../lib/whatsapp";
import BotaoWhatsApp from "../BotaoWhatsApp";
import { useReduzirMovimento } from "../movimento";
import Quantidade from "../Quantidade";
import SeletorOpcoes from "../SeletorOpcoes";
import CartoesModelo from "./CartoesModelo";
import {
  caminhoDaCombinacao,
  combinacaoDoModelo,
  combinacaoInicial,
  coresDaCombinacao,
  escolhasDoSeletor,
  hrefComCombinacao,
  itemDaCombinacao,
  juntarNomes,
  lerCombinacao,
  mesmasEscolhas,
  MODELOS,
  modeloPorId,
  mudarModelo,
  mudarOpcao,
  nomesDasCoresDoDesenho,
  opcoesDosPassos,
  pecas,
  produtoDaCombinacao,
  SEM_PRECO,
  textoPreco,
  tituloDoDesenho,
  type Combinacao,
  type Modelo,
} from "./combinacao";
import CopiarLink from "./CopiarLink";
import { IconeCheck, IconeMais } from "./Icones";
import estilos from "./Montador.module.css";
import PalcoLenco from "./PalcoLenco";

export type MontadorProps = {
  /** Trilha, h1 e abertura (servidor). */
  topo: ReactNode;
};

type Estado = {
  atual: Combinacao;
  /** Última combinação de cada modelo, para voltar a ela ao trocar de modelo. */
  memoria: Record<string, Combinacao>;
};

type Aviso = { vez: number; texto: string };

function trocarUrl(caminho: string) {
  try {
    const atual = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (caminho !== atual) window.history.replaceState(window.history.state, "", caminho);
  } catch {
    // Alguns navegadores limitam replaceState; a escolha continua valendo na tela.
  }
}

function estadoInicial(): Estado | null {
  const atual = combinacaoInicial();
  return atual ? { atual, memoria: { [atual.modelo]: atual } } : null;
}

function CabecaPasso({ numero, titulo, id }: { numero: number; titulo: string; id: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-ouro-escuro font-titulo text-[1.3rem] font-semibold text-ouro-escuro"
      >
        {numero}
      </span>
      <div>
        <p aria-hidden="true" className="rotulo text-ouro-escuro">
          Passo {numero}
        </p>
        <h2 id={id} className="titulo-3 mt-0.5 text-[1.5rem] sm:text-[1.65rem]">
          <span className="sr-only">Passo {numero}:</span> {titulo}
        </h2>
      </div>
    </div>
  );
}

export default function Montador({ topo }: MontadorProps) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduzir = useReduzirMovimento();
  const [estado, setEstado] = useState<Estado | null>(estadoInicial);
  const [quantidade, setQuantidade] = useState(1);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Ao abrir: a combinação que veio no link (só ids válidos) e a URL arrumada.
  useEffect(() => {
    const lida = lerCombinacao(window.location.search);
    if (!lida) return;
    setEstado((e) => ({ atual: lida, memoria: { ...(e?.memoria ?? {}), [lida.modelo]: lida } }));
    trocarUrl(hrefComCombinacao(lida, window.location.href));
  }, []);

  if (!estado) return null;
  const { atual, memoria } = estado;
  const produto = produtoDaCombinacao(atual);
  const modelo = modeloPorId(atual.modelo);
  if (!produto || !modelo) return null;

  const atualizar = (proxima: Combinacao) => {
    setEstado((e) => (e ? { atual: proxima, memoria: { ...e.memoria, [proxima.modelo]: proxima } } : e));
    setAviso(null);
    trocarUrl(hrefComCombinacao(proxima, window.location.href));
  };

  const { cores: opcoesCor, medidas } = opcoesDosPassos(atual);
  const item = itemDaCombinacao(atual, quantidade);
  const coresLenco = coresDaCombinacao(atual);
  const titulo = tituloDoDesenho(atual);
  const descricao = descreverEscolhas(produto, atual.escolhas);
  const temPreco = textoPreco(produto.preco) !== SEM_PRECO;

  // Miniatura de cada cartão: as cores que a pessoa já escolheu naquele modelo.
  const desenhoDe = (m: Modelo) => {
    const combinacao = m.id === atual.modelo ? atual : (memoria[m.id] ?? combinacaoDoModelo(m.id));
    const p = combinacao ? produtoDaCombinacao(combinacao) : undefined;
    return { padrao: p?.padrao ?? m.produtos[0].padrao, cores: combinacao ? coresDaCombinacao(combinacao) : m.produtos[0].coresDesenho };
  };

  const adicionar = () => {
    adicionarItem(item);
    const noPedido =
      lerItens().find((i) => i.produto === item.produto && mesmasEscolhas(i.escolhas, item.escolhas))?.quantidade ?? quantidade;
    const texto =
      noPedido > quantidade
        ? `Agora são ${pecas(noPedido)} desta combinação no pedido.`
        : `${pecas(quantidade)} de ${produto.nome}${descricao ? ` (${descricao})` : ""}.`;
    setAviso((anterior) => ({ vez: (anterior?.vez ?? 0) + 1, texto }));
  };

  const idPasso = (n: number) => `${base}-passo-${n}`;
  const nomesCoresFixas = nomesDasCoresDoDesenho(produto);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      {/* Abertura: no celular vem antes do palco; no computador, no alto da coluna da direita. */}
      <div className="secao-clara lg:col-start-2 lg:row-start-1">
        <div className="mx-auto max-w-[40rem] px-4 pb-7 pt-6 sm:px-6 lg:px-12 lg:pb-4 lg:pt-10">{topo}</div>
      </div>

      {/* Palco: grudado no topo no celular; coluna inteira (com o conteúdo grudado) no computador. */}
      <section
        aria-label="Prévia do lenço"
        className={`secao-escura ${estilos.palco} sticky top-[var(--altura-cabecalho)] z-30 border-b border-ouro/30 lg:static lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:border-b-0`}
      >
        <div className="lg:sticky lg:top-[var(--altura-cabecalho)] lg:h-[calc(100dvh-var(--altura-cabecalho))] lg:min-h-[34rem]">
          <PalcoLenco produto={produto} escolhas={atual.escolhas} cores={coresLenco} titulo={titulo} quantidade={quantidade} />
        </div>
      </section>

      {/* Painel de escolhas */}
      <div className={`secao-clara ${estilos.painel} lg:col-start-2 lg:row-start-2`}>
        <div className="mx-auto max-w-[40rem] px-4 pb-14 pt-8 sm:px-6 lg:px-12 lg:pb-20 lg:pt-6">
          <section aria-labelledby={idPasso(1)}>
            <CabecaPasso numero={1} titulo="Modelo" id={idPasso(1)} />
            <CartoesModelo
              modelos={MODELOS}
              escolhido={atual.modelo}
              aoEscolher={(id) => atualizar(mudarModelo(atual, memoria, id))}
              desenhoDe={desenhoDe}
              idTitulo={idPasso(1)}
            />
          </section>

          <hr className="linha-de-ponto my-9" />

          <section aria-labelledby={idPasso(2)}>
            <CabecaPasso numero={2} titulo="Cores" id={idPasso(2)} />
            <div className="mt-5">
              {opcoesCor.length > 0 ? (
                <SeletorOpcoes
                  opcoes={opcoesCor}
                  escolhas={escolhasDoSeletor(atual)}
                  aoMudar={(opcaoId, valorId) => atualizar(mudarOpcao(atual, opcaoId, valorId))}
                />
              ) : (
                <div className="flex flex-col gap-3" data-testid="cores-fixas">
                  {produto.padrao !== "pala" && nomesCoresFixas.length > 0 && (
                    <ul className="m-0 flex list-none flex-wrap gap-3 p-0" aria-label="Cores deste lenço">
                      {produto.coresDesenho.map((hex, i) => (
                        <li key={`${hex}-${i}`} className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="block h-8 w-8 rounded-full border border-black/20 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.18)]"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="font-medium">{nomesCoresFixas[i]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="m-0 max-w-md text-tinta/80">
                    {produto.padrao === "farroupilha"
                      ? `As cores são as da bandeira do Rio Grande do Sul: ${juntarNomes(nomesCoresFixas, "e").toLowerCase()}.`
                      : produto.padrao === "pala"
                        ? "Modelo e cor do pala você combina na conversa pelo WhatsApp. O desenho é só uma ideia."
                        : "As cores deste modelo já vêm definidas."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <hr className="linha-de-ponto my-9" />

          <section aria-labelledby={idPasso(3)}>
            <CabecaPasso numero={3} titulo={medidas.length > 0 ? "Medida e quantidade" : "Quantidade"} id={idPasso(3)} />
            <div className="mt-5 flex flex-col gap-6">
              {medidas.length > 0 && (
                <SeletorOpcoes
                  opcoes={medidas}
                  escolhas={atual.escolhas}
                  aoMudar={(opcaoId, valorId) => atualizar(mudarOpcao(atual, opcaoId, valorId))}
                />
              )}
              <Quantidade
                valor={quantidade}
                aoMudar={(n) => {
                  setQuantidade(n);
                  setAviso(null);
                }}
              />
            </div>
          </section>

          <hr className="linha-de-ponto my-9" />

          <section aria-labelledby={`${base}-acoes`} className="costura rounded-[var(--raio-grande)] bg-creme-2 p-5 sm:p-7">
            <h2 id={`${base}-acoes`} className="sr-only">
              Levar esta combinação
            </h2>
            <p className="rotulo text-ouro-escuro">Valor</p>
            <p className="mt-1 font-titulo text-[1.5rem] font-semibold leading-tight" data-testid="preco-montador">
              {textoPreco(produto.preco)}
            </p>
            <p className="mt-1.5 text-[0.98rem] text-tinta/80">
              {temPreco ? "Prazo e entrega você combina pelo WhatsApp." : "A Republicasul responde com valor, prazo e entrega."}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button type="button" onClick={adicionar} className="botao-acao w-full">
                {aviso ? <IconeCheck className="h-5 w-5" /> : <IconeMais className="h-5 w-5" />}
                <span>Adicionar ao pedido</span>
              </button>
              <BotaoWhatsApp texto={mensagemProduto(item)} origem="montador" produto={produto.slug} larguraTotal>
                Pedir agora no WhatsApp
              </BotaoWhatsApp>
              <CopiarLink caminho={caminhoDaCombinacao(atual)} className="mt-1" />
            </div>

            <div role="status" className="mt-1">
              {aviso && (
                <motion.div
                  key={aviso.vez}
                  initial={reduzir ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 rounded-[var(--raio)] border border-campo/40 bg-campo/10 px-4 py-3 text-[0.98rem]"
                >
                  <p className="m-0 font-semibold">Adicionado ao seu pedido.</p>
                  <p className="m-0 mt-1">{aviso.texto}</p>
                  <Link
                    href="/pedido/"
                    className="mt-1 inline-flex min-h-11 items-center font-semibold underline decoration-ouro-escuro decoration-dashed underline-offset-4"
                  >
                    Ver seu pedido
                  </Link>
                </motion.div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
