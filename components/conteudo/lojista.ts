// Regras do formulário "Para lojistas": máscara do CNPJ, validação e o link
// do WhatsApp. Funções puras, testadas em tests/institucional.test.tsx.

import { linkWhatsApp, mensagemLojista, numeroLojistas, type DadosLojista } from "../../lib/whatsapp";

export type CamposLojista = {
  loja: string;
  cnpj: string;
  cidade: string;
  responsavel: string;
  interesse: string;
};

export type ErrosLojista = Partial<Record<keyof CamposLojista, string>>;

export const CAMPOS_VAZIOS: CamposLojista = { loja: "", cnpj: "", cidade: "", responsavel: "", interesse: "" };

/** "00607826000113" -> "00.607.826/0001-13". Aceita digitação parcial e ignora o que não é número. */
export function mascararCnpj(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/*
 * Validação simples. Obrigatórios: nome da loja e cidade. O CNPJ é opcional;
 * se vier, precisa ter os 14 números (não conferimos os dígitos verificadores:
 * quem confere o cadastro é a Republicasul, na conversa).
 */
export function validarLojista(campos: CamposLojista): ErrosLojista {
  const erros: ErrosLojista = {};
  if (!campos.loja.trim()) erros.loja = "Escreva o nome da loja.";
  const digitos = campos.cnpj.replace(/\D/g, "");
  if (digitos.length > 0 && digitos.length !== 14) erros.cnpj = "Confira o CNPJ: são 14 números. Se preferir, deixe em branco.";
  if (!campos.cidade.trim()) erros.cidade = "Escreva a cidade da loja.";
  return erros;
}

export function dadosDoFormulario(campos: CamposLojista): DadosLojista {
  return {
    loja: campos.loja,
    cnpj: campos.cnpj.replace(/\D/g, "") ? mascararCnpj(campos.cnpj) : undefined,
    cidade: campos.cidade,
    responsavel: campos.responsavel,
    interesse: campos.interesse,
  };
}

/** Link do WhatsApp dos lojistas com a mensagem pronta (numeroLojistas()). */
export function linkLojista(campos: CamposLojista): string {
  return linkWhatsApp(mensagemLojista(dadosDoFormulario(campos)), numeroLojistas());
}
