"use client";

/*
 * LinkWhatsApp: link de texto, discreto, para o WhatsApp (o BotaoWhatsApp é
 * sempre botão). Mesmas regras: linkWhatsApp(), cliqueWhatsApp(origem) e
 * nova aba com aviso para leitor de tela.
 *
 *   <LinkWhatsApp texto={MENSAGEM_GERAL} origem="inicio-heroi">Prefere conversar? Chame no WhatsApp</LinkWhatsApp>
 */

import type { ReactNode } from "react";
import { cliqueWhatsApp } from "../../lib/analytics";
import { linkWhatsApp } from "../../lib/whatsapp";
import { IconeWhatsApp } from "../BotaoWhatsApp";

export type LinkWhatsAppProps = {
  texto: string;
  origem: string;
  produto?: string;
  className?: string;
  children: ReactNode;
};

export default function LinkWhatsApp({ texto, origem, produto, className, children }: LinkWhatsAppProps) {
  return (
    <a
      href={linkWhatsApp(texto)}
      target="_blank"
      rel="noopener"
      onClick={() => cliqueWhatsApp(origem, produto)}
      data-origem={origem}
      className={`inline-flex min-h-11 items-center gap-2 underline decoration-current/40 underline-offset-[0.3em] transition-colors hover:decoration-current ${className ?? ""}`}
    >
      <IconeWhatsApp className="h-5 w-5 shrink-0" />
      <span>{children}</span>
      <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
    </a>
  );
}
