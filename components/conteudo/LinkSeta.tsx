/*
 * LinkSeta: link de texto com seta, sublinhado em ponto (costura).
 *
 *   <LinkSeta href="/catalogo/">Ver os lenços</LinkSeta>
 *   <LinkSeta href="/montador/" tom="escuro">Abrir o montador</LinkSeta>
 *
 * tom: "claro" (padrão, sobre creme: tinta com sublinhado dourado queimado)
 *      | "escuro" (sobre couro: dourado).
 */

import Link from "next/link";
import type { ReactNode } from "react";

export function Seta({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" focusable="false">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LinkSeta({
  href,
  children,
  tom = "claro",
  className,
}: {
  href: string;
  children: ReactNode;
  tom?: "claro" | "escuro";
  className?: string;
}) {
  const cor =
    tom === "escuro"
      ? "text-ouro decoration-ouro/60 hover:text-creme"
      : "text-tinta decoration-ouro-escuro/60 hover:text-maragato-escuro";
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-2 font-medium underline decoration-dashed decoration-1 underline-offset-4 ${cor} ${className ?? ""}`}
    >
      {children}
      <Seta />
    </Link>
  );
}
