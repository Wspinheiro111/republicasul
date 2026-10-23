/*
 * Perguntas frequentes com <details>/<summary> nativo (teclado e leitor de
 * tela já funcionam) e o JSON-LD FAQPage com o mesmo texto.
 * Respostas sem prazos, formas de pagamento ou frete inventados.
 */

import Link from "next/link";
import CabecaSecao from "./CabecaSecao";
import { IconeMais } from "./Icones";

export type Pergunta = {
  pergunta: string;
  resposta: string;
  link?: { href: string; texto: string };
};

export const PERGUNTAS: Pergunta[] = [
  {
    pergunta: "Como faço o pedido?",
    resposta:
      "Escolha o lenço, a cor e a medida e adicione ao seu pedido. Quando terminar, abra Seu pedido e envie pelo WhatsApp. A mensagem sai pronta, com tudo o que você escolheu.",
    link: { href: "/catalogo/", texto: "Ver os lenços" },
  },
  {
    pergunta: "Posso escolher as cores e pedir medida especial?",
    resposta:
      "Pode. No carijó você escolhe as cores nas opções do lenço; nos tradicionais, cada cor é um modelo. A medida especial também está nas opções, e o tamanho você diz na conversa do WhatsApp.",
  },
  {
    pergunta: "Como fico sabendo o valor?",
    resposta: "Pelo WhatsApp. Mande o pedido montado e a gente passa o valor na conversa.",
  },
  {
    pergunta: "Vocês entregam fora de Porto Alegre?",
    resposta: "Combinamos a entrega na conversa do WhatsApp.",
  },
  {
    pergunta: "Vocês vendem para lojas?",
    resposta: "Sim. Veja a página para lojistas e mande os dados da sua loja.",
    link: { href: "/lojistas/", texto: "Página para lojistas" },
  },
];

export function jsonLdPerguntas(lista: Pergunta[] = PERGUNTAS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: lista.map((p) => ({
      "@type": "Question",
      name: p.pergunta,
      acceptedAnswer: { "@type": "Answer", text: p.resposta },
    })),
  };
}

export default function Perguntas() {
  return (
    <section aria-labelledby="inicio-perguntas" className="secao-clara py-14 md:py-20">
      <div className="conteudo grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <CabecaSecao id="inicio-perguntas" rotulo="Perguntas frequentes" titulo="Perguntas de balcão" className="lg:self-start">
          <p>Ficou outra dúvida? Pergunte no WhatsApp, a gente responde na conversa.</p>
        </CabecaSecao>

        <div className="border-t border-dashed border-tinta/30">
          {PERGUNTAS.map((p) => (
            <details key={p.pergunta} className="group border-b border-dashed border-tinta/30">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-titulo text-[1.2rem] font-semibold leading-snug hover:text-maragato-escuro md:text-[1.3rem] [&::-webkit-details-marker]:hidden">
                {p.pergunta}
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-tinta/25 text-ouro-escuro transition-transform duration-300 group-open:rotate-45"
                >
                  <IconeMais className="h-5 w-5" />
                </span>
              </summary>
              <div className="pb-6 pr-12">
                <p className="text-tinta/85">{p.resposta}</p>
                {p.link && (
                  <Link
                    href={p.link.href}
                    className="mt-2 inline-flex min-h-11 items-center font-semibold underline decoration-ouro-escuro/60 underline-offset-4 hover:decoration-ouro-escuro"
                  >
                    {p.link.texto}
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdPerguntas()).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
