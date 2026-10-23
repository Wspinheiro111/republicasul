/*
 * FichaLenco: cartão de couro pespontado com o lenço desenhado, nome, uma
 * frase e um link. Usado no guia para mostrar cores e padrões.
 *
 *   <FichaLenco
 *     padrao="liso" cores={[cores.vermelho.hex]}
 *     nome="Maragato" texto="O lenço vermelho."
 *     link={{ href: "/produto/lenco-tradicional-maragato/", texto: "Ver o lenço maragato" }}
 *     tituloArte="Desenho do lenço maragato, vermelho"
 *   />
 *
 * nomeComo: nível do título ("h3" padrão). O desenho tem título acessível.
 */

import type { Padrao } from "../../content/catalogo";
import LencoArte from "../LencoArte";
import LinkSeta from "./LinkSeta";

export type FichaLencoProps = {
  padrao: Padrao;
  cores: string[];
  nome: string;
  texto: string;
  tituloArte: string;
  link?: { href: string; texto: string };
  nomeComo?: "h3" | "h4";
  className?: string;
};

export default function FichaLenco({ padrao, cores, nome, texto, tituloArte, link, nomeComo = "h3", className }: FichaLencoProps) {
  const Titulo = nomeComo;
  return (
    <article
      className={`costura secao-escura trama flex h-full items-center gap-4 rounded-[var(--raio)] p-5 sm:flex-col sm:items-stretch sm:gap-0 sm:p-6 ${className ?? ""}`}
    >
      {/* No celular o cartão fica deitado (desenho à esquerda); do sm para cima, em pé. */}
      <div className="w-28 shrink-0 sm:mx-auto sm:w-full sm:max-w-[13rem]">
        <LencoArte padrao={padrao} cores={cores} titulo={tituloArte} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Titulo className="titulo-3 text-creme sm:mt-4">{nome}</Titulo>
        <p className="mt-1.5 text-creme-2 sm:mt-2">{texto}</p>
        {link && (
          <p className="relative z-[1] mt-auto pt-2 sm:pt-4">
            <LinkSeta href={link.href} tom="escuro">
              {link.texto}
            </LinkSeta>
          </p>
        )}
      </div>
    </article>
  );
}
