import { z } from 'zod'

// NIF de pessoa coletiva (empresa): 9 ou 10 dígitos.
const NIF_EMPRESA_REGEX = /^\d{9,10}$/

// NIF de pessoa singular, derivado do número do Bilhete de Identidade:
// 8-9 dígitos + 2 letras (código da província) + 3 dígitos. Ex: 003456789LA042.
const NIF_INDIVIDUAL_REGEX = /^\d{8,9}[A-Za-z]{2}\d{3}$/

export function ehNifAngolanoValido(valor: string): boolean {
  const limpo = valor.replace(/[\s.\-/]/g, '')
  return NIF_EMPRESA_REGEX.test(limpo) || NIF_INDIVIDUAL_REGEX.test(limpo)
}

// Telefone angolano: código do país opcional (+244), seguido de 9 dígitos
// começados por 2 (fixo) ou 9 (móvel). Espaços/pontos/traços são ignorados.
const TELEFONE_ANGOLA_REGEX = /^(\+?244)?[29]\d{8}$/

export function ehTelefoneAngolanoValido(valor: string): boolean {
  const limpo = valor.replace(/[\s.\-]/g, '')
  return TELEFONE_ANGOLA_REGEX.test(limpo)
}

export const nifAngolanoSchema = z
  .string()
  .trim()
  .min(1, 'NIF é obrigatório')
  .refine(ehNifAngolanoValido, {
    message: 'NIF inválido — usa o formato de empresa (9-10 dígitos) ou individual (ex: 003456789LA042)',
  })

// Aceita string vazia (campo opcional não preenchido) além de um telefone válido.
export const telefoneAngolanoSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || ehTelefoneAngolanoValido(v), {
    message: 'Telefone inválido — usa o formato angolano, ex: +244 923 000 000',
  })
