/*
 * Faixa para lojistas: chama quem tem loja de artigos gaúchos para a página
 * /lojistas/, onde a conversa segue pelo WhatsApp.
 */

import Link from "next/link";
import { EmblemaLenco } from "../Marca";

export default function FaixaLojistas() {
  return (
    <section aria-labelledby="inicio-lojistas" className="secao-clara-2 py-12 md:py-16">
      <div className="conteudo">
        <div className="costura flex flex-col gap-6 rounded-[var(--raio-grande)] bg-creme px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between md:gap-10 md:py-10">
          <div className="flex items-start gap-5">
            <EmblemaLenco className="mt-1 hidden h-14 w-14 sm:block" />
            <div>
              <p className="rotulo text-ouro-escuro">Para lojistas</p>
              <h2 id="inicio-lojistas" className="titulo-faixa mt-2">
                Tem loja de artigos gaúchos? Revenda Republicasul
              </h2>
              <p className="mt-3 max-w-xl text-tinta/80">Conte sobre a sua loja e a gente conversa sobre a revenda pelo WhatsApp.</p>
            </div>
          </div>
          <Link href="/lojistas/" className="botao-acao shrink-0 self-start md:self-center">
            Quero revender
          </Link>
        </div>
      </div>
    </section>
  );
}
