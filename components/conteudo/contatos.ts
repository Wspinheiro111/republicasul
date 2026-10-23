// Contatos e redes que podem aparecer para o público: só os preenchidos em
// content/site.ts. Campo vazio = ainda não confirmado com o dono = escondido.

import { contato as contatoSite, links as linksSite } from "../../content/site";

export type ItemContato = { rotulo: string; valor: string; href?: string };
export type Rede = { nome: string; href: string };

/** "5551999999999" -> "+55 51 99999-9999". Sem DDI/DDD reconhecível, devolve como veio. */
export function formatarTelefone(numero: string): string {
  const d = numero.replace(/\D/g, "");
  const m = /^(55)?(\d{2})(\d{4,5})(\d{4})$/.exec(d);
  if (!m) return numero.trim();
  const [, ddi, ddd, parte1, parte2] = m;
  return `${ddi ? "+55 " : ""}${ddd} ${parte1}-${parte2}`;
}

export function contatosConfirmados(contato: typeof contatoSite = contatoSite): ItemContato[] {
  const itens: (ItemContato | false)[] = [
    !!contato.whatsapp.trim() && { rotulo: "WhatsApp", valor: formatarTelefone(contato.whatsapp) },
    !!contato.telefone.trim() && {
      rotulo: "Telefone",
      valor: contato.telefone.trim(),
      href: `tel:${contato.telefone.replace(/[^\d+]/g, "")}`,
    },
    !!contato.email.trim() && { rotulo: "E-mail", valor: contato.email.trim(), href: `mailto:${contato.email.trim()}` },
    !!contato.endereco.trim() && { rotulo: "Endereço", valor: contato.endereco.trim() },
    !!contato.horario.trim() && { rotulo: "Horário", valor: contato.horario.trim() },
  ];
  return itens.filter((item): item is ItemContato => Boolean(item));
}

export function redesConfirmadas(links: typeof linksSite = linksSite): Rede[] {
  return [
    { nome: "Facebook", href: links.facebook },
    { nome: "Instagram", href: links.instagram },
  ].filter((rede) => rede.href.trim() !== "");
}
