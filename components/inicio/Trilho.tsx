"use client";

/*
 * Trilho: <ul> com rolagem lateral (scroll-snap). Quando o foco do teclado
 * entra num cartão que está só pela metade na tela, traz o cartão inteiro
 * para dentro do trilho (o Chrome não rola sozinho quando o item já aparece
 * em parte).
 */

import type { FocusEvent, ReactNode } from "react";

export default function Trilho({ className, children }: { className?: string; children: ReactNode }) {
  const aoFocar = (e: FocusEvent<HTMLUListElement>) => {
    const item = (e.target as HTMLElement).closest("li");
    if (item && e.currentTarget.contains(item)) item.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };
  return (
    <ul className={className} onFocus={aoFocar}>
      {children}
    </ul>
  );
}
