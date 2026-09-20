import { describe, it, expect } from 'vitest'
import { ehNifAngolanoValido, ehTelefoneAngolanoValido, nifAngolanoSchema, telefoneAngolanoSchema } from '../../src/shared/utils/validadoresAngola'

describe('validadoresAngola', () => {
  describe('ehNifAngolanoValido', () => {
    it('aceita NIF de empresa com 9 ou 10 dígitos', () => {
      expect(ehNifAngolanoValido('5417105938')).toBe(true)
      expect(ehNifAngolanoValido('541710593')).toBe(true)
    })
    it('aceita NIF individual (dígitos + letras da província + dígitos)', () => {
      expect(ehNifAngolanoValido('003456789LA042')).toBe(true)
    })
    it('ignora pontuação comum ao validar', () => {
      expect(ehNifAngolanoValido('5417.105.938')).toBe(true)
    })
    it('rejeita formatos que não são angolanos (ex: CNPJ brasileiro)', () => {
      expect(ehNifAngolanoValido('00.000.000/0001-01')).toBe(false)
    })
    it('rejeita valores demasiado curtos ou vazios', () => {
      expect(ehNifAngolanoValido('12345')).toBe(false)
      expect(ehNifAngolanoValido('')).toBe(false)
    })
  })

  describe('ehTelefoneAngolanoValido', () => {
    it('aceita móvel e fixo, com ou sem +244', () => {
      expect(ehTelefoneAngolanoValido('+244 923 000 001')).toBe(true)
      expect(ehTelefoneAngolanoValido('923000001')).toBe(true)
      expect(ehTelefoneAngolanoValido('+244 222 000 001')).toBe(true)
    })
    it('rejeita números de outros países', () => {
      expect(ehTelefoneAngolanoValido('+351 923 000 001')).toBe(false)
    })
    it('rejeita números com dígito inicial inválido', () => {
      expect(ehTelefoneAngolanoValido('123000001')).toBe(false)
    })
  })

  describe('nifAngolanoSchema', () => {
    it('rejeita string vazia com mensagem própria', () => {
      const r = nifAngolanoSchema.safeParse('')
      expect(r.success).toBe(false)
    })
  })

  describe('telefoneAngolanoSchema', () => {
    it('permite string vazia (campo opcional)', () => {
      expect(telefoneAngolanoSchema.safeParse('').success).toBe(true)
    })
    it('rejeita um telefone mal formatado', () => {
      expect(telefoneAngolanoSchema.safeParse('abc').success).toBe(false)
    })
  })
})
