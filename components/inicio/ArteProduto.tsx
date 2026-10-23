/*
 * ArteProduto: a imagem do produto num cartão. Com foto real (produto.fotos),
 * mostra a primeira foto (next/image sem otimização, pois o site é export
 * estático). Sem foto, desenha o lenço com LencoArte.
 *
 *   <ArteProduto produto={p} cores={coresDasEscolhas(p, escolhasPadrao(p))} sizes="(min-width: 1024px) 30vw, 50vw" />
 */

import Image from "next/image";
import type { Produto } from "../../content/catalogo";
import LencoArte from "../LencoArte";

export type ArteProdutoProps = {
  produto: Produto;
  /** Cores do desenho (padrão: produto.coresDesenho). */
  cores?: string[];
  /** Atributo sizes da foto. */
  sizes?: string;
  className?: string;
};

export default function ArteProduto({ produto, cores, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 40vw", className }: ArteProdutoProps) {
  const foto = produto.fotos[0];
  if (foto) {
    return (
      <div className={`relative aspect-square overflow-hidden rounded-[var(--raio-pequeno)] ${className ?? ""}`}>
        <Image src={foto} alt={produto.nome} fill unoptimized sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <LencoArte
      padrao={produto.padrao}
      cores={cores ?? produto.coresDesenho}
      titulo={`Desenho do ${produto.nome.toLowerCase()}`}
      className={className}
    />
  );
}
