"use client";

/*
 * BarraCelular: barra fixa no rodapé da tela, só no celular (md:hidden).
 * Dois botões lado a lado: "Seu pedido (n)" -> /pedido/ e "WhatsApp" com a
 * mensagem geral. Respeita a área segura do iPhone (safe-area-inset-bottom).
 * Some na página /pedido/, que tem o próprio botão grande.
 * Inclui um espaçador no fluxo da página para o rodapé não ficar escondido.
 * Sem props: é renderizado uma vez em app/layout.tsx.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { totalDePecas, usePedido } from "../lib/pedido";
import BotaoWhatsApp from "./BotaoWhatsApp";
import { IconeLista } from "./Cabecalho";
import { MENSAGEM_GERAL, normalizarCaminho } from "./navegacao";

export default function BarraCelular() {
  const caminho = normalizarCaminho(usePathname());
  const total = totalDePecas(usePedido());
  if (caminho === "/pedido") return null;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(var(--altura-barra-celular)+env(safe-area-inset-bottom))] bg-couro md:hidden" />
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ouro/30 bg-[color-mix(in_srgb,var(--couro)_94%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        data-barra-celular
      >
        <div className="grid h-[var(--altura-barra-celular)] grid-cols-2 items-center gap-2 px-3">
          <Link
            href="/pedido/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--raio)] border border-ouro/55 px-3 font-rotulo text-[1rem] font-semibold uppercase tracking-[0.08em] text-creme no-underline active:translate-y-px"
          >
            <IconeLista className="h-5 w-5 text-ouro" />
            <span>
              Seu pedido{" "}
              <span aria-hidden="true" className="tabular-nums">
                ({total})
              </span>
            </span>
            <span className="sr-only">{total === 1 ? ", 1 peça" : `, ${total} peças`}</span>
          </Link>
          <BotaoWhatsApp texto={MENSAGEM_GERAL} origem="barra-celular" variante="compacto" className="min-h-12 w-full">
            WhatsApp
          </BotaoWhatsApp>
        </div>
      </div>
    </>
  );
}
