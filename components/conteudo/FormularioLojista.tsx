"use client";

/*
 * FormularioLojista: a loja preenche os dados e o WhatsApp abre com a
 * mensagem pronta (mensagemLojista + numeroLojistas, origem "lojistas").
 *
 *   <h2 id="titulo-formulario-lojista">Dados da loja</h2>
 *   <FormularioLojista idTitulo="titulo-formulario-lojista" />
 *
 * idTitulo: id do título que nomeia o formulário (aria-labelledby).
 *
 * Acessibilidade: cada campo tem label; avisos de erro ficam embaixo do campo,
 * ligados por aria-describedby, com aria-invalid; ao enviar com erro, o foco
 * vai para o primeiro campo a corrigir e um aviso é lido pelo leitor de tela.
 * Depois do primeiro envio, os avisos se atualizam enquanto a pessoa digita.
 * Se o navegador bloquear a nova aba, aparece o botão para abrir o WhatsApp.
 */

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { cliqueWhatsApp } from "../../lib/analytics";
import { mensagemLojista, numeroLojistas } from "../../lib/whatsapp";
import BotaoWhatsApp, { IconeWhatsApp } from "../BotaoWhatsApp";
import { CAMPOS_VAZIOS, dadosDoFormulario, linkLojista, mascararCnpj, validarLojista, type CamposLojista, type ErrosLojista } from "./lojista";

const ORDEM: (keyof CamposLojista)[] = ["loja", "cnpj", "cidade", "responsavel", "interesse"];

function IconeAviso() {
  return (
    <svg viewBox="0 0 16 16" className="mt-[0.2em] h-4 w-4" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.6v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.95" fill="currentColor" />
    </svg>
  );
}

type CampoProps = {
  id: string;
  rotulo: string;
  obrigatorio?: boolean;
  dica?: string;
  erro?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: true; className: string }) => ReactNode;
};

function Campo({ id, rotulo, obrigatorio = false, dica, erro, children }: CampoProps) {
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descricao = [idDica, idErro].filter(Boolean).join(" ") || undefined;
  const classe = `w-full rounded-[var(--raio)] border bg-creme px-3.5 py-3 text-[1.0625rem] text-tinta placeholder:text-tinta/45 ${
    erro ? "border-maragato border-2" : "border-tinta/35 hover:border-tinta/60"
  }`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2 font-medium">
        {rotulo}
        <span className="text-[0.9rem] font-normal text-tinta/70">{obrigatorio ? "(obrigatório)" : "(opcional)"}</span>
      </label>
      {dica && (
        <p id={idDica} className="text-[0.92rem] text-tinta/75">
          {dica}
        </p>
      )}
      {children({ id, "aria-describedby": descricao, "aria-invalid": erro ? true : undefined, className: classe })}
      {erro && (
        <p id={idErro} className="flex items-start gap-1.5 text-[0.95rem] font-medium text-maragato-escuro">
          <IconeAviso />
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}

export default function FormularioLojista({ idTitulo }: { idTitulo?: string }) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = Object.fromEntries(ORDEM.map((c) => [c, `${base}-${c}`])) as Record<keyof CamposLojista, string>;
  const [campos, setCampos] = useState<CamposLojista>(CAMPOS_VAZIOS);
  const [erros, setErros] = useState<ErrosLojista>({});
  const [tentou, setTentou] = useState(false);
  const [aviso, setAviso] = useState("");
  const [enviado, setEnviado] = useState<CamposLojista | null>(null);

  function mudar(campo: keyof CamposLojista, valor: string) {
    const proximos = { ...campos, [campo]: campo === "cnpj" ? mascararCnpj(valor) : valor };
    setCampos(proximos);
    if (tentou) setErros(validarLojista(proximos));
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTentou(true);
    const encontrados = validarLojista(campos);
    setErros(encontrados);
    const comErro = ORDEM.filter((c) => encontrados[c]);
    if (comErro.length > 0) {
      setEnviado(null);
      setAviso(comErro.length === 1 ? "Falta corrigir 1 campo antes de enviar." : `Falta corrigir ${comErro.length} campos antes de enviar.`);
      document.getElementById(ids[comErro[0]])?.focus();
      return;
    }
    setAviso("");
    cliqueWhatsApp("lojistas");
    const janela = window.open(linkLojista(campos), "_blank");
    if (janela) janela.opener = null;
    setEnviado({ ...campos });
  }

  return (
    <form noValidate onSubmit={enviar} aria-labelledby={idTitulo} className="flex flex-col gap-5">
      <Campo id={ids.loja} rotulo="Nome da loja" obrigatorio erro={erros.loja}>
        {(p) => (
          <input
            {...p}
            type="text"
            name="loja"
            required
            autoComplete="organization"
            value={campos.loja}
            onChange={(e) => mudar("loja", e.target.value)}
          />
        )}
      </Campo>

      <Campo id={ids.cnpj} rotulo="CNPJ" dica="Só os números; a gente coloca os pontos." erro={erros.cnpj}>
        {(p) => (
          <input
            {...p}
            type="text"
            name="cnpj"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00.000.000/0000-00"
            maxLength={18}
            value={campos.cnpj}
            onChange={(e) => mudar("cnpj", e.target.value)}
          />
        )}
      </Campo>

      <Campo id={ids.cidade} rotulo="Cidade" obrigatorio dica="Com o estado, se for fora do RS." erro={erros.cidade}>
        {(p) => (
          <input
            {...p}
            type="text"
            name="cidade"
            required
            autoComplete="address-level2"
            value={campos.cidade}
            onChange={(e) => mudar("cidade", e.target.value)}
          />
        )}
      </Campo>

      <Campo id={ids.responsavel} rotulo="Responsável" erro={erros.responsavel}>
        {(p) => (
          <input
            {...p}
            type="text"
            name="responsavel"
            autoComplete="name"
            value={campos.responsavel}
            onChange={(e) => mudar("responsavel", e.target.value)}
          />
        )}
      </Campo>

      <Campo id={ids.interesse} rotulo="O que você quer revender?" dica="Lenços, carijós, farroupilha, palas, cores..." erro={erros.interesse}>
        {(p) => (
          <textarea
            {...p}
            name="interesse"
            rows={4}
            value={campos.interesse}
            onChange={(e) => mudar("interesse", e.target.value)}
            className={`${p.className} min-h-28 resize-y`}
          />
        )}
      </Campo>

      {/* O aviso é lido pelo leitor de tela pela região fixa; a caixa visível não repete a leitura. */}
      <p role="alert" className="sr-only">
        {aviso}
      </p>
      {aviso && (
        <p
          aria-hidden="true"
          className="flex items-start gap-2 rounded-[var(--raio)] border border-maragato/50 bg-maragato/5 px-4 py-3 font-medium text-maragato-escuro"
        >
          <IconeAviso />
          <span>{aviso}</span>
        </p>
      )}

      <button type="submit" className="botao-whats w-full sm:w-auto sm:self-start">
        <IconeWhatsApp className="h-[1.35rem] w-[1.35rem]" />
        <span>Enviar pelo WhatsApp</span>
        <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
      </button>
      <p className="text-[0.92rem] text-tinta/75">
        Nada é enviado pelo site: o WhatsApp abre com a mensagem pronta e você confere antes de mandar.
      </p>

      {enviado && (
        <div role="status" className="costura secao-escura rounded-[var(--raio)] p-5 sm:p-6">
          <p className="font-medium text-creme">Abrimos o WhatsApp com a mensagem pronta.</p>
          <p className="mt-1 text-creme-2">Se ele não abriu, toque no botão:</p>
          <BotaoWhatsApp
            texto={mensagemLojista(dadosDoFormulario(enviado))}
            numero={numeroLojistas()}
            origem="lojistas"
            className="relative z-[1] mt-4"
          >
            Abrir o WhatsApp
          </BotaoWhatsApp>
        </div>
      )}
    </form>
  );
}
