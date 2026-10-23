/*
 * Ícones do montador e da página do pedido. Traço simples, herdam a cor do
 * texto (currentColor) e são sempre decorativos (aria-hidden).
 *
 *   <IconeMais className="h-5 w-5" />
 */

type Props = { className?: string };

const svg = (className: string | undefined) => ({
  viewBox: "0 0 24 24",
  className,
  "aria-hidden": true,
  focusable: false,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconeMais({ className }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeCheck({ className }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconeLink({ className }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </svg>
  );
}

export function IconeLixeira({ className }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v5.5M14 11v5.5" />
    </svg>
  );
}

export function IconeDesfazer({ className }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M9 7.5L4.5 12 9 16.5" />
      <path d="M5 12h9.5a5 5 0 0 1 0 10H12" />
    </svg>
  );
}

export function IconePausa({ className, pausado }: Props & { pausado: boolean }) {
  return pausado ? (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M6 4l10 6-10 6z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor" />
    </svg>
  );
}
