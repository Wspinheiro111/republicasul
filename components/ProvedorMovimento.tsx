"use client";

/*
 * ProvedorMovimento: carrega do Framer Motion só o pacote de animação de
 * DOM (domAnimation), sem a animação de layout, e o deixa disponível para os
 * componentes `m.*` da página toda. Já está no app/layout.tsx.
 *
 * Regra para quem anima algo novo: use `m.div` (e não `motion.div`). Com
 * `strict`, um `motion.*` dentro deste provedor dá erro no console, para o
 * pacote completo não voltar para todas as páginas sem ninguém perceber.
 * Animação de layout (prop `layout`) não existe no domAnimation.
 */

import { domAnimation, LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function ProvedorMovimento({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
