# Contrato da API — Industrial Monitoring API

> Fonte de verdade para o front-end. Qualquer divergência entre este
> documento e o código é um bug — a API é que está errada, não a
> documentação, salvo indicação em contrário.
>
> Base URL: `{HOST}/api/v1`
> Local: `http://localhost:3333/api/v1`

---

## Envelope de resposta

Três formas possíveis, e só três:

```jsonc
// Sucesso, item único
{ "success": true, "data": { /* T */ } }

// Sucesso, listagem paginada
{
  "success": true,
  "data": [ /* T[] */ ],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}

// Erro
{ "success": false, "message": "Descrição do erro" }

// Erro de validação (Zod)
{
  "success": false,
  "message": "Dados inválidos",
  "errors": { "campo": ["mensagem de erro"] }
}
```

`data` e `meta` estão sempre ao mesmo nível — nunca `data.data`.
Rotas de exclusão (`DELETE`) devolvem `204 No Content`, sem corpo.

### Paginação — parâmetros de query

Todas as rotas de listagem aceitam:

| Parâmetro | Tipo | Default | Notas |
|---|---|---|---|
| `page` | number | `1` | mínimo 1 |
| `limit` | number | `20` | máximo 100 |

---

## Autenticação

> ⚠️ **Estado actual (pré-Etapa 3): nenhuma rota valida o token.**
> O header abaixo é o contrato-alvo; até a Etapa 3 estar concluída,
> as rotas aceitam pedidos sem ele (excepto `equipamentos`, já religada).

Rotas autenticadas exigem:

```
Authorization: Bearer <token>
```

### `POST /auth/login`

**Body:**
```json
{ "email": "adm@sistema.ao", "senha": "Admin@123" }
```
`senha` mínimo 6 caracteres.

**Resposta `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "usuario": { "id": "uuid", "nome": "...", "email": "...", "papel": "ADM", "empresaId": null }
  }
}
```

**Erros:** `401` credenciais inválidas · `400` corpo inválido.

---

## Papéis e escopo

| Papel | Acesso |
|---|---|
| `ADM` | Total |
| `Operacional` | Empresas, licenças, pagamentos, relatórios |
| `Cliente` | Apenas dados da própria `empresaId` (aplicado por `escopoEmpresa`) |

---

## Empresas

| Método | Rota | Auth alvo |
|---|---|---|
| GET | `/empresas` | ADM, Operacional |
| GET | `/empresas/dashboard/resumo` | ADM, Operacional |
| GET | `/empresas/:id` | ADM, Operacional, Cliente (própria) |
| POST | `/empresas` | ADM |
| PATCH | `/empresas/:id` | ADM |
| PATCH | `/empresas/:id/ativar` | ADM |
| DELETE | `/empresas/:id` | ADM — desactiva (soft), devolve `204` |

**Entidade `Empresa`:**
```ts
{
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string | null
  status: 'Ativo' | 'Inativo'
  criadoEm: string        // ISO 8601
  _count?: { funcionarios: number; equipamentos: number }  // só em GET /empresas
}
```

**Query de listagem:** `page`, `limit`.

---

## Usuários

| Método | Rota |
|---|---|
| GET | `/usuarios` |
| GET | `/usuarios/:id` |
| POST | `/usuarios` |
| PATCH | `/usuarios/:id` |
| DELETE | `/usuarios/:id` |

**Body de criação:**
```ts
{
  email: string          // formato de email
  nome: string            // mín. 2 caracteres
  senha: string            // mín. 6 caracteres
  papel: 'ADM' | 'Operacional' | 'Cliente'
  empresaId?: string      // uuid — obrigatório se papel === 'Cliente'
}
```

**Body de actualização** (todos opcionais): `nome`, `email`, `status: 'Ativo' | 'Inativo'`.
Não é possível alterar `papel` nem `senha` por esta rota.

**Entidade `Usuario`:**
```ts
{
  id: string
  nome: string
  email: string
  papel: 'ADM' | 'Operacional' | 'Cliente'
  status: 'Ativo' | 'Inativo'
  empresaId: string | null
  empresa?: { id: string; nome: string }
  criadoEm: string
}
```
`senhaHash` nunca é devolvido.

---

## Funcionários

| Método | Rota |
|---|---|
| GET | `/funcionarios` |
| GET | `/funcionarios/:id` |
| POST | `/funcionarios` |
| PATCH | `/funcionarios/:id` |
| DELETE | `/funcionarios/:id` |

**Body de criação:**
```ts
{
  nome: string       // mín. 2
  email: string
  cargo: string       // mín. 2
  telefone?: string
  empresaId?: string  // preenchido automaticamente pelo escopo se o utilizador for Cliente
}
```

**Entidade `Funcionario`:**
```ts
{
  id: string; nome: string; email: string; cargo: string
  telefone: string | null
  status: 'Ativo' | 'Inativo' | 'Pendente'
  empresaId: string
  criadoEm: string
}
```

> Regra de negócio: o número de funcionários activos está limitado pelo
> `maxDeFuncionarios` da licença da empresa. A criação falha com `409`
> se o limite for excedido.

---

## Equipamentos

*(único módulo já com `autenticar` + `escopoEmpresa` ligados)*

| Método | Rota | Extra |
|---|---|---|
| GET | `/equipamentos` | |
| GET | `/equipamentos/:id` | |
| POST | `/equipamentos` | valida `criarEquipamentoSchema` |
| PATCH | `/equipamentos/:id` | valida `atualizarEquipamentoSchema` |
| DELETE | `/equipamentos/:id` | só ADM/Operacional |

**Body de criação:**
```ts
{
  nome: string        // mín. 2
  modelo: string        // mín. 1
  fabricante?: string
  numeroSerie?: string
  localizacao: string    // mín. 2
  empresaId?: string    // uuid — preenchido pelo escopo se Cliente
}
```

**Entidade `Equipamento`:**
```ts
{
  id: string; nome: string; modelo: string
  fabricante: string | null
  numeroSerie: string | null
  localizacao: string
  status: 'Operacional' | 'Manutencao'
  empresaId: string
  criadoEm: string
  _count?: { alertas: number }
}
```

> Regra de negócio: transitar `status` para `Manutencao` dispara a
> criação automática de um `Alerta`.

---

## Alertas

| Método | Rota |
|---|---|
| GET | `/alertas/resumo` |
| GET | `/alertas/nao-lidos` |
| GET | `/alertas` |
| GET | `/alertas/:id` |
| POST | `/alertas` |
| PATCH | `/alertas/:id/ler` |
| DELETE | `/alertas/:id` |

**Body de criação:**
```ts
{
  equipamentoId: string      // uuid
  descricao: string          // mín. 5
  nivel: 'razoavel' | 'medio' | 'critico'
  empresaId?: string
}
```

**Entidade `Alerta`:**
```ts
{
  id: string; descricao: string
  nivel: 'razoavel' | 'medio' | 'critico'
  lidoEm: string | null
  criadoEm: string
  empresaId: string
  equipamentoId: string
  lidoPorId: string | null
  equipamento?: { id: string; nome: string; localizacao: string }
  lidoPor?: { id: string; nome: string } | null
}
```

`PATCH /alertas/:id/ler` não recebe body; marca `lidoEm` e `lidoPorId` com o utilizador autenticado.

---

## Licenças

| Método | Rota |
|---|---|
| GET | `/licencas` |
| GET | `/licencas/:id` |
| POST | `/licencas` |
| PATCH | `/licencas/:id` |

**Body de criação:**
```ts
{
  empresaId: string
  plano: 'Basico' | 'Profissional' | 'Premium'
  maxDeFuncionarios: number   // inteiro positivo
  inicioEm: string             // data, aceita coerção
  expiraEm: string
  observacoes?: string
}
```

**Entidade `Licenca`:**
```ts
{
  id: string
  plano: 'Basico' | 'Profissional' | 'Premium'
  status: 'Ativa' | 'Expirada' | 'Suspensa'      // valor gravado na BD
  statusCalculado: 'Ativa' | 'Expirada' | 'Suspensa'  // ← usar este no front
  diasRestantes: number
  maxDeFuncionarios: number
  inicioEm: string
  expiraEm: string
  empresaId: string
}
```

> **Importante:** `status` é o valor bruto da base de dados;
> `statusCalculado` é a verdade — combina `status` com a data actual
> (ver princípio "status calculado em runtime"). O front deve exibir
> sempre `statusCalculado`, nunca `status`.
>
> O filtro `?status=` na listagem compara contra `statusCalculado`,
> não contra a coluna bruta.

---

## Pagamentos

| Método | Rota |
|---|---|
| GET | `/pagamentos` |
| GET | `/pagamentos/:id` |
| POST | `/pagamentos` |
| PATCH | `/pagamentos/:id` |

**Body de criação:**
```ts
{
  empresaId: string
  licencaId: string
  valor: number      // positivo
  moeda?: string      // default "AOA"
  referencia?: string
}
```

**Entidade `Pagamento`:**
```ts
{
  id: string
  valor: number        // ← number, garantido pela API (ver nota abaixo)
  moeda: string
  status: 'Pendente' | 'Concluido' | 'Reembolsado'
  referencia: string | null
  criadoEm: string
  empresaId: string
  licencaId: string
  empresa?: { id: string; nome: string }
  licenca?: { id: string; plano: string }
}
```

> **Nota de implementação:** `valor` é `Decimal` no Prisma, que por
> omissão serializa como *string* em JSON. O serviço converte
> explicitamente com `paraNumero()` (`shared/utils/decimal.ts`) antes
> de devolver — qualquer novo endpoint que leia `valor` de um
> `Pagamento` tem de fazer o mesmo, ou o contrato quebra em silêncio.

> Regra de negócio: `PATCH` com `status: "Concluido"` activa ou renova
> a licença associada automaticamente.

---

## Logs

*(apenas ADM)*

| Método | Rota |
|---|---|
| GET | `/logs` |

```ts
{ id: string; acao: string; criadoEm: string; usuarioId?: string; empresaId?: string }
```

---

## Documentos

| Método | Rota |
|---|---|
| GET | `/documentos/resumo` |
| GET | `/documentos` |
| POST | `/documentos` | `multipart/form-data`, campo `arquivo` |
| PATCH | `/documentos/:id/lido` |
| PATCH | `/documentos/:id/arquivar` |
| DELETE | `/documentos/:id` |

> ⚠️ Upload grava em `process.cwd()/uploads/` — filesystem efémero no
> Render. Ver Etapa 6, item de migração para storage externo.

---

## Relatórios

*(apenas leitura, agregações)*

| Método | Rota | Query |
|---|---|---|
| GET | `/relatorios/alertas` | `empresaId?`, `dataInicio?`, `dataFim?` |
| GET | `/relatorios/equipamentos` | idem |
| GET | `/relatorios/financeiro` | idem |
| GET | `/relatorios/licencas` | idem |

**`GET /relatorios/financeiro` — forma da resposta:**
```ts
{
  receitaTotal: number
  porStatus: Array<{ status: string; total: number; valor: number }>
  topEmpresas: Array<{ empresa: { id: string; nome: string }; valorPago: number }>
}
```
(não é paginado — vem em `data` directamente, sem `meta`)

---

## Health check

```
GET /health   →  200  { "status": "ok", "timestamp": "..." }
```
Não requer autenticação. Não tem prefixo `/api/v1`.

---

## Códigos de erro comuns

| Código | Significado |
|---|---|
| `400` | Corpo ou query inválidos (Zod) |
| `401` | Sem token, token inválido/expirado, ou credenciais erradas no login |
| `403` | Autenticado, mas sem permissão para o papel/empresa |
| `404` | Recurso não encontrado |
| `409` | Conflito de regra de negócio (ex: limite de funcionários, licença duplicada) |
| `500` | Erro não tratado — deve ser reportado, nunca esperado |

---

## Histórico de mudanças a este contrato

| Data | Mudança |
|---|---|
| Etapa 2 | Corrigido duplo-embrulho de `data` nas listagens (`paginado()` substituiu `success()` nas 9 rotas afectadas) |
| Etapa 2 | `Pagamento.valor` e agregações financeiras passam a `number` (antes: string, por serialização de `Decimal`) |
| Etapa 2 | `utils/unwrap.ts` do front removido — deixou de ser necessário |
