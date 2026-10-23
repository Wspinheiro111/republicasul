"use client";

/*
 * GaleriaFotos: as fotos reais do produto, com miniaturas quando houver mais
 * de uma. next/image com unoptimized (o site é export estático).
 *
 *   <GaleriaFotos fotos={produto.fotos} nome={produto.nome} reserva={<LencoArte ... />} />
 *
 * - reserva: o que mostrar se nenhuma foto carregar (o desenho do lenço).
 * - Foto que falha some da galeria; se todas falharem, entra a reserva.
 */

import Image from "next/image";
import { useState, type ReactNode } from "react";

export type GaleriaFotosProps = {
  fotos: string[];
  nome: string;
  reserva: ReactNode;
  className?: string;
};

export default function GaleriaFotos({ fotos, nome, reserva, className }: GaleriaFotosProps) {
  const [falhas, setFalhas] = useState<string[]>([]);
  const [escolhida, setEscolhida] = useState(0);
  const boas = fotos.filter((f) => !falhas.includes(f));

  if (boas.length === 0) return <>{reserva}</>;

  const indice = Math.min(escolhida, boas.length - 1);
  const atual = boas[indice];
  const total = boas.length;

  return (
    <div className={className}>
      <div className="secao-escura relative aspect-square overflow-hidden rounded-[var(--raio-grande)]">
        <Image
          key={atual}
          src={atual}
          alt={total > 1 ? `Foto ${indice + 1} de ${total} do ${nome}` : `Foto do ${nome}`}
          fill
          unoptimized
          priority={indice === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          onError={() => setFalhas((f) => [...f, atual])}
        />
      </div>
      {total > 1 && (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0" aria-label="Fotos do produto">
          {boas.map((foto, i) => (
            <li key={foto}>
              <button
                type="button"
                onClick={() => setEscolhida(i)}
                aria-pressed={i === indice}
                aria-label={`Ver foto ${i + 1} de ${total}`}
                className={`relative block h-16 w-16 overflow-hidden rounded-[var(--raio)] border-2 transition-colors ${
                  i === indice ? "border-tinta" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={foto} alt="" fill unoptimized sizes="64px" className="object-cover" onError={() => setFalhas((f) => [...f, foto])} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
