/*
 * Link de texto com seta, em rótulo condensado ("Ver todos os lenços  →").
 * A cor segue o texto do fundo; a seta e o sublinhado usam o dourado certo.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { IconeSeta } from "./Icones";

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
  const ouro = tom === "escuro" ? "text-ouro decoration-ouro/50" : "text-ouro-escuro decoration-ouro-escuro/50";
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-2 font-rotulo text-[1rem] font-semibold uppercase tracking-[0.1em] underline underline-offset-[0.4em] ${ouro} ${className ?? ""}`}
    >
      <span className={tom === "escuro" ? "text-creme" : "text-tinta"}>{children}</span>
      <IconeSeta className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}
