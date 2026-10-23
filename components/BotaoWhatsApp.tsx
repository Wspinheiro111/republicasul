"use client";

/*
 * BotaoWhatsApp: o link que leva a conversa para o WhatsApp.
 * Todo link de WhatsApp do site passa por aqui: monta o href com linkWhatsApp(),
 * registra cliqueWhatsApp(origem, produto) e abre em nova aba.
 *
 *   <BotaoWhatsApp texto={mensagemProduto(item)} origem="produto" produto={produto.slug}>
 *     Pedir agora no WhatsApp
 *   </BotaoWhatsApp>
 *
 * Props
 * - texto: a mensagem pronta (string).
 * - origem: onde o clique aconteceu ("produto", "pedido", "barra-celular", "rodape", "lojistas"...).
 * - produto?: slug do produto, para a medição.
 * - numero?: número de destino (padrão: contato.whatsapp; para lojistas use numeroLojistas()).
 * - variante?: "cheio" (padrão, verde) | "contorno" | "compacto" (barras e espaços curtos).
 * - larguraTotal?: ocupa 100% da largura.
 * - className?: classes extras. children?: o rótulo (padrão "Chamar no WhatsApp").
 */

import type { ReactNode } from "react";
import { cliqueWhatsApp } from "../lib/analytics";
import { linkWhatsApp } from "../lib/whatsapp";

export type BotaoWhatsAppProps = {
  texto: string;
  origem: string;
  produto?: string;
  numero?: string;
  variante?: "cheio" | "contorno" | "compacto";
  larguraTotal?: boolean;
  className?: string;
  children?: ReactNode;
};

export function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {/* Balão de conversa com o fone dentro, desenhado à mão. */}
      <path
        d="M12 2.6a9.3 9.3 0 0 0-8.04 13.97L2.7 21.3l4.86-1.24A9.3 9.3 0 1 0 12 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 7.4c.25-.5.5-.52.78-.52h.64c.2 0 .46.04.66.5l.86 2.02c.08.2.1.42-.02.62l-.5.8a.6.6 0 0 0 .02.66c.62 1.02 1.54 1.94 2.7 2.56.22.12.46.1.62-.08l.72-.84c.18-.2.42-.26.66-.16l2 .94c.26.12.46.3.46.58v.5c0 .84-.66 1.66-1.54 1.86-.86.2-2.02.12-3.74-.72a10.4 10.4 0 0 1-4.58-4.5c-.78-1.56-.8-2.7-.54-3.22Z"
        fill="currentColor"
      />
    </svg>
  );
}

const estilos: Record<NonNullable<BotaoWhatsAppProps["variante"]>, string> = {
  cheio: "botao-whats",
  contorno: "botao-contorno",
  compacto: "botao-whats botao-pequeno",
};

export default function BotaoWhatsApp({
  texto,
  origem,
  produto,
  numero,
  variante = "cheio",
  larguraTotal = false,
  className,
  children = "Chamar no WhatsApp",
}: BotaoWhatsAppProps) {
  const href = numero === undefined ? linkWhatsApp(texto) : linkWhatsApp(texto, numero);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => cliqueWhatsApp(origem, produto)}
      className={`${estilos[variante]} ${larguraTotal ? "w-full" : ""} ${className ?? ""}`}
      data-origem={origem}
    >
      <IconeWhatsApp className={variante === "compacto" ? "h-5 w-5" : "h-[1.35rem] w-[1.35rem]"} />
      <span>{children}</span>
      <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
    </a>
  );
}
