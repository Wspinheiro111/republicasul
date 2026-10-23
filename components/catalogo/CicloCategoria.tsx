"use client";

/*
 * CicloCategoria: o desenho que troca de cor no topo da página de uma linha.
 * Envolve o LencoCiclo (que recebe uma função de título e por isso precisa
 * nascer no cliente) com as variações da categoria.
 *
 *   <CicloCategoria slug="carijo-uma-cor" />
 */

import { LencoCiclo } from "../LencoArte";
import { variacoesDaCategoria } from "./funcoes";

export default function CicloCategoria({ slug, className }: { slug: string; className?: string }) {
  const variacoes = variacoesDaCategoria(slug);
  if (variacoes.length === 0) return null;
  const titulos = new Map(variacoes.map((v) => [v.nome, v.titulo]));
  return (
    <LencoCiclo
      variacoes={variacoes}
      titulo={(nome) => titulos.get(nome) ?? `Desenho ilustrativo: ${nome}`}
      className={className}
      antesDoNome={<span className="rotulo text-ouro">Ilustração</span>}
    />
  );
}
