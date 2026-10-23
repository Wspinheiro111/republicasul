/*
 * FaixaPrevia: faixa fina no topo avisando que o site é uma prévia.
 * Só aparece com PREVIA = true em content/site.ts. Sem props.
 * Já está no app/layout.tsx; as páginas não precisam renderizar.
 * É um <aside> (landmark complementar), achável por quem navega por regiões.
 * Sem o número do WhatsApp em content/site.ts, avisa também que os links do
 * WhatsApp ainda não chegam à loja.
 */

import { contato, PREVIA } from "../content/site";

export default function FaixaPrevia() {
  if (!PREVIA) return null;
  return (
    <aside aria-label="Aviso de prévia" data-faixa-previa className="relative border-b border-ouro/25 bg-couro-2 text-creme-2">
      <p className="conteudo flex items-start justify-center gap-2 py-2 text-center text-[0.8rem] leading-snug sm:items-center sm:text-[0.85rem]">
        <span className="rotulo mt-[0.2em] shrink-0 text-[0.68rem] text-ouro sm:mt-0">Prévia</span>
        <span>
          Prévia do novo site. Fotos, cores e medidas ainda serão confirmadas pela Republicasul.
          {!contato.whatsapp && " O WhatsApp ainda não está ligado ao número da loja."}
        </span>
      </p>
    </aside>
  );
}
