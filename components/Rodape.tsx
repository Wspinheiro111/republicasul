/*
 * Rodape: assinatura da empresa, CNPJ, Porto Alegre/RS, links das páginas,
 * redes (só as preenchidas em content/site.ts), contatos (só os confirmados)
 * e o botão do WhatsApp. Sem props: é renderizado uma vez em app/layout.tsx.
 */

import Link from "next/link";
import { contato, empresa, links } from "../content/site";
import BotaoWhatsApp from "./BotaoWhatsApp";
import Marca from "./Marca";
import { MENSAGEM_GERAL, navegacao } from "./navegacao";

export default function Rodape() {
  const redes = [
    { nome: "Facebook", href: links.facebook },
    { nome: "Instagram", href: links.instagram },
  ].filter((r) => r.href);

  const contatos = [
    contato.telefone && { rotulo: "Telefone", valor: contato.telefone, href: `tel:${contato.telefone.replace(/[^\d+]/g, "")}` },
    contato.email && { rotulo: "E-mail", valor: contato.email, href: `mailto:${contato.email}` },
    contato.endereco && { rotulo: "Endereço", valor: contato.endereco },
    contato.horario && { rotulo: "Horário", valor: contato.horario },
  ].filter(Boolean) as { rotulo: string; valor: string; href?: string }[];

  return (
    <footer className="secao-escura trama relative text-creme">
      <div aria-hidden="true" className="linha-de-ponto" />
      <div className="conteudo grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12 md:py-16">
        <div className="max-w-md">
          <Link href="/" className="inline-flex min-h-11 items-center no-underline" aria-label="Republicasul, página inicial">
            <Marca />
          </Link>
          <p className="mt-5 text-creme-2">{empresa.assinatura}</p>
          <p className="mt-4 text-[0.95rem] text-creme-2">A venda fecha no WhatsApp: monte sua lista no site e mande a mensagem pronta.</p>
          <BotaoWhatsApp texto={MENSAGEM_GERAL} origem="rodape" className="mt-6">
            Chamar no WhatsApp
          </BotaoWhatsApp>
        </div>

        <nav aria-label="Rodapé">
          <p className="rotulo mb-4 text-ouro">Páginas</p>
          <ul className="flex flex-col">
            {[{ nome: "Início", href: "/" }, ...navegacao, { nome: "Seu pedido", href: "/pedido/" }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-creme-2 no-underline transition-colors hover:text-creme hover:underline">
                  {item.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          {redes.length > 0 && (
            <>
              <p className="rotulo mb-4 text-ouro">Redes</p>
              <ul className="mb-8 flex flex-col">
                {redes.map((rede) => (
                  <li key={rede.nome}>
                    <a
                      href={rede.href}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-11 items-center text-creme-2 no-underline transition-colors hover:text-creme hover:underline"
                    >
                      {rede.nome}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {contatos.length > 0 && (
            <>
              <p className="rotulo mb-4 text-ouro">Contato</p>
              <dl className="mb-8 flex flex-col gap-3 text-creme-2">
                {contatos.map((c) => (
                  <div key={c.rotulo}>
                    <dt className="text-[0.85rem] text-creme-2/80">{c.rotulo}</dt>
                    <dd className="m-0">{c.href ? <a href={c.href}>{c.valor}</a> : c.valor}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <p className="rotulo mb-3 text-ouro">Empresa</p>
          <p className="text-[0.95rem] text-creme-2">
            {empresa.nome}
            <br />
            CNPJ {empresa.cnpj}
            <br />
            {empresa.cidade}/{empresa.uf}
          </p>
        </div>
      </div>
      <div className="conteudo pb-8">
        <div aria-hidden="true" className="linha-de-ponto opacity-30" />
        <p className="pt-5 text-[0.85rem] text-creme-2/80">
          Lenços e palas da indumentária gaúcha · {empresa.cidade}/{empresa.uf}
        </p>
      </div>
    </footer>
  );
}
