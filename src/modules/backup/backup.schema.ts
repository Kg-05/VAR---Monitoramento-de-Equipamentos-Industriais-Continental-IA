import { z } from 'zod'

// Só confirma a forma geral do ficheiro (um objecto "dados" com as
// colecções esperadas, cada uma sendo uma lista de objectos) — a
// validação fina de cada campo já é feita pelo próprio Prisma ao
// gravar (tipos, obrigatoriedade), e esta rota já exige papel ADM.
const colecao = z.array(z.record(z.string(), z.unknown())).optional()

export const restaurarBackupSchema = z.object({
  geradoEm: z.string().optional(),
  versao:   z.number().optional(),
  dados: z.object({
    empresas:     colecao,
    usuarios:     colecao,
    funcionarios: colecao,
    equipamentos: colecao,
    licencas:     colecao,
    pagamentos:   colecao,
    documentos:   colecao,
    alertas:      colecao,
  }),
})
