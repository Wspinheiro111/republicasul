"use client";

// Ganchos de movimento seguros para hidratação.
//
// useReducedMotion() do Framer Motion já responde no primeiro render do
// navegador, mas o servidor não sabe a preferência: se o HTML depender disso,
// a hidratação quebra. Estes ganchos devolvem o mesmo valor do servidor
// durante a hidratação e só depois a preferência real.

import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

const nadaParaAssinar = () => () => {};

/** false no servidor e durante a hidratação; true depois de montar. */
export function useMontado(): boolean {
  return useSyncExternalStore(
    nadaParaAssinar,
    () => true,
    () => false,
  );
}

/** "Reduzir movimento" ligado, sem quebrar a hidratação (false até montar). */
export function useReduzirMovimento(): boolean {
  const reduzir = useReducedMotion();
  const montado = useMontado();
  return montado && !!reduzir;
}
