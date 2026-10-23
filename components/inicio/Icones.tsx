/*
 * Ícones de linha da página inicial (traço fino, cor do texto).
 * Todos decorativos: aria-hidden. O sentido vem do texto ao lado.
 */

type IconeProps = { className?: string };

const linha = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

/** Passo 1: o lenço dobrado e as amostras de cor. */
export function IconeEscolher({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...linha}>
      <path d="M5 13h27L18.5 37Z" />
      <path d="M10 16.5h17" strokeDasharray="2.2 2.6" strokeWidth="1.4" />
      <circle cx="39" cy="14" r="3.6" />
      <circle cx="39" cy="25" r="3.6" fill="currentColor" />
      <circle cx="39" cy="36" r="3.6" />
    </svg>
  );
}

/** Passo 2: a lista de pedido. */
export function IconeLista({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...linha}>
      <path d="M12 6h24a2 2 0 0 1 2 2v34l-4.67-2.8L28.67 42 24 39.2 19.33 42l-4.66-2.8L10 42V8a2 2 0 0 1 2-2Z" />
      <path d="M16 15.5l2 2 3.5-3.5M25 16h8M16 23.5l2 2 3.5-3.5M25 24h8M16 31.5l2 2 3.5-3.5M25 32h5" />
    </svg>
  );
}

/** Passo 3: a conversa no WhatsApp. */
export function IconeConversa({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...linha}>
      <path d="M8 9h32a2 2 0 0 1 2 2v21a2 2 0 0 1-2 2H23l-9 7v-7H8a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z" />
      <path d="M14 18h20M14 25h12" />
    </svg>
  );
}

export function IconeSeta({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...linha}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconeCheck({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...linha} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconeMais({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...linha}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconePausa({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor" />
    </svg>
  );
}

export function IconeTocar({ className }: IconeProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M6 4l10 6-10 6z" fill="currentColor" />
    </svg>
  );
}
