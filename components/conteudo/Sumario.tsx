/*
 * Sumario: índice com âncoras para as seções de uma página longa.
 * Pensado para o couro (fica dentro da CabecaPagina).
 *
 *   <Sumario itens={[{ id: "cores", nome: "As cores e seus nomes" }, ...]} />
 *
 * Cada item vira um link "#id" com número; os alvos já têm scroll-margin
 * (globals.css) para não ficarem debaixo do cabeçalho fixo.
 */

export type ItemSumario = { id: string; nome: string };

export default function Sumario({ itens, titulo = "Neste guia" }: { itens: ItemSumario[]; titulo?: string }) {
  return (
    <nav aria-labelledby="titulo-sumario" className="rounded-[var(--raio)] border border-ouro/30 bg-couro-2/70 p-4 sm:p-5">
      <p id="titulo-sumario" className="rotulo text-ouro">
        {titulo}
      </p>
      <ol className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-5">
        {itens.map((item, i) => (
          <li key={item.id} className="border-t border-dashed border-ouro/25 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:border-t-0">
            <a
              href={`#${item.id}`}
              className="group flex min-h-12 items-center gap-3 py-2 text-creme no-underline hover:text-creme"
            >
              <span className="font-titulo text-lg font-semibold text-ouro tabular-nums" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug underline decoration-ouro/0 decoration-1 underline-offset-4 transition-colors group-hover:decoration-ouro/70">
                {item.nome}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
