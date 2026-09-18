// =============================================================
// Conversão de Decimal (Prisma) para number
//
// O tipo Decimal do Prisma serializa como STRING via JSON.stringify
// (o Decimal.js subjacente implementa toJSON() retornando string).
// Isso quebra silenciosamente qualquer consumidor que espere um
// number — cálculos no front tratam-no como concatenação de string,
// e bibliotecas de gráficos (Recharts) recebem eixo não-numérico.
//
// Regra: qualquer campo Decimal sai da API já como number.
// =============================================================
import type { Decimal } from '@prisma/client/runtime/library'

export function paraNumero(valor: Decimal | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0
  return typeof valor === 'number' ? valor : Number(valor)
}
