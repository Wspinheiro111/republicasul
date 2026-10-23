"use client";

/*
 * CopiarLink: "Copiar link desta combinação".
 *
 *   <CopiarLink caminho="/montador/?modelo=farroupilha&medida=padrao" />
 *
 * - caminho: o link sem domínio; o domínio é o da página aberta (funciona
 *   igual no site publicado e nas prévias).
 * - Usa navigator.clipboard. Sem ele (navegador antigo, permissão negada),
 *   mostra o link num campo já selecionado para a pessoa copiar.
 * - Avisa "Link copiado" na tela e para leitor de tela (role="status").
 */

import { useEffect, useId, useRef, useState } from "react";
import { IconeCheck, IconeLink } from "./Icones";

export type CopiarLinkProps = {
  caminho: string;
  className?: string;
};

type Estado = "parado" | "copiado" | "manual";

const TEMPO_AVISO = 3000;

export function enderecoCompleto(caminho: string, base: string): string {
  try {
    return new URL(caminho, base).toString();
  } catch {
    return caminho;
  }
}

export default function CopiarLink({ caminho, className }: CopiarLinkProps) {
  const [estado, setEstado] = useState<Estado>("parado");
  const [copiouNoManual, setCopiouNoManual] = useState(false);
  const [endereco, setEndereco] = useState("");
  // Conta as vezes que caiu no plano B, para selecionar o campo de novo a cada clique.
  const [vezManual, setVezManual] = useState(0);
  const campoRef = useRef<HTMLInputElement>(null);
  const idCampo = useId();

  // "Link copiado" volta ao normal depois de alguns segundos.
  useEffect(() => {
    if (estado !== "copiado") return;
    const relogio = window.setTimeout(() => setEstado("parado"), TEMPO_AVISO);
    return () => window.clearTimeout(relogio);
  }, [estado]);

  // A combinação mudou com o campo aberto: o campo mostra o link novo.
  useEffect(() => {
    if (estado === "manual") setEndereco(enderecoCompleto(caminho, window.location.href));
  }, [caminho, estado]);

  // Plano B: seleciona o link no campo e tenta copiar do jeito antigo.
  useEffect(() => {
    if (estado !== "manual") return;
    const campo = campoRef.current;
    if (!campo) return;
    campo.focus({ preventScroll: true });
    campo.select();
    try {
      setCopiouNoManual(typeof document.execCommand === "function" && document.execCommand("copy"));
    } catch {
      setCopiouNoManual(false);
    }
  }, [estado, vezManual]);

  const copiar = async () => {
    const texto = enderecoCompleto(caminho, window.location.href);
    setEndereco(texto);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
        setEstado("copiado");
        return;
      }
    } catch {
      // Permissão negada ou página fora de contexto seguro: segue para o plano B.
    }
    setCopiouNoManual(false);
    setVezManual((v) => v + 1);
    setEstado("manual");
  };

  const copiado = estado === "copiado";
  let aviso = "";
  if (copiado || (estado === "manual" && copiouNoManual)) aviso = "Link copiado.";
  else if (estado === "manual") aviso = "O link está selecionado no campo abaixo. Copie com Ctrl+C ou toque e segure.";

  return (
    <div className={className}>
      <button type="button" onClick={copiar} className="botao-contorno botao-pequeno w-full" data-estado={estado}>
        {copiado ? <IconeCheck className="h-5 w-5" /> : <IconeLink className="h-5 w-5" />}
        <span>{copiado ? "Link copiado" : "Copiar link desta combinação"}</span>
      </button>
      <p role="status" className={estado === "manual" ? "mt-2 text-[0.95rem] text-tinta/80" : "sr-only"}>
        {aviso}
      </p>
      {estado === "manual" && (
        <div className="mt-2">
          <label htmlFor={idCampo} className="rotulo mb-1.5 block text-ouro-escuro">
            Link desta combinação
          </label>
          <input
            id={idCampo}
            ref={campoRef}
            type="url"
            readOnly
            value={endereco}
            onFocus={(e) => e.currentTarget.select()}
            className="block min-h-12 w-full rounded-[var(--raio)] border border-tinta/30 bg-white/70 px-3 text-[0.95rem] text-tinta"
          />
        </div>
      )}
    </div>
  );
}
