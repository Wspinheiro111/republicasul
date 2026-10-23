"use client";

/*
 * MiniMontador: um gostinho do montador na página inicial. A pessoa escolhe o
 * padrão (liso, carijó de uma ou duas cores, farroupilha) e as cores, e o
 * desenho do lenço muda na hora. Tudo vem do catálogo: os lisos são os lenços
 * tradicionais, as cores do carijó são as opções de cor do próprio produto.
 *
 * O montador completo fica em /montador/; daqui só se abre ele ou o lenço,
 * levando as cores escolhidas na URL (o montador e a página do produto leem
 * a query e conferem cada valor contra o catálogo). A medida não vai: ela é
 * escolhida lá.
 */

import Link from "next/link";
import { useState } from "react";
import {
  cores,
  coresDasEscolhas,
  escolhasPadrao,
  produtoPorSlug,
  produtosDaCategoria,
  type Opcao,
  type Produto,
} from "../../content/catalogo";
import { caminhoComEscolhas, semCorRepetida } from "../catalogo/funcoes";
import LencoArte from "../LencoArte";
import { caminhoDaCombinacao, MODELO_TRADICIONAL, modeloPorId } from "../montador/combinacao";
import SeletorOpcoes from "../SeletorOpcoes";

type Estilo = { id: string; nome: string; produto?: string };

const TODOS_ESTILOS: Estilo[] = [
  { id: "liso", nome: "Liso" },
  { id: "carijo-uma-cor", nome: "Carijó uma cor", produto: "lenco-carijo-uma-cor" },
  { id: "carijo-duas-cores", nome: "Carijó duas cores", produto: "lenco-carijo-duas-cores" },
  { id: "farroupilha", nome: "Farroupilha", produto: "lenco-farroupilha" },
];

const LISOS = produtosDaCategoria("lencos-tradicionais").filter((p) => p.coresDesenho.length > 0);

// Só entra o padrão cujo produto existe no catálogo.
export const ESTILOS = TODOS_ESTILOS.filter((e) => (e.produto ? produtoPorSlug(e.produto) : LISOS.length > 0));

export const ESTILO_INICIAL = ESTILOS.some((e) => e.id === "carijo-duas-cores") ? "carijo-duas-cores" : (ESTILOS[0]?.id ?? "liso");

const nomeCurto = (p: Produto) => p.nome.replace(/^Lenço tradicional\s+/i, "");

const OPCAO_PADRAO: Opcao = {
  id: "padrao",
  nome: "Padrão",
  tipo: "texto",
  valores: ESTILOS.map(({ id, nome }) => ({ id, nome })),
};

const OPCAO_LISO: Opcao = {
  id: "cor-liso",
  nome: "Cor",
  tipo: "cor",
  valores: LISOS.map((p) => ({ id: p.slug, nome: nomeCurto(p), hex: p.coresDesenho[0] })),
};

const nomeDaCor = (hex: string) => Object.values(cores).find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.nome;

/** "Vermelho", "Vermelho e azul", "Verde, vermelho e amarelo". */
export function juntarNomes(nomes: string[]): string {
  const minusculos = nomes.map((n, i) => (i === 0 ? n : n.toLowerCase()));
  if (minusculos.length <= 1) return minusculos[0] ?? "";
  return `${minusculos.slice(0, -1).join(", ")} e ${minusculos[minusculos.length - 1]}`;
}

export default function MiniMontador({ className }: { className?: string }) {
  const [estilo, setEstilo] = useState(ESTILO_INICIAL);
  const [liso, setLiso] = useState(LISOS[0]?.slug ?? "");
  const [escolhas, setEscolhas] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(
      ESTILOS.flatMap((e) => {
        const p = e.produto ? produtoPorSlug(e.produto) : undefined;
        return p ? [[p.slug, escolhasPadrao(p)]] : [];
      }),
    ),
  );

  const ehLiso = estilo === "liso";
  const produto = ehLiso ? produtoPorSlug(liso) : produtoPorSlug(ESTILOS.find((e) => e.id === estilo)?.produto ?? "");
  if (!produto) return null;

  const escolhasProduto = ehLiso ? {} : (escolhas[produto.slug] ?? escolhasPadrao(produto));
  const opcoesCor = ehLiso ? [OPCAO_LISO] : produto.opcoes.filter((o) => o.tipo === "cor");
  const coresLenco = ehLiso ? produto.coresDesenho : coresDasEscolhas(produto, escolhasProduto);

  // Nomes das cores para a legenda: as escolhidas nas opções ou, sem opção de
  // cor (liso, farroupilha), as do próprio desenho.
  const nomesEscolhidos = ehLiso
    ? []
    : opcoesCor.map((o) => o.valores.find((v) => v.id === escolhasProduto[o.id])?.nome).filter((n): n is string => Boolean(n));
  const nomes = nomesEscolhidos.length > 0 ? nomesEscolhidos : produto.coresDesenho.map(nomeDaCor).filter((n): n is string => Boolean(n));
  const descricao = juntarNomes(nomes);

  // Só as cores (a medida fica para o montador e para a página do lenço).
  const escolhasDeCor = Object.fromEntries(opcoesCor.filter((o) => o.id in escolhasProduto).map((o) => [o.id, escolhasProduto[o.id]]));
  const modelo = modeloPorId(ehLiso ? MODELO_TRADICIONAL : estilo);
  const linkMontador = modelo ? caminhoDaCombinacao({ modelo: modelo.id, produto: produto.slug, escolhas: escolhasDeCor }) : "/montador/";
  const linkProduto = caminhoComEscolhas(produto, escolhasDeCor, `/produto/${produto.slug}/`);

  const aoMudar = (opcaoId: string, valorId: string) => {
    if (opcaoId === "padrao") setEstilo(valorId);
    else if (opcaoId === "cor-liso") setLiso(valorId);
    // Como na página do lenço e no montador: a cor escolhida fica e a outra anda (semCorRepetida).
    else setEscolhas((e) => ({ ...e, [produto.slug]: semCorRepetida(produto, { ...escolhasProduto, [opcaoId]: valorId }, opcaoId) }));
  };

  return (
    <div className={`grid items-start gap-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-14 ${className ?? ""}`}>
      {/*
        A prévia não gruda no topo no celular: grudada, ela cobria as amostras
        que recebiam o foco do teclado (o desenho pequeno fica logo acima delas).
      */}
      <div className="pb-1 md:p-0">
        <div className="costura mx-auto max-w-[11.5rem] rounded-[var(--raio-grande)] bg-couro-2 px-3 pb-3 pt-0 sm:max-w-[16rem] md:max-w-none md:px-12 md:pb-8 md:pt-0">
          <LencoArte
            padrao={produto.padrao}
            cores={coresLenco}
            xadrez="graudo"
            titulo={`Desenho do ${produto.nome.toLowerCase()}${descricao ? `, ${descricao.toLowerCase()}` : ""}`}
          />
        </div>
        <p aria-live="polite" aria-atomic="true" className="mt-3 text-center md:mt-5" data-testid="legenda-montador">
          <span className="block font-titulo text-[1.15rem] font-semibold leading-tight md:text-[1.4rem]">{produto.nome}</span>
          {descricao && <span className="mt-0.5 block text-[0.95rem] text-creme-2">{descricao}</span>}
        </p>
      </div>

      <div>
        <SeletorOpcoes
          tom="escuro"
          opcoes={[OPCAO_PADRAO, ...opcoesCor]}
          escolhas={{ padrao: estilo, "cor-liso": liso, ...escolhasProduto }}
          aoMudar={aoMudar}
        />
        {opcoesCor.length === 0 && produto.padrao === "farroupilha" && (
          <p className="mt-6 max-w-md text-creme-2">As cores são as da bandeira do Rio Grande do Sul: verde, vermelho e amarelo.</p>
        )}
        <p className="mt-6 max-w-md text-[0.95rem] text-creme-2">
          O desenho é uma ilustração para você ver a combinação. A medida e a quantidade ficam para a página do lenço.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href={linkMontador} className="botao-acao">
            Abrir o montador
          </Link>
          <Link href={linkProduto} className="botao-contorno">
            Ver este lenço
          </Link>
        </div>
      </div>
    </div>
  );
}
