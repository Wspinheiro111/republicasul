"use client";

/*
 * ListaPedido: a parte viva da página "Seu pedido".
 *
 *   <ListaPedido />
 *
 * - A lista vem do navegador (usePedido). No servidor e na hidratação sai um
 *   estado de carregamento neutro, do mesmo tamanho; depois de montar, o real.
 * - Cada item: miniatura nas cores escolhidas, nome com link para o produto,
 *   escolhas em texto, quantidade editável e "Remover" (com "Desfazer" por
 *   alguns segundos; o item volta ao mesmo lugar).
 * - Dados opcionais (nome, cidade, observação), prévia da mensagem ao vivo e
 *   o botão grande "Enviar pedido pelo WhatsApp" (mensagemPedido, origem "pedido").
 * - No celular, uma barra fixa "Enviar pedido (n peças)" (a BarraCelular some
 *   nesta página), para o envio não ficar só no fim da página.
 * - O que o cliente escreveu no "Conte o que procura" do pala (anotações de
 *   lib/pedido) já vem no campo Observação.
 * - Lista vazia: EstadoVazio.
 */

import Link from "next/link";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { produtoPorSlug } from "../../content/catalogo";
import { contato } from "../../content/site";
import {
  alterarQuantidade,
  esquecerObservacoes,
  lerItens,
  lerObservacoes,
  removerItem,
  totalDePecas,
  usePedido,
} from "../../lib/pedido";
import { mensagemPedido, type DadosCliente, type ItemPedido } from "../../lib/whatsapp";
import BotaoWhatsApp from "../BotaoWhatsApp";
import { pecas } from "../montador/combinacao";
import { IconeDesfazer } from "../montador/Icones";
import { useMontado } from "../movimento";
import CartaoItem from "./CartaoItem";
import EstadoVazio from "./EstadoVazio";
import { chaveDoItem, restaurarItem } from "./funcoes";

/** Quanto tempo o "Desfazer" fica na tela (o mouse por cima ou o foco nele seguram). */
export const TEMPO_DESFAZER = 9000;

const LIMITE_NOME = 80;
const LIMITE_OBSERVACAO = 500;

type Removido = { item: ItemPedido; indice: number; vez: number };

/**
 * Observação inicial a partir das anotações das peças que estão na lista
 * ("Pala: crioulo marrom; preto"). Anotações de peças que já saíram da
 * lista são esquecidas.
 */
function observacaoDasAnotacoes(itens: ItemPedido[]): string {
  const naLista = new Set(itens.map((i) => i.produto));
  const anotacoes = lerObservacoes();
  const linhas: string[] = [];
  for (const [slug, textos] of Object.entries(anotacoes)) {
    if (!naLista.has(slug)) {
      esquecerObservacoes(slug);
      continue;
    }
    const produto = produtoPorSlug(slug);
    if (produto && textos.length) linhas.push(`${produto.nome}: ${textos.join("; ")}`);
  }
  return linhas.join("\n");
}

/**
 * A prévia mostra cada linha da mensagem num bloco. As linhas que começam
 * com espaço (as do item) ficam recuadas por inteiro, também quando quebram.
 * O texto (textContent) continua igual ao da mensagem enviada: os espaços do
 * começo ficam num span escondido e as quebras de linha continuam no texto.
 */
function LinhasDaPrevia({ mensagem }: { mensagem: string }) {
  const linhas = mensagem.split("\n");
  return (
    <>
      {linhas.map((linha, i) => {
        const recuo = /^\s+/.exec(linha)?.[0] ?? "";
        return (
          <Fragment key={i}>
            <span className={`inline-block w-full align-top ${recuo ? "pl-[1.4em]" : ""}`}>
              {recuo && <span className="hidden">{recuo}</span>}
              {linha.slice(recuo.length)}
            </span>
            {i < linhas.length - 1 ? "\n" : null}
          </Fragment>
        );
      })}
    </>
  );
}

function Carregando() {
  return (
    <div aria-busy="true" className="grid min-h-[28rem] gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" data-testid="pedido-carregando">
      <p className="sr-only" role="status">
        Carregando a sua lista…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <div className="h-7 w-48 rounded-[var(--raio)] bg-tinta/[0.07]" />
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
            <div className="aspect-square rounded-[var(--raio)] bg-tinta/[0.07]" />
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="h-5 w-3/4 rounded-[var(--raio)] bg-tinta/[0.07]" />
              <div className="h-4 w-1/2 rounded-[var(--raio)] bg-tinta/[0.05]" />
              <div className="h-12 w-40 rounded-[var(--raio)] bg-tinta/[0.05]" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="hidden h-80 rounded-[var(--raio-grande)] bg-tinta/[0.05] lg:block" />
    </div>
  );
}

function AvisoRemovido({
  removido,
  botaoRef,
  aoDesfazer,
  aoSegurar,
  como: Elemento = "div",
}: {
  removido: Removido;
  botaoRef: React.Ref<HTMLButtonElement>;
  aoDesfazer: () => void;
  aoSegurar: (segurando: boolean) => void;
  como?: "div" | "li";
}) {
  const produto = produtoPorSlug(removido.item.produto);
  return (
    <Elemento
      className="my-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--raio)] border border-dashed border-tinta/35 bg-creme-2/80 px-4 py-2.5"
      onMouseEnter={() => aoSegurar(true)}
      // Tirar o mouse de cima não solta o relógio enquanto o foco do teclado está no aviso.
      onMouseLeave={(e) => {
        if (!e.currentTarget.contains(document.activeElement)) aoSegurar(false);
      }}
      onFocus={() => aoSegurar(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) aoSegurar(false);
      }}
      data-testid="aviso-removido"
    >
      <p className="m-0 text-[0.98rem]">
        <span className="font-semibold">{produto?.nome ?? "Item"}</span> saiu da lista.
      </p>
      <button
        ref={botaoRef}
        type="button"
        onClick={aoDesfazer}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--raio)] px-2 font-rotulo text-[1rem] font-semibold uppercase tracking-[0.08em] text-maragato-escuro underline decoration-dashed underline-offset-4 hover:decoration-solid"
      >
        <IconeDesfazer className="h-5 w-5" />
        Desfazer
      </button>
    </Elemento>
  );
}

export default function ListaPedido() {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const montado = useMontado();
  const itens = usePedido();
  const [cliente, setCliente] = useState<Required<DadosCliente>>({ nome: "", cidade: "", observacao: "" });
  const [removido, setRemovido] = useState<Removido | null>(null);
  const [segurando, setSegurando] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const [focarChave, setFocarChave] = useState<string | null>(null);

  const desfazerRef = useRef<HTMLButtonElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const temItens = itens.length > 0;

  // Ao abrir a página: o que o cliente anotou nas peças sem opções (o pala) entra na Observação.
  const observacaoPreenchida = useRef(false);
  useEffect(() => {
    if (!montado || observacaoPreenchida.current) return;
    observacaoPreenchida.current = true;
    const texto = observacaoDasAnotacoes(lerItens());
    if (texto) setCliente((c) => (c.observacao ? c : { ...c, observacao: texto }));
  }, [montado]);

  // O "Desfazer" some sozinho depois de alguns segundos (o mouse por cima segura).
  useEffect(() => {
    if (!removido || segurando) return;
    const relogio = window.setTimeout(() => {
      // Se o foco estava no aviso, ele vai para o título da lista em vez de se perder.
      if (desfazerRef.current && document.activeElement === desfazerRef.current) tituloRef.current?.focus({ preventScroll: true });
      setRemovido(null);
    }, TEMPO_DESFAZER);
    return () => window.clearTimeout(relogio);
  }, [removido, segurando]);

  // Depois de remover, o foco vai para o "Desfazer" (o botão Remover sumiu).
  const vezRemovido = removido?.vez;
  useEffect(() => {
    if (vezRemovido) desfazerRef.current?.focus();
  }, [vezRemovido]);

  // Depois de desfazer, o foco volta para o item restaurado.
  useEffect(() => {
    if (!focarChave) return;
    const linha = Array.from(listaRef.current?.querySelectorAll<HTMLElement>("[data-chave]") ?? []).find((el) => el.dataset.chave === focarChave);
    linha?.querySelector<HTMLElement>("a")?.focus();
    setFocarChave(null);
  }, [focarChave, itens]);

  if (!montado) return <Carregando />;

  const total = totalDePecas(itens);
  const mensagem = mensagemPedido(itens, cliente);

  const remover = (indice: number) => {
    const item = itens[indice];
    if (!item) return;
    removerItem(indice);
    setSegurando(false);
    setRemovido((anterior) => ({ item, indice, vez: (anterior?.vez ?? 0) + 1 }));
    setAnuncio(`${produtoPorSlug(item.produto)?.nome ?? "Item"} saiu da lista. Use Desfazer para trazer de volta.`);
  };

  const desfazer = () => {
    if (!removido) return;
    restaurarItem(removido.item, removido.indice);
    setFocarChave(chaveDoItem(removido.item));
    setAnuncio(`${produtoPorSlug(removido.item.produto)?.nome ?? "Item"} voltou para a lista.`);
    setRemovido(null);
    setSegurando(false);
  };

  const aviso = (como: "div" | "li") =>
    removido && (
      <AvisoRemovido key={`removido-${removido.vez}`} como={como} removido={removido} botaoRef={desfazerRef} aoDesfazer={desfazer} aoSegurar={setSegurando} />
    );

  // Uma só região de status para a página toda (continua a mesma quando a lista esvazia).
  const comStatus = (conteudo: ReactNode) => (
    <div className="min-h-[28rem]">
      <p role="status" className="sr-only">
        {anuncio}
      </p>
      {conteudo}
    </div>
  );

  if (!temItens) {
    return comStatus(
      <>
        {aviso("div")}
        <EstadoVazio tituloRef={tituloRef} />
      </>,
    );
  }

  // Linhas da lista, com o aviso de "Desfazer" no lugar do item removido.
  const linhas: ReactNode[] = [];
  const vistas = new Map<string, number>();
  itens.forEach((item, indice) => {
    if (removido && removido.indice === indice) linhas.push(aviso("li"));
    const chave = chaveDoItem(item);
    const repeticao = vistas.get(chave) ?? 0;
    vistas.set(chave, repeticao + 1);
    linhas.push(
      <CartaoItem
        key={repeticao ? `${chave}#${repeticao}` : chave}
        item={item}
        numero={indice + 1}
        chave={chave}
        aoMudarQuantidade={(n) => alterarQuantidade(indice, n)}
        aoRemover={() => remover(indice)}
      />,
    );
  });
  if (removido && removido.indice >= itens.length) linhas.push(aviso("li"));

  const idLista = `${base}-lista`;
  const idEnvio = `${base}-envio`;
  const idPrevia = `${base}-previa`;
  const campo =
    "block min-h-12 w-full rounded-[var(--raio)] border border-tinta/55 bg-white/70 px-3.5 py-2.5 text-[1rem] text-tinta placeholder:text-tinta/70 focus-visible:border-tinta";
  const rotulo = "rotulo mb-2 block text-ouro-escuro";
  const mudarCampo = (nome: keyof DadosCliente) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCliente((c) => ({ ...c, [nome]: e.target.value }));

  return comStatus(
    <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-x-16">
      <section aria-labelledby={idLista} className="min-w-0">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id={idLista} ref={tituloRef} tabIndex={-1} className="titulo-3 m-0 text-[1.6rem] sm:text-[1.85rem]">
            Peças na lista
          </h2>
          <p className="m-0 font-rotulo text-[1.05rem] font-semibold uppercase tracking-[0.08em] text-ouro-escuro" data-testid="total-pecas">
            {pecas(total)}
          </p>
        </div>
        <ul ref={listaRef} className="m-0 list-none p-0">
          {linhas}
        </ul>
        <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">
          <Link href="/catalogo/" className="inline-flex min-h-11 items-center font-semibold underline decoration-ouro-escuro decoration-dashed underline-offset-4">
            Escolher mais lenços
          </Link>
          <Link href="/montador/" className="inline-flex min-h-11 items-center font-semibold underline decoration-ouro-escuro decoration-dashed underline-offset-4">
            Montar outro lenço
          </Link>
        </div>
      </section>

      <section aria-labelledby={idEnvio} className="min-w-0">
        <h2 id={idEnvio} className="titulo-3 m-0 text-[1.6rem] sm:text-[1.85rem]">
          Enviar pelo WhatsApp
        </h2>

        <fieldset className="m-0 mt-5 flex min-w-0 flex-col gap-5 border-0 p-0">
          <legend className="mb-4 p-0 text-[0.98rem] text-tinta/80">Seus dados vão junto na mensagem. Todos são opcionais.</legend>
          <div>
            <label htmlFor={`${base}-nome`} className={rotulo}>
              Nome
            </label>
            <input
              id={`${base}-nome`}
              type="text"
              autoComplete="name"
              maxLength={LIMITE_NOME}
              value={cliente.nome}
              onChange={mudarCampo("nome")}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor={`${base}-cidade`} className={rotulo}>
              Cidade
            </label>
            <input
              id={`${base}-cidade`}
              type="text"
              autoComplete="address-level2"
              maxLength={LIMITE_NOME}
              value={cliente.cidade}
              onChange={mudarCampo("cidade")}
              placeholder="Ex.: Santa Maria/RS"
              className={campo}
            />
          </div>
          <div>
            <label htmlFor={`${base}-observacao`} className={rotulo}>
              Observação
            </label>
            <textarea
              id={`${base}-observacao`}
              autoComplete="off"
              rows={3}
              maxLength={LIMITE_OBSERVACAO}
              value={cliente.observacao}
              onChange={mudarCampo("observacao")}
              placeholder="Ex.: o tamanho da medida especial"
              className={`${campo} resize-y py-3`}
            />
          </div>
        </fieldset>

        <div className="mt-7">
          <p id={idPrevia} className={rotulo}>
            Prévia da mensagem
          </p>
          {/* A costura fica na moldura de fora, que não rola; o texto rola por dentro dela. */}
          <div className="costura rounded-[var(--raio-grande)] bg-creme-2 p-[10px]">
            <div role="region" aria-labelledby={idPrevia} tabIndex={0} className="max-h-[21rem] overflow-auto rounded-[var(--raio-pequeno)] px-3 py-2.5">
              <pre className="m-0 whitespace-pre-wrap break-words font-texto text-[0.98rem] leading-relaxed text-tinta" data-testid="previa-mensagem">
                <LinhasDaPrevia mensagem={mensagem} />
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <BotaoWhatsApp texto={mensagem} origem="pedido" larguraTotal className="min-h-14 text-[1.15rem]">
            Enviar pedido pelo WhatsApp
          </BotaoWhatsApp>
          <p className="mt-3 text-[0.98rem] text-tinta/80">
            {/* Sem o número da loja em content/site.ts, o link não chega à Republicasul: nada de prometer a resposta dela. */}
            {contato.whatsapp
              ? "O pedido não é cobrado aqui. A Republicasul responde com valor, prazo e entrega."
              : "O pedido não é cobrado aqui. Valor, prazo e entrega você combina na conversa."}
          </p>
        </div>
      </section>

      {/* Celular: a BarraCelular some nesta página; esta barra deixa o envio sempre à mão. */}
      {createPortal(
        <>
          <div aria-hidden="true" className="h-[calc(var(--altura-barra-celular)+env(safe-area-inset-bottom))] bg-couro md:hidden" />
          <div
            role="region"
            aria-label="Envio rápido do pedido"
            data-barra-celular
            className="fixed inset-x-0 bottom-0 z-40 border-t border-ouro/30 bg-[color-mix(in_srgb,var(--couro)_94%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
          >
            <div className="flex h-[var(--altura-barra-celular)] items-center px-3">
              <BotaoWhatsApp texto={mensagem} origem="pedido" variante="compacto" larguraTotal className="min-h-12">
                Enviar pedido ({pecas(total)})
              </BotaoWhatsApp>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>,
  );
}
