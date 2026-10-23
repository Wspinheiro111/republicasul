"use client";

/*
 * MiniaturaPeca: a figura pequena de um item do pedido. Decorativa (o nome
 * vem ao lado), por isso aria-hidden.
 *
 *   <MiniaturaPeca produto={produto} escolhas={item.escolhas} className="w-20" />
 *
 * Mostra a foto real quando o produto tem foto e ela é exatamente desta peça
 * (produto sem opção de cor). Senão, ou se a foto falhar, desenha o lenço
 * nas cores escolhidas.
 */

import Image from "next/image";
import { useState } from "react";
import { coresDasEscolhas, type Produto } from "../../content/catalogo";
import LencoArte from "../LencoArte";
import { fotoCorresponde } from "../montador/combinacao";

export type MiniaturaPecaProps = {
  produto: Produto;
  escolhas: Record<string, string>;
  className?: string;
};

export default function MiniaturaPeca({ produto, escolhas, className }: MiniaturaPecaProps) {
  const [falhou, setFalhou] = useState(false);
  const foto = fotoCorresponde(produto) && !falhou ? produto.fotos[0] : null;

  return (
    <div
      aria-hidden="true"
      className={`secao-escura trama relative aspect-square overflow-hidden rounded-[var(--raio)] ${className ?? ""}`}
      data-miniatura={foto ? "foto" : "desenho"}
    >
      {foto ? (
        <Image src={foto} alt="" fill unoptimized sizes="112px" className="object-cover" onError={() => setFalhou(true)} />
      ) : (
        <div className="-mt-[6%] px-[9%]">
          <LencoArte padrao={produto.padrao} cores={coresDasEscolhas(produto, escolhas)} titulo="" mostrarFranja={false} />
        </div>
      )}
    </div>
  );
}
