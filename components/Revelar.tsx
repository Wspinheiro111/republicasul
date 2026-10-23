"use client";

/*
 * Revelar: o conteúdo sobe e aparece de leve quando entra na tela.
 *
 *   <Revelar>...</Revelar>
 *   <Revelar como="li" atraso={0.08 * i} className="...">...</Revelar>
 *
 * Props
 * - children; className?
 * - como?: "div" (padrão) | "section" | "article" | "li" | "header" | "figure" | "span"
 * - atraso?: segundos antes de animar (para escalonar listas). Padrão 0.
 * - distancia?: quantos px sobe (padrão 18).
 * - id?: repassado ao elemento.
 *
 * Regras de segurança: o HTML do servidor já sai VISÍVEL (sem JS, tudo aparece).
 * Só esconde, antes da primeira pintura, o que está abaixo da dobra; o que já
 * está na tela ao carregar fica parado. Com "reduzir movimento" não anima nada.
 */

import { m, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const usarEfeitoAntesDaPintura = typeof window === "undefined" ? useEffect : useLayoutEffect;

const elementos = {
  div: m.div,
  section: m.section,
  article: m.article,
  li: m.li,
  header: m.header,
  figure: m.figure,
  span: m.span,
};

export type RevelarProps = {
  children: ReactNode;
  className?: string;
  como?: keyof typeof elementos;
  atraso?: number;
  distancia?: number;
  id?: string;
};

export default function Revelar({ children, className, como = "div", atraso = 0, distancia = 18, id }: RevelarProps) {
  const ref = useRef<HTMLElement>(null);
  const reduzir = useReducedMotion();
  const [esperando, setEsperando] = useState(false);
  const visto = useInView(ref, { once: true, amount: 0.12, margin: "0px 0px -6% 0px" });

  usarEfeitoAntesDaPintura(() => {
    if (reduzir) return;
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    // Só anima o que ainda não está na tela.
    if (el.getBoundingClientRect().top > window.innerHeight * 0.95) setEsperando(true);
  }, [reduzir]);

  const Elemento = elementos[como] as typeof m.div;
  const escondido = esperando && !visto && !reduzir;

  return (
    <Elemento
      ref={ref as React.Ref<HTMLDivElement>}
      id={id}
      className={className}
      data-revelar=""
      initial={false}
      animate={escondido ? "escondido" : "visivel"}
      variants={{
        escondido: { opacity: 0, y: distancia, transition: { duration: 0 } },
        visivel: { opacity: 1, y: 0, transition: { duration: 0.65, delay: esperando ? atraso : 0, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </Elemento>
  );
}
