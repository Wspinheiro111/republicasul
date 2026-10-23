"use client";

/*
 * PainelProduto: a parte viva da página do produto.
 *
 *   <PainelProduto produto={produto} topo={<><Trilha ... /><h1>...</h1></>} />
 *
 * Duas colunas (empilha no celular, com o topo antes do desenho):
 * - visual: o desenho do lenço que muda AO VIVO com as escolhas
 *   (coresDasEscolhas), ou a galeria quando houver foto real.
 * - topo (vem pronto do servidor: trilha, h1, resumo) e as ações:
 *   SeletorOpcoes, Quantidade, observação, "Você escolheu: ...",
 *   "Adicionar ao pedido", "Pedir agora no WhatsApp", "Quero ajuda para escolher".
 *
 * As escolhas vão para a URL (?cor-1=azul&medida=especial) com
 * history.replaceState, e são lidas da URL ao abrir: dá para mandar o link de
 * uma combinação. Só ids que existem no produto são aceitos.
 */

import { motion, useAnimationControls } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { coresDasEscolhas, escolhasPadrao, type Produto } from "../../content/catalogo";
import { adicionarItem, lerItens } from "../../lib/pedido";
import { descreverEscolhas, type ItemPedido } from "../../lib/whatsapp";
import BotaoWhatsApp from "../BotaoWhatsApp";
import LencoArte from "../LencoArte";
import { useMontado, useReduzirMovimento } from "../movimento";
import Quantidade from "../Quantidade";
import SeletorOpcoes from "../SeletorOpcoes";
import Selo from "../Selo";
import { IconeCheck, IconeMais } from "./CartaoProduto";
import {
  caminhoComEscolhas,
  lerEscolhasDaUrl,
  mensagemAjudaProduto,
  mensagemPedidoDireto,
  mesmasEscolhas,
  pecas,
  textoPreco,
  tituloDoDesenho,
  urlTemEscolhas,
} from "./funcoes";
import GaleriaFotos from "./GaleriaFotos";

export type PainelProdutoProps = {
  produto: Produto;
  /** Trilha, h1 e resumo, renderizados no servidor. */
  topo: ReactNode;
};

const LIMITE_OBSERVACAO = 400;

type Aviso = { vez: number; texto: string; noPedido: number; comObservacao: boolean };

function trocarUrl(caminho: string) {
  try {
    window.history.replaceState(null, "", caminho);
  } catch {
    // Alguns navegadores limitam replaceState; a escolha continua valendo na tela.
  }
}

export default function PainelProduto({ produto, topo }: PainelProdutoProps) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const temOpcoes = produto.opcoes.length > 0;
  const temCor = produto.opcoes.some((o) => o.tipo === "cor");
  const [escolhas, setEscolhas] = useState<Record<string, string>>(() => escolhasPadrao(produto));
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Ao abrir: escolhas que vieram no link (só ids válidos) e URL limpa.
  useEffect(() => {
    if (!temOpcoes) return;
    const busca = window.location.search;
    if (!urlTemEscolhas(produto, busca)) return;
    const daUrl = lerEscolhasDaUrl(produto, busca);
    setEscolhas((atuais) => (mesmasEscolhas(atuais, daUrl) ? atuais : daUrl));
    const limpo = caminhoComEscolhas(produto, daUrl, window.location.href);
    if (limpo !== `${window.location.pathname}${window.location.search}${window.location.hash}`) trocarUrl(limpo);
  }, [produto, temOpcoes]);

  const mudarOpcao = (opcaoId: string, valorId: string) => {
    const novas = { ...escolhas, [opcaoId]: valorId };
    setEscolhas(novas);
    setAviso(null);
    trocarUrl(caminhoComEscolhas(produto, novas, window.location.href));
  };

  const item: ItemPedido = { produto: produto.slug, escolhas, quantidade };
  const descricaoEscolha = descreverEscolhas(produto, escolhas);
  const cores = coresDasEscolhas(produto, escolhas);
  const titulo = tituloDoDesenho(produto, escolhas);
  const temFoto = produto.fotos.length > 0;

  const adicionar = () => {
    adicionarItem(item);
    const noPedido =
      lerItens().find((i) => i.produto === produto.slug && mesmasEscolhas(i.escolhas, escolhas))?.quantidade ?? quantidade;
    setAviso((anterior) => ({
      vez: (anterior?.vez ?? 0) + 1,
      texto: `${pecas(quantidade)} de ${produto.nome} no seu pedido${descricaoEscolha ? ` (${descricaoEscolha})` : ""}.`,
      noPedido,
      comObservacao: observacao.trim().length > 0,
    }));
  };

  // Um balanço curto quando a cor muda (não no primeiro desenho).
  const reduzir = useReduzirMovimento();
  const montado = useMontado();
  const controles = useAnimationControls();
  const chaveCores = cores.join(",");
  const primeiraCor = useRef(chaveCores);
  useEffect(() => {
    if (!montado || reduzir || chaveCores === primeiraCor.current) return;
    primeiraCor.current = chaveCores;
    void controles.start({ rotate: [0, -2.2, 1.4, -0.5, 0], y: [0, 4, 0, 1, 0], transition: { duration: 0.9, ease: "easeOut" } });
  }, [chaveCores, montado, reduzir, controles]);

  const desenho = <LencoArte padrao={produto.padrao} cores={cores} titulo={titulo} />;

  const idObservacao = `${base}-observacao`;
  const idAjudaObservacao = `${base}-observacao-ajuda`;

  return (
    <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] xl:gap-x-16">
      {/* Topo: no celular vem antes do desenho; no computador, na coluna da direita. */}
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">{topo}</div>

      {/* Visual */}
      <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <div className="lg:sticky lg:top-[calc(var(--altura-cabecalho)+1.5rem)]">
          {temFoto ? (
            <GaleriaFotos
              fotos={produto.fotos}
              nome={produto.nome}
              reserva={
                <div className="secao-escura trama relative overflow-hidden rounded-[var(--raio-grande)] p-[9%]">{desenho}</div>
              }
            />
          ) : (
            <figure className="m-0">
              <div className="secao-escura trama relative mx-auto max-w-[34rem] overflow-hidden rounded-[var(--raio-grande)] px-[8%] pb-[6%] pt-[2%] lg:max-w-none">
                <div aria-hidden="true" className="pointer-events-none absolute inset-[8px] rounded-[var(--raio)] border border-dashed border-ouro/40" />
                {/* O alto do desenho é vazio (a metade de cima tomba para trás): sobe um pouco. */}
                <motion.div animate={controles} style={{ originX: 0.5, originY: 0 }} className="-mt-[10%]" data-testid="desenho-ao-vivo">
                  {desenho}
                </motion.div>
                <div className="absolute bottom-3 right-3 w-14 sm:bottom-5 sm:right-5 sm:w-20">
                  <Selo className="w-full" />
                </div>
              </div>
              <figcaption className="mx-auto mt-3 max-w-[34rem] text-[0.92rem] text-tinta/75 lg:max-w-none">
                {temCor ? "Ilustração da peça. As cores acompanham a sua escolha." : "Ilustração da peça."}
              </figcaption>
            </figure>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex min-w-0 flex-col gap-7 lg:col-start-2 lg:row-start-2">
        <div>
          <p className="rotulo text-ouro-escuro">Valor</p>
          <p className="mt-1 font-titulo text-[1.6rem] font-semibold leading-tight" data-testid="preco">
            {textoPreco(produto.preco)}
          </p>
        </div>

        <hr className="linha-de-ponto" />

        {temOpcoes && <SeletorOpcoes opcoes={produto.opcoes} escolhas={escolhas} aoMudar={mudarOpcao} />}

        <Quantidade
          valor={quantidade}
          aoMudar={(n) => {
            setQuantidade(n);
            setAviso(null);
          }}
        />

        <div>
          <label htmlFor={idObservacao} className="rotulo mb-2 block text-ouro-escuro">
            {temOpcoes ? "Observação (opcional)" : "Conte o que procura"}
          </label>
          <textarea
            id={idObservacao}
            value={observacao}
            maxLength={LIMITE_OBSERVACAO}
            rows={3}
            onChange={(e) => setObservacao(e.target.value)}
            aria-describedby={idAjudaObservacao}
            placeholder={temOpcoes ? "Ex.: o tamanho da medida especial" : "Ex.: o modelo e a cor do pala"}
            className="block w-full resize-y rounded-[var(--raio)] border border-tinta/30 bg-white/60 px-3.5 py-3 text-[1rem] text-tinta placeholder:text-tinta/55 focus-visible:border-tinta"
          />
          <p id={idAjudaObservacao} className="mt-2 text-[0.92rem] text-tinta/75">
            Vai junto na mensagem quando você toca em Pedir agora no WhatsApp.
          </p>
        </div>

        {/* Resumo da escolha, com o desenho em miniatura (útil no celular). */}
        <div className="flex items-center gap-4 rounded-[var(--raio)] border border-tinta/15 bg-creme-2/70 p-4">
          {!temFoto && (
            <div aria-hidden="true" className="w-16 shrink-0 sm:w-20">
              <LencoArte padrao={produto.padrao} cores={cores} titulo={titulo} mostrarFranja={false} />
            </div>
          )}
          <p className="m-0 text-[1rem] leading-snug" aria-live="polite" aria-atomic="true" data-testid="resumo-escolha">
            <span className="rotulo block text-ouro-escuro">Você escolheu</span>
            <span className="mt-1 block font-semibold">{produto.nome}</span>
            {descricaoEscolha &&
              descricaoEscolha.split(" · ").map((parte) => (
                <span key={parte} className="block">
                  {parte}
                </span>
              ))}
            <span className="block">Quantidade: {quantidade}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <button type="button" onClick={adicionar} className="botao-acao w-full">
              {aviso ? <IconeCheck className="h-5 w-5" /> : <IconeMais className="h-5 w-5" />}
              <span>Adicionar ao pedido</span>
            </button>
            <BotaoWhatsApp texto={mensagemPedidoDireto(item, observacao)} origem="produto" produto={produto.slug} larguraTotal>
              Pedir agora no WhatsApp
            </BotaoWhatsApp>
          </div>

          <div role="status">
            {aviso && (
              <div key={aviso.vez} className="rounded-[var(--raio)] border border-campo/40 bg-campo/10 px-4 py-3 text-[0.98rem]">
                <p className="m-0 font-semibold">Adicionado ao seu pedido.</p>
                <p className="m-0 mt-1">
                  {aviso.noPedido > quantidade ? `Agora são ${pecas(aviso.noPedido)} desta escolha no pedido.` : aviso.texto}
                </p>
                {aviso.comObservacao && (
                  <p className="m-0 mt-1 text-tinta/80">A observação não fica na lista: repita quando mandar o pedido.</p>
                )}
                <Link
                  href="/pedido/"
                  className="mt-1 inline-flex min-h-11 items-center font-semibold underline decoration-ouro-escuro decoration-dashed underline-offset-4"
                >
                  Ver seu pedido
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-tinta/15 pt-5">
          <p className="m-0 mb-3 text-[0.98rem] text-tinta/80">Ficou na dúvida na hora de escolher?</p>
          <BotaoWhatsApp texto={mensagemAjudaProduto(produto)} origem="produto-ajuda" produto={produto.slug} variante="contorno">
            Quero ajuda para escolher
          </BotaoWhatsApp>
        </div>
      </div>
    </div>
  );
}
