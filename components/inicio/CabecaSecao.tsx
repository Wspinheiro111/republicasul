/*
 * Cabeça de seção da página inicial: rótulo, h2 (com id para aria-labelledby),
 * texto curto opcional e uma ação à direita (link "ver todos").
 */

import type { ReactNode } from "react";

export type CabecaSecaoProps = {
  id: string;
  rotulo: string;
  titulo: ReactNode;
  tom?: "claro" | "escuro";
  acao?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export default function CabecaSecao({ id, rotulo, titulo, tom = "claro", acao, className, children }: CabecaSecaoProps) {
  const escuro = tom === "escuro";
  return (
    <div className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10 ${className ?? ""}`}>
      <div className="max-w-2xl">
        <p className={`rotulo ${escuro ? "text-ouro" : "text-ouro-escuro"}`}>{rotulo}</p>
        <h2 id={id} className="mt-3">
          {titulo}
        </h2>
        {children && <div className={`texto-grande mt-4 ${escuro ? "text-creme-2" : "text-tinta/80"}`}>{children}</div>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}
