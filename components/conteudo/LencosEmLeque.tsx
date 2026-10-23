/*
 * LencosEmLeque: alguns lenços desenhados abertos em leque, como sobre o
 * balcão. No celular viram uma fileira pequena; a partir do md, se sobrepõem
 * girados. Uma única cópia de cada desenho (sem duplicar SVG por tela).
 *
 *   <LencosEmLeque lencos={[
 *     { padrao: "liso", cores: [cores.vermelho.hex], titulo: "Lenço maragato" },
 *     { padrao: "carijo", cores: [cores.azul.hex, cores.branco.hex], titulo: "Lenço carijó" },
 *   ]} />
 *
 * Decorativo: quem usa costuma pôr dentro de um aria-hidden (a CabecaPagina já faz).
 */

import type { CSSProperties } from "react";
import type { Padrao } from "../../content/catalogo";
import LencoArte from "../LencoArte";

export type LencoDoLeque = { padrao: Padrao; cores: string[]; titulo: string };

export default function LencosEmLeque({ lencos, className }: { lencos: LencoDoLeque[]; className?: string }) {
  const n = lencos.length;
  return (
    <div
      className={`relative mx-auto grid w-full max-w-[22rem] gap-2 sm:max-w-[26rem] md:block md:aspect-[6/5] md:max-w-[30rem] ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${Math.max(n, 1)}, minmax(0, 1fr))` }}
    >
      {lencos.map((lenco, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const posicao = {
          "--x": `${(t * 46).toFixed(1)}%`,
          "--y": `${(4 + Math.abs(t - 0.5) * 22).toFixed(1)}%`,
          "--r": `${(-16 + t * 32).toFixed(1)}deg`,
        } as CSSProperties;
        return (
          <div key={`${lenco.titulo}-${i}`} className="md:absolute md:left-(--x) md:top-(--y) md:w-[54%] md:rotate-(--r)" style={posicao}>
            <LencoArte padrao={lenco.padrao} cores={lenco.cores} titulo={lenco.titulo} xadrez="graudo" mostrarFranja={false} />
          </div>
        );
      })}
    </div>
  );
}
