"use client";

/*
 * EstadoVazio: a lista de pedido sem nada. Um lenço ainda sem cor, o recado
 * e os caminhos para o catálogo e o montador.
 *
 *   <EstadoVazio tituloRef={ref} />
 */

import Link from "next/link";
import type { Ref } from "react";
import LencoArte from "../LencoArte";

// O lenço "em branco": creme, esperando a cor.
const CRU = "#e6dccb";

export default function EstadoVazio({ tituloRef }: { tituloRef?: Ref<HTMLHeadingElement> }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-6 text-center md:py-10" data-testid="pedido-vazio">
      <div aria-hidden="true" className="secao-escura trama costura w-40 rounded-[var(--raio-grande)] px-5 pb-5 sm:w-48">
        <div className="-mt-[8%]">
          <LencoArte padrao="liso" cores={[CRU]} titulo="" />
        </div>
      </div>
      <h2 ref={tituloRef} tabIndex={-1} className="mt-7 text-[clamp(1.9rem,4vw,2.6rem)]">
        Sua lista está vazia
      </h2>
      <p className="texto-grande mt-3 text-tinta/80">
        Escolha os lenços no catálogo ou monte o seu com as cores que quiser. O que você separar aparece aqui, pronto para mandar pelo
        WhatsApp.
      </p>
      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href="/catalogo/" className="botao-acao">
          Ver os lenços
        </Link>
        <Link href="/montador/" className="botao-contorno">
          Monte o seu lenço
        </Link>
      </div>
    </div>
  );
}
