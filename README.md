# VAR — Industrial Monitoring API

API REST para a plataforma VAR de monitoramento de equipamentos industriais, com gestão multi-tenant de empresas, licenças, pagamentos e alertas. Serve três papéis: **ADM** (dono da plataforma), **Operacional** (equipa de suporte/gestão) e **Cliente** (empresas que usam a plataforma).

## Stack

- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Validação**: Zod
- **Auth**: JWT (jsonwebtoken) com revogação de sessão por `jti`
- **Segurança**: Helmet, express-rate-limit (login)
- **Testes**: Vitest + Supertest (250+ testes)

---

## Estrutura de pastas

```
src/
├── modules/
│   ├── auth/           # Login (com 2FA/TOTP opcional) e geração de token JWT
│   ├── empresa/        # CRUD de empresas (ADM/Operacional) — tenant "raiz"
│   ├── usuario/        # CRUD de usuários por papel, senha, avatar, sessões, permissões
│   ├── funcionario/     # Funcionários de uma empresa (não fazem login)
│   ├── equipamento/    # Equipamentos com alertas automáticos ao entrar em manutenção
│   ├── alerta/         # Alertas com filtragem multi-tenant
│   ├── licenca/        # Licenças com status calculado (Ativa/Expirada/Suspensa)
│   ├── pagamento/      # Pagamentos, confirmação e geração de fatura PDF
│   ├── documento/      # Documentos/comprovativos enviados por empresa
│   ├── plataforma/     # Configuração global da plataforma (nome, idioma, logótipo)
│   ├── backup/         # Exportar/restaurar backup dos dados (ADM)
│   ├── log/            # Auditoria de ações (quem fez o quê, IP, user-agent)
│   └── relatorio/      # Relatórios agregados (alertas, financeiro, licenças, equipamentos)
├── shared/
│   ├── database/       # Singleton PrismaClient
│   ├── errors/         # AppError e erros HTTP
│   ├── middlewares/    # auth, roles, tenant, validate, logger, error, rateLimit, upload
│   ├── types/          # Enums e extensão do Express Request
│   └── utils/          # Paginação, resposta, data, hash, status de licença, validadores angolanos
├── app.ts              # Configuração do Express (helmet, cors, rotas)
└── server.ts           # Entrada da aplicação
prisma/
├── schema.prisma       # Schema completo do banco
├── seed.ts             # Dados de demonstração (empresas, utilizadores, equipamentos...)
├── criar-admin.ts       # Cria a primeira conta ADM em produção, sem tocar no resto dos dados
└── elevate-admin.ts     # Promove um utilizador existente a ADM pelo email
```

---

## Instalação e execução (desenvolvimento)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# edita o .env com a tua DATABASE_URL e um JWT_SECRET forte
```

Ver a secção [Variáveis de ambiente](#variáveis-de-ambiente) abaixo para o significado de cada uma.

### 3. Criar o banco e aplicar migrations

```bash
npx prisma migrate dev
```

### 4. Popular com dados de demonstração (opcional, apaga tudo antes)

```bash
npm run db:seed
```

Ver credenciais criadas em [Autenticação](#autenticação).

### 5. Iniciar em modo desenvolvimento

```bash
npm run dev
```

A API fica disponível em `http://localhost:3333/api/v1`, com hot-reload via `tsx watch`.

---

## Variáveis de ambiente

| Variável         | Obrigatória | Descrição                                                                 |
|------------------|:-----------:|-----------------------------------------------------------------------------|
| `DATABASE_URL`   | Sim         | Connection string do PostgreSQL                                            |
| `JWT_SECRET`     | Sim         | Segredo para assinar os tokens — longo e aleatório em produção             |
| `JWT_EXPIRES_IN` | Não         | Validade do token de sessão (padrão `7d`)                                  |
| `PORT`           | Não         | Porta do servidor (padrão `3333`; a Railway define automaticamente)        |
| `NODE_ENV`       | Não         | `development` ou `production`                                              |
| `CORS_ORIGINS`   | Não         | Domínios extra (além de `localhost:3000`) autorizados a chamar a API, separados por vírgula |

---

## Papéis e permissões

| Papel        | Acesso                                                                 |
|--------------|-------------------------------------------------------------------------|
| ADM          | Acesso total — todas as rotas, config. da plataforma, backup            |
| Operacional  | Gere empresas Cliente, licenças, pagamentos, utilizadores Cliente e relatórios |
| Cliente      | Gere apenas dados da própria empresa (funcionários, equipamentos, alertas, pagamentos) — isolamento garantido por tenant scoping |

Cada rota sensível é protegida por `autorizar(...)` (restringe por papel) e/ou `escopoEmpresa` (força `empresaId` do utilizador Cliente em todas as consultas, impedindo acesso a dados de outra empresa mesmo manipulando o `:id` na URL).

---

## Segurança

- **Helmet** com `crossOriginResourcePolicy: cross-origin` (permite o frontend, noutro domínio, carregar avatares/documentos de `/uploads`).
- **Rate limit** no login (`/auth/login` e `/auth/login/totp`): 10 tentativas / 15 min por IP.
- **`trust proxy`** ativo — necessário atrás do proxy reverso da Railway (ou de qualquer outro), para o rate limit e os IPs registados nos logs serem corretos.
- **Sessões revogáveis**: cada token carrega um `jti` ligado a um registo `SessaoAtiva`; terminar sessão, trocar de senha (redefinida por ADM/Operacional) ou usar "Encerrar sessão" invalida o token imediatamente, mesmo que ainda não tenha expirado.
- **2FA (TOTP)** opcional por utilizador.
- **Validação de dados angolanos**: NIF (empresa ou individual) e telefone (fixo/móvel, com ou sem `+244`) validados no cadastro de empresas e funcionários — ver `src/shared/utils/validadoresAngola.ts`.

---

## Autenticação

Todas as rotas (exceto `/auth/login`, `/auth/login/totp` e `/health`) requerem o header:

```
Authorization: Bearer <token>
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@kgtech.com",
  "senha": "Admin@123"
}
```

Se a conta tiver 2FA ativo, a resposta devolve `{ totpRequerido: true, usuarioId }` e o segundo passo é `POST /auth/login/totp`.

**Credenciais criadas pelo `npm run db:seed`:**

| Papel       | Email                          | Senha        |
|-------------|---------------------------------|--------------|
| ADM         | admin@kgtech.com               | Admin@123    |
| ADM         | adriana.costa@kgtech.com       | Admin@123    |
| Operacional | operacional@sistema.ao         | Oper@123     |
| Cliente     | gestor@sonangol-refinaria.ao   | Cliente@123  |
| Cliente     | gestor@taag-manutencao.ao      | Cliente@123  |
| Cliente     | gestor@endiama-proc.ao         | Cliente@123  |
| Cliente     | gestor@unitel.co.ao            | Cliente@123  |
| Cliente     | gestor@bancobai.ao             | Cliente@123  |
| Cliente     | gestor@ensa.co.ao              | Cliente@123  |
| Cliente     | gestor@refriango.ao            | Cliente@123  |
| Cliente     | gestor@portoluanda.ao          | Cliente@123  |

Em produção, cria a primeira conta ADM real sem tocar em mais nada (o seed apaga tudo, nunca corras contra produção):

```bash
npx tsx prisma/criar-admin.ts <email> <nome> <senha>
```

---

## Rotas principais

### Empresas
```
GET    /api/v1/empresas
GET    /api/v1/empresas/dashboard/resumo
POST   /api/v1/empresas
GET    /api/v1/empresas/:id
PATCH  /api/v1/empresas/:id
PATCH  /api/v1/empresas/:id/ativar
DELETE /api/v1/empresas/:id
```

### Usuários
```
GET    /api/v1/usuarios
GET    /api/v1/usuarios/online
POST   /api/v1/usuarios
GET    /api/v1/usuarios/:id
PATCH  /api/v1/usuarios/:id
DELETE /api/v1/usuarios/:id
PATCH  /api/v1/usuarios/:id/senha              # próprio utilizador, exige senha atual
PATCH  /api/v1/usuarios/:id/redefinir-senha    # ADM/Operacional repõem sem senha atual
PATCH  /api/v1/usuarios/:id/avatar
PATCH  /api/v1/usuarios/:id/notificacao
PATCH  /api/v1/usuarios/:id/permissoes
POST   /api/v1/usuarios/:id/totp/gerar
POST   /api/v1/usuarios/:id/totp/ativar
DELETE /api/v1/usuarios/:id/totp
GET    /api/v1/usuarios/:id/sessoes
DELETE /api/v1/usuarios/:id/sessoes/:sessaoId
```

### Funcionários
```
GET    /api/v1/funcionarios
POST   /api/v1/funcionarios
GET    /api/v1/funcionarios/:id
PATCH  /api/v1/funcionarios/:id
DELETE /api/v1/funcionarios/:id
```

### Equipamentos
```
GET    /api/v1/equipamentos
POST   /api/v1/equipamentos
GET    /api/v1/equipamentos/:id
PATCH  /api/v1/equipamentos/:id
DELETE /api/v1/equipamentos/:id
```

### Alertas
```
GET    /api/v1/alertas
POST   /api/v1/alertas
GET    /api/v1/alertas/resumo
GET    /api/v1/alertas/nao-lidos
GET    /api/v1/alertas/:id
PATCH  /api/v1/alertas/:id/ler
DELETE /api/v1/alertas/:id
```

### Licenças
```
GET    /api/v1/licencas
POST   /api/v1/licencas
GET    /api/v1/licencas/:id
PATCH  /api/v1/licencas/:id
```

### Pagamentos
```
GET    /api/v1/pagamentos
POST   /api/v1/pagamentos
GET    /api/v1/pagamentos/:id
GET    /api/v1/pagamentos/:id/fatura   # PDF
PATCH  /api/v1/pagamentos/:id
```

### Documentos
```
GET    /api/v1/documentos
GET    /api/v1/documentos/resumo
POST   /api/v1/documentos
PATCH  /api/v1/documentos/:id/lido
PATCH  /api/v1/documentos/:id/arquivar
DELETE /api/v1/documentos/:id
```

### Plataforma (ADM)
```
GET    /api/v1/plataforma
PATCH  /api/v1/plataforma
PATCH  /api/v1/plataforma/logotipo
```

### Backup (ADM)
```
GET    /api/v1/backup/exportar
POST   /api/v1/backup/restaurar
```

### Logs (auditoria)
```
GET    /api/v1/logs
```

### Relatórios (ADM/Operacional)
```
GET    /api/v1/relatorios/alertas
GET    /api/v1/relatorios/equipamentos
GET    /api/v1/relatorios/financeiro
GET    /api/v1/relatorios/licencas
```

### Saúde
```
GET    /health
```

---

## Paginação

Todas as rotas de listagem aceitam:

```
?page=1&limit=20
```

Resposta paginada:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Scripts disponíveis

```bash
npm run dev             # Desenvolvimento com hot-reload
npm run build           # Compilar para /dist
npm run start           # Aplicar migrations + iniciar build de produção
npm run db:migrate      # Criar/aplicar migration (dev)
npm run db:deploy       # Aplicar migrations pendentes (produção)
npm run db:generate     # Gerar o Prisma Client
npm run db:seed         # Popular banco com dados de demonstração (apaga tudo antes)
npm run db:criar-admin  # Criar a primeira conta ADM em produção, sem apagar dados
npm run db:elevate-admin # Promover um utilizador existente a ADM
npm run db:studio       # Abrir Prisma Studio
npm run db:reset        # Resetar banco + seed
npm run test            # Executar testes (Vitest)
npm run lint            # Verificar tipos TypeScript
```

---

## Padrão de resposta

**Sucesso:**
```json
{ "success": true, "data": { ... } }
```

**Erro:**
```json
{ "success": false, "message": "Descrição do erro" }
```

**Validação:**
```json
{
  "success": false,
  "message": "NIF inválido — usa o formato de empresa (9-10 dígitos) ou individual (ex: 003456789LA042)",
  "errors": { "cnpj": ["NIF inválido — ..."] }
}
```

---

## Deploy em produção

Backend hospedado na [Railway](https://railway.com), com PostgreSQL como plugin do mesmo projeto. O `npm start` corre `prisma migrate deploy` antes de arrancar o servidor, por isso as migrations aplicam-se automaticamente em cada deploy — nunca corras `db:seed` contra a base de dados de produção.

Frontend (Next.js) hospedado no [Vercel](https://vercel.com), num repositório separado.
