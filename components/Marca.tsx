/*
 * Marca provisória da Republicasul: emblema de lenço dobrado + nome em Fraunces.
 * Tipográfica até o dono enviar o logotipo oficial.
 *
 *   <Marca />                       emblema + nome (+ "Lenços e palas" a partir do sm)
 *   <Marca semLinhaFina />          só emblema + nome
 *   <EmblemaLenco className="h-8 w-8" />   só o emblema (decorativo, aria-hidden)
 *
 * A cor do nome segue a cor do texto (currentColor).
 */

export function EmblemaLenco({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      {/* Lenço dobrado em triângulo, com o nó em cima. */}
      <path d="M3 8.5 L29 8.5 L16 29 Z" fill="var(--maragato)" />
      <path d="M3 8.5 L29 8.5 L16 29 Z" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
      <path d="M7.2 10.6 L24.8 10.6 L16 24.6 Z" fill="none" stroke="var(--ouro)" strokeWidth="0.9" strokeDasharray="1.6 1.3" />
      <path d="M12.6 8.5 L19.4 8.5 L16 13.6 Z" fill="#000" fillOpacity="0.22" />
      <rect x="13.2" y="4" width="5.6" height="5.4" rx="1.4" fill="var(--maragato-escuro)" />
      <rect x="13.2" y="4" width="5.6" height="5.4" rx="1.4" fill="none" stroke="var(--ouro)" strokeWidth="0.7" />
    </svg>
  );
}

export default function Marca({ semLinhaFina = false, className }: { semLinhaFina?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      {/* Abaixo de 360px tudo encolhe um pouco: a 320px o botão de menu cabe inteiro na tela. */}
      <EmblemaLenco className="h-7 w-7 shrink-0 min-[360px]:h-8 min-[360px]:w-8 md:h-9 md:w-9" />
      <span className="flex flex-col leading-none">
        <span className="font-titulo text-[1.15rem] font-bold tracking-[-0.01em] min-[360px]:text-[1.4rem] md:text-[1.55rem]">Republicasul</span>
        {!semLinhaFina && (
          <span className="rotulo mt-1 hidden text-[0.62rem] text-ouro sm:block" style={{ letterSpacing: "0.22em" }}>
            Lenços e palas
          </span>
        )}
      </span>
    </span>
  );
}
