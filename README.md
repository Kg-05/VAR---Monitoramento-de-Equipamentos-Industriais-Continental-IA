# Industrial Monitoring API

API REST para monitoramento de equipamentos industriais com gestão multi-tenant de empresas, licenças e alertas.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Validação**: Zod
- **Auth**: JWT (jsonwebtoken)
- **Testes**: Vitest + Supertest

---

## Estrutura de pastas

```
src/
├── modules/
│   ├── auth/           # Login e geração de token JWT
│   ├── empresa/        # CRUD de empresas (ADM)
│   ├── usuario/        # CRUD de usuários por papel
│   ├── funcionario/    # Funcionários com limite por licença
│   ├── equipamento/    # Equipamentos com alertas automáticos
│   ├── alerta/         # Alertas com filtragem multi-tenant
│   ├── licenca/        # Licenças com status calculado
│   ├── pagamento/      # Pagamentos com activação de licença
│   ├── log/            # Auditoria de acções (só ADM)
│   └── relatorio/      # Relatórios agregados
├── shared/
│   ├── database/       # Singleton PrismaClient
│   ├── errors/         # AppError e erros HTTP
│   ├── middlewares/    # auth, roles, tenant, validate, logger, error
│   ├── types/          # Enums e extensão do Express Request
│   └── utils/          # Paginação, resposta, data, hash
├── app.ts              # Configuração do Express
└── server.ts           # Entrada da aplicação
prisma/
├── schema.prisma       # Schema completo do banco
└── seed.ts             # Dados iniciais
```

---

## Instalação e execução

### 1. Clonar e instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# edite .env com sua DATABASE_URL e JWT_SECRET
```

### 3. Criar o banco e aplicar migrations

```bash
npx prisma migrate dev --name init
```

### 4. Popular com dados de exemplo

```bash
npm run db:seed
```

### 5. Iniciar em modo desenvolvimento

```bash
npm run dev
```

A API estará disponível em `http://localhost:3333/api/v1`

---

## Papéis e permissões

| Papel        | Acesso                                                      |
|--------------|-------------------------------------------------------------|
| ADM          | Acesso total — todas as rotas                               |
| Operacional  | Gere clientes, licenças, pagamentos e relatórios            |
| Cliente      | Gere apenas dados da sua própria empresa (multi-tenant)     |

---

## Autenticação

Todas as rotas (excepto `/auth/login` e `/health`) requerem o header:

```
Authorization: Bearer <token>
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "adm@sistema.ao",
  "senha": "Admin@123"
}
```

**Credenciais do seed:**

| Papel       | Email                              | Senha         |
|-------------|------------------------------------|---------------|
| ADM         | adm@sistema.ao                     | Admin@123     |
| Operacional | operacional@sistema.ao             | Oper@123      |
| Cliente A   | gestor@sonangol-refinaria.ao       | Cliente@123   |
| Cliente B   | gestor@taag-manutencao.ao          | Cliente@123   |
| Cliente C   | gestor@endiama-proc.ao             | Cliente@123   |

---

## Rotas principais

### Empresas
```
GET    /api/v1/empresas
POST   /api/v1/empresas
GET    /api/v1/empresas/:id
PATCH  /api/v1/empresas/:id
DELETE /api/v1/empresas/:id
```

### Usuários
```
GET    /api/v1/usuarios
POST   /api/v1/usuarios
GET    /api/v1/usuarios/:id
PATCH  /api/v1/usuarios/:id
DELETE /api/v1/usuarios/:id
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
PATCH  /api/v1/pagamentos/:id
```

### Logs (ADM apenas)
```
GET    /api/v1/logs
```

### Relatórios
```
GET    /api/v1/relatorios/alertas
GET    /api/v1/relatorios/financeiro
GET    /api/v1/relatorios/licencas
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
npm run dev          # Desenvolvimento com hot-reload
npm run build        # Compilar para /dist
npm run start        # Iniciar build de produção
npm run db:migrate   # Aplicar migrations
npm run db:seed      # Popular banco com dados de teste
npm run db:studio    # Abrir Prisma Studio
npm run db:reset     # Resetar banco + seed
npm run test         # Executar testes
npm run lint         # Verificar tipos TypeScript
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
  "message": "Dados inválidos",
  "errors": { "campo": ["mensagem de erro"] }
}
```
