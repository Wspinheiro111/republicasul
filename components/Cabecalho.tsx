"use client";

/*
 * Cabecalho: barra do topo, fixa (sticky). Couro sólido no início da página,
 * couro translúcido com desfoque ao rolar.
 * - Marca (link para o início), navegação principal (a partir de lg),
 *   botão "Seu pedido" com o total de peças (usePedido + totalDePecas, aria-live).
 * - Abaixo de lg: botão de menu (aria-expanded/aria-controls) que abre um painel
 *   com os links grandes e o WhatsApp. Fecha com Esc, ao navegar (também pela
 *   marca e pelo "Seu pedido" do topo) e quando a tela passa de lg (o tablet
 *   que gira), e trava a rolagem enquanto aberto. Girando abaixo de lg, o
 *   painel acompanha a nova altura do cabeçalho. O Tab roda só entre o botão
 *   do menu e o painel, nos dois sentidos.
 * - O link da rota atual recebe aria-current="page" (usePathname). No painel
 *   do celular ele também ganha um sublinhado tracejado (não só a cor).
 * - Menu aberto: o resto da página (main, rodapé, barra do celular, faixa de
 *   prévia e "Pular para o conteúdo") fica inert, para o leitor de tela não
 *   sair do painel para o conteúdo escondido.
 * - O contador anuncia o total só quando ele muda depois de a página abrir
 *   (não a cada página carregada), e não em /pedido/, que tem o próprio aviso.
 * Sem props: é renderizado uma vez em app/layout.tsx.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { lerItens, totalDePecas, usePedido } from "../lib/pedido";
import BotaoWhatsApp from "./BotaoWhatsApp";
import Marca from "./Marca";
import { itemAtivo, MENSAGEM_GERAL, navegacao, normalizarCaminho } from "./navegacao";

/** A partir daqui (lg do Tailwind) o menu do celular some e a navegação fica no topo. */
const TELA_GRANDE = "(min-width: 64rem)";

/** O que fica inert enquanto o menu do celular está aberto (vem do app/layout.tsx). */
const FORA_DO_MENU = "main, body footer, [data-barra-celular], [data-faixa-previa], .pular-conteudo";

export function IconeLista({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v15.5l-3-1.8-3 1.8-3-1.8-3 1.8-3-1.8V5A1.5 1.5 0 0 1 6 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function Cabecalho() {
  const caminho = usePathname();
  const itens = usePedido();
  const total = totalDePecas(itens);
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [topoPainel, setTopoPainel] = useState(0);
  const cabecalhoRef = useRef<HTMLElement>(null);
  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const naPaginaPedido = normalizarCaminho(caminho) === "/pedido";

  // Anúncio do contador: só quando o total muda depois da primeira leitura do
  // navegador. A troca de 0 para o total salvo, que acontece na hidratação,
  // não é anunciada (lerItens já traz o total salvo).
  const totalAnterior = useRef<number | null>(null);
  const [anuncio, setAnuncio] = useState("");
  useEffect(() => {
    if (totalAnterior.current === null) {
      totalAnterior.current = totalDePecas(lerItens());
      return;
    }
    if (total === totalAnterior.current) return;
    totalAnterior.current = total;
    if (naPaginaPedido) return;
    setAnuncio(total > 0 ? `Seu pedido tem ${total === 1 ? "1 peça" : `${total} peças`}.` : "");
  }, [total, naPaginaPedido]);

  // Fundo translúcido depois de rolar um pouco.
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 12);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Fecha o menu ao trocar de página.
  useEffect(() => {
    setAberto(false);
  }, [caminho]);

  // Menu aberto: trava a rolagem, Esc fecha, foco entra no painel.
  useEffect(() => {
    if (!aberto) return;
    const raiz = document.documentElement;
    const antes = raiz.style.overflow;
    raiz.style.overflow = "hidden";
    // O painel escondido guarda a rolagem da última vez: volta ao topo, para o primeiro link aparecer.
    if (painelRef.current) painelRef.current.scrollTop = 0;
    painelRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    // O resto da página sai do alcance do teclado e do leitor de tela.
    const foraDoMenu = Array.from(document.querySelectorAll<HTMLElement>(FORA_DO_MENU)).filter((el) => !el.inert);
    foraDoMenu.forEach((el) => {
      el.inert = true;
    });
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoMenuRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", aoTeclar);
    // A tela passou de lg com o menu aberto (tablet girado): o painel e o botão
    // somem, então o menu fecha e a página volta a rolar.
    const telaGrande = window.matchMedia?.(TELA_GRANDE);
    const aoMudarTela = (e: MediaQueryListEvent) => {
      if (e.matches) setAberto(false);
    };
    telaGrande?.addEventListener?.("change", aoMudarTela);
    // Abaixo de lg, girar o celular muda a altura do cabeçalho (e da faixa de prévia): o painel acompanha.
    const aoRedimensionar = () => setTopoPainel(cabecalhoRef.current?.getBoundingClientRect().bottom ?? 0);
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      raiz.style.overflow = antes;
      foraDoMenu.forEach((el) => {
        el.inert = false;
      });
      document.removeEventListener("keydown", aoTeclar);
      telaGrande?.removeEventListener?.("change", aoMudarTela);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [aberto]);

  const alternarMenu = () => {
    if (!aberto) setTopoPainel(cabecalhoRef.current?.getBoundingClientRect().bottom ?? 0);
    setAberto((a) => !a);
  };

  // Tab no último item do painel volta para o botão do menu; Shift+Tab no
  // botão (com o menu aberto) vai para o último item. Do botão, o Tab entra
  // no primeiro item e o Shift+Tab no primeiro item volta ao botão sozinhos
  // (o painel vem logo depois do cabeçalho), então o foco não sai do menu.
  const prenderFoco = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    const focaveis = painelRef.current?.querySelectorAll<HTMLElement>("a, button");
    if (!focaveis?.length) return;
    if (document.activeElement === focaveis[focaveis.length - 1]) {
      e.preventDefault();
      botaoMenuRef.current?.focus({ preventScroll: true });
    }
  };
  const voltarAoFimDoPainel = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!aberto || e.key !== "Tab" || !e.shiftKey) return;
    const focaveis = painelRef.current?.querySelectorAll<HTMLElement>("a, button");
    if (!focaveis?.length) return;
    e.preventDefault();
    // Sem preventScroll: em tela baixa o painel rola até o item (a página não se move, o painel é fixo).
    focaveis[focaveis.length - 1].focus();
  };

  return (
    <>
      <header
        ref={cabecalhoRef}
        data-rolou={rolou ? "sim" : "nao"}
        className={`sticky top-0 z-50 text-creme transition-[background-color,box-shadow] duration-300 ${
          rolou && !aberto
            ? "bg-[color-mix(in_srgb,var(--couro)_88%,transparent)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md"
            : "bg-couro"
        }`}
      >
        <div className="conteudo flex h-[var(--altura-cabecalho)] items-center justify-between gap-3">
          <Link href="/" onClick={() => setAberto(false)} className="-ml-1 min-w-0 rounded-[var(--raio)] px-1 py-1 no-underline" aria-label="Republicasul, página inicial">
            <Marca />
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navegacao.map((item) => {
                const ativo = itemAtivo(item, caminho);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={ativo ? "page" : undefined}
                      className={`group relative inline-flex min-h-11 items-center px-3 font-rotulo text-[0.95rem] font-semibold uppercase tracking-[0.1em] no-underline transition-colors ${
                        ativo ? "text-ouro" : "text-creme-2 hover:text-creme"
                      }`}
                    >
                      {item.nome}
                      <span
                        aria-hidden="true"
                        className={`linha-de-ponto absolute inset-x-3 bottom-1.5 w-auto! transition-opacity ${ativo ? "opacity-90" : "opacity-0 group-hover:opacity-50"}`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/pedido/"
              onClick={() => setAberto(false)}
              aria-current={caminho?.replace(/\/+$/, "") === "/pedido" ? "page" : undefined}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--raio)] border border-ouro/55 px-2.5 font-rotulo text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-creme no-underline transition-colors hover:border-ouro hover:bg-white/5 sm:px-3"
            >
              <IconeLista className="h-5 w-5 text-ouro" />
              {/* No celular fica só o ícone e o número; o texto vai para o leitor de tela. */}
              <span className="sr-only sm:not-sr-only">Seu pedido</span>
              <span
                aria-hidden="true"
                data-testid="contador-pedido"
                className={`inline-flex h-6 min-w-6 items-center justify-center rounded-[var(--raio-pequeno)] px-1.5 font-texto text-[0.8rem] font-semibold tabular-nums tracking-normal ${
                  total > 0 ? "bg-maragato text-white" : "bg-white/10 text-creme-2"
                }`}
              >
                {total}
              </span>
              <span className="sr-only">, {total === 1 ? "1 peça" : `${total} peças`}</span>
            </Link>

            <button
              ref={botaoMenuRef}
              type="button"
              onClick={alternarMenu}
              onKeyDown={voltarAoFimDoPainel}
              aria-expanded={aberto}
              aria-controls="menu-celular"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--raio)] border border-creme/20 text-creme transition-colors hover:bg-white/5 lg:hidden"
            >
              <span className="sr-only">{aberto ? "Fechar menu" : "Abrir menu"}</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                {aberto ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
        <div aria-hidden="true" className={`linha-de-ponto absolute inset-x-0 bottom-0 transition-opacity duration-300 ${rolou && !aberto ? "opacity-40" : "opacity-0!"}`} />
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>
      </header>

      <div
        id="menu-celular"
        ref={painelRef}
        hidden={!aberto}
        onKeyDown={prenderFoco}
        style={{ top: topoPainel }}
        className="secao-escura trama fixed inset-x-0 bottom-0 z-50 overflow-y-auto overscroll-contain lg:hidden"
      >
        <nav aria-label="Menu" className="conteudo flex min-h-full flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
          <ul className="flex flex-col">
            {[{ nome: "Início", href: "/", ativo: [] as string[] }, ...navegacao].map((item) => {
              const ativo = item.href === "/" ? caminho === "/" : itemAtivo(item, caminho);
              return (
                <li key={item.href} className="border-b border-dashed border-ouro/25">
                  <Link
                    href={item.href}
                    onClick={() => setAberto(false)}
                    aria-current={ativo ? "page" : undefined}
                    className={`flex min-h-14 items-center justify-between py-3 font-titulo text-[1.6rem] font-semibold no-underline ${ativo ? "text-ouro" : "text-creme"}`}
                  >
                    {/* A página atual também se marca sem depender da cor: sublinhado tracejado. */}
                    <span className={ativo ? "underline decoration-dashed decoration-2 underline-offset-[0.3em]" : undefined}>{item.nome}</span>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-ouro" aria-hidden="true">
                      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto pt-8">
            <p className="rotulo mb-3 text-ouro">A venda fecha no WhatsApp</p>
            <BotaoWhatsApp texto={MENSAGEM_GERAL} origem="menu" larguraTotal>
              Chamar no WhatsApp
            </BotaoWhatsApp>
          </div>
        </nav>
      </div>
    </>
  );
}
