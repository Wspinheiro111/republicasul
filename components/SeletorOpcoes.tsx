"use client";

/*
 * SeletorOpcoes: escolha das variações de um produto (cor, medida...).
 * Controlado: quem usa guarda as escolhas no estado e recebe aoMudar.
 *
 *   const [escolhas, setEscolhas] = useState(() => escolhasPadrao(produto));
 *   <SeletorOpcoes
 *     opcoes={produto.opcoes}
 *     escolhas={escolhas}
 *     aoMudar={(id, valor) => setEscolhas((e) => ({ ...e, [id]: valor }))}
 *   />
 *
 * Props
 * - opcoes: Opcao[] (do catálogo). Cada uma vira um radiogroup nativo
 *   (fieldset + legend + input radio), navegável pelas setas do teclado.
 * - escolhas: Record<idDaOpcao, idDoValor>.
 * - aoMudar(idDaOpcao, idDoValor).
 * - tom?: "claro" (padrão, sobre creme) | "escuro" (sobre couro).
 * - className?: classes do contêiner.
 * Tipo "cor": bolinhas de 44px com anel na escolhida e o nome da cor na legenda.
 * Tipo "texto": chips. opcao.ajuda aparece embaixo (e é ligada por aria-describedby).
 */

import { useId } from "react";
import type { Opcao } from "../content/catalogo";
import { luminancia } from "./LencoArte";

export type SeletorOpcoesProps = {
  opcoes: Opcao[];
  escolhas: Record<string, string>;
  aoMudar: (opcaoId: string, valorId: string) => void;
  tom?: "claro" | "escuro";
  className?: string;
};

export default function SeletorOpcoes({ opcoes, escolhas, aoMudar, tom = "claro", className }: SeletorOpcoesProps) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const escuro = tom === "escuro";

  if (opcoes.length === 0) return null;

  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      {opcoes.map((opcao) => {
        const nomeGrupo = `${base}-${opcao.id}`;
        const idAjuda = opcao.ajuda ? `${nomeGrupo}-ajuda` : undefined;
        const escolhido = opcao.valores.find((v) => v.id === escolhas[opcao.id]);
        return (
          <fieldset key={opcao.id} aria-describedby={idAjuda} className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-3 flex flex-wrap items-baseline gap-x-2 p-0">
              <span className={`rotulo ${escuro ? "text-ouro" : "text-ouro-escuro"}`}>{opcao.nome}</span>
              {opcao.tipo === "cor" && escolhido && (
                <span className="font-titulo text-[1.1rem] font-semibold" data-testid={`escolha-${opcao.id}`}>
                  {escolhido.nome}
                </span>
              )}
            </legend>

            {opcao.tipo === "cor" ? (
              <div className="flex flex-wrap gap-3">
                {opcao.valores.map((valor) => {
                  const marcado = escolhas[opcao.id] === valor.id;
                  const hex = valor.hex ?? "#888888";
                  const claro = luminancia(hex) > 0.45;
                  return (
                    <label key={valor.id} className="relative inline-flex h-11 w-11 cursor-pointer" title={valor.nome}>
                      <input
                        type="radio"
                        name={nomeGrupo}
                        value={valor.id}
                        checked={marcado}
                        onChange={() => aoMudar(opcao.id, valor.id)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: hex }}
                        className={`block h-11 w-11 rounded-full border shadow-[inset_0_-3px_6px_rgba(0,0,0,0.18),inset_0_2px_3px_rgba(255,255,255,0.18)] transition-[box-shadow,transform] duration-150 hover:scale-105 peer-checked:ring-2 peer-checked:ring-offset-[3px] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-[7px] peer-focus-visible:outline-[var(--foco)] ${
                          escuro
                            ? "border-white/25 peer-checked:ring-creme peer-checked:ring-offset-couro"
                            : "border-black/20 peer-checked:ring-tinta peer-checked:ring-offset-creme"
                        }`}
                      />
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 m-auto hidden h-5 w-5 peer-checked:block"
                      >
                        <path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          fill="none"
                          stroke={claro ? "#1a1512" : "#ffffff"}
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="sr-only">{valor.nome}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {opcao.valores.map((valor) => (
                  <label key={valor.id} className="relative inline-flex cursor-pointer">
                    <input
                      type="radio"
                      name={nomeGrupo}
                      value={valor.id}
                      checked={escolhas[opcao.id] === valor.id}
                      onChange={() => aoMudar(opcao.id, valor.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={`inline-flex min-h-11 items-center rounded-[var(--raio)] border px-4 text-[0.98rem] font-medium transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--foco)] ${
                        escuro
                          ? "border-creme/35 text-creme hover:border-creme/70 peer-checked:border-creme peer-checked:bg-creme peer-checked:text-tinta"
                          : "border-tinta/30 text-tinta hover:border-tinta/70 peer-checked:border-tinta peer-checked:bg-tinta peer-checked:text-creme"
                      }`}
                    >
                      {valor.nome}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {opcao.ajuda && (
              <p id={idAjuda} className={`mt-2.5 text-[0.95rem] ${escuro ? "text-creme-2" : "text-tinta/75"}`}>
                {opcao.ajuda}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
