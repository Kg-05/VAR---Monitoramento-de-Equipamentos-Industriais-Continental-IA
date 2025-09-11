# VAR---Monitoramento-de-Euipamentos-Continental-IA

## 📌 VAR – Plataforma de Monitoramento Inteligente

## O VAR-CONTINENTAL-IA é uma plataforma multifacetada desenvolvida pela KG KITUXI TECH em 2025

A solução faz uso de inteligência artificial aplicada ao reconhecimento, detecção e leitura de imagens.

Na sua essência, o VAR integra tecnologias de aprendizado de máquina com o objetivo de automatizar a análise visual e apoiar a tomada de decisões de forma eficiente e confiável.

## A plataforma foi projetada para

- Melhorar a segurança operacional

- Reforçar o controlo de acessos

- Garantir o registo sistemático de eventos

- Potenciar o monitoramento visual automático em diferentes cenários

Com essas capacidades, o VAR torna-se uma solução inovadora, adaptável e estratégica para organizações que buscam elevar os padrões de segurança, eficiência e inteligência operacional.

## 🚀 Tecnologias Utilizadas

- Node.js + Express → Backend da aplicação

- TypeScript → Tipagem estática e maior robustez

- Prisma ORM → Camada de acesso ao banco de dados

- PostgreSQL → Banco de dados relacional

- JWT (JSON Web Token) → Autenticação segura

- Bcrypt → Criptografia de senhas

- Middleware de Logs → Registo automático das ações dos usuários

- Cors & Dotenv → Configuração de segurança e variáveis de ambiente

## ⚙️ Instalação e Configuração

Clonar o repositório

git clone `https://github.com/seu-usuario/var-plataforma.git`
cd var-plataforma

---

## Instalar dependências

`npm install`

---

## Configurar o arquivo .env

DATABASE_URL="postgresql://usuario:senha@localhost:5432/var_db"
JWT_SECRET="sua_chave_secreta"
PORT=4000

---

## Rodar as migrações

`npx prisma migrate dev`

---

## Executar os seeds

`npx ts-node prisma/seed.ts`
`npx ts-node prisma/seed-admin.ts` (prioridade neste seed)

---

## Rodar o servidor

`npm run dev`

---

## 📌 Endpoints Principais

### Autenticação

- POST /auth/login → Login de usuário (retorna token JWT)

- Usuários

- GET /usuarios → Listar usuários (restrito conforme role)

- POST /usuarios → Criar usuário (Admin Central/Admin Empresa)

---

### Empresas

- GET /empresas → Listar empresas (Admin Central)

- POST /empresas → Criar empresa (Admin Central)

---

### Equipamentos / Dispositivos

- CRUD completo com permissões por nível de usuário

- Avarias / Alertas

- Registro e listagem, com geração automática de logs

---

## 🛡️ Permissões de Usuário

### ADMIN_CENTRAL

Gestão global de usuários, empresas, avarias, alertas, equipamentos, notificações, licenças, pagamentos e logs.

### ADMIN_EMPRESA

Gestão dos funcionários da sua empresa, equipamentos, avarias, alertas e informações da licença.

### FUNCIONARIO

Visualização dos equipamentos, envio e recebimento de alertas/notificações.

### 📊 Logs

Cada ação executada pelos usuários (criação, atualização, remoção, login, etc.) é registrada automaticamente no modelo Log.
Isso garante rastreabilidade e auditoria dentro da plataforma.

---

## 🤝 Contribuição

Faça um fork do projeto

Crie uma branch para a sua feature (git checkout -b feature/nome-feature)

Commit suas alterações (git commit -m 'feat: adiciona nova feature')

Envie para o repositório remoto (git push origin feature/nome-feature)

Abra um Pull Request

## 📜 Licença

Este projeto é de uso interno da KG KITUXI TECH e ainda não possui uma licença pública definida.

---

## 🧪 Exemplos de Requisições (Postman / HTTP)

🔑 Autenticação

### Login

POST <http://localhost:4000/auth/login>
Content-Type: application/json

{
  "email": "<admin@kgtech.com>",
  "senha": "123456"
}

✔️ Resposta esperada:

{
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}

### 👤 Usuários

- Listar Usuários (ADMIN_CENTRAL)

-- GET <http://localhost:4000/usuarios>
Authorization: Bearer {{TOKEN_ADMIN_CENTRAL}}

- Criar Usuário (ADMIN_EMPRESA ou ADMIN_CENTRAL)

-- POST <http://localhost:4000/usuarios>
Content-Type: application/json
Authorization: Bearer {{TOKEN_ADMIN_EMPRESA}}

{
  "nome": "Carlos Silva",
  "email": "<carlos@empresa.com>",
  "senha": "123456",
  "papel": "FUNCIONARIO",
  "empresaId": "empresa-uuid"
}

### 🏢 Empresas

- Listar Empresas (ADMIN_CENTRAL)

-- GET <http://localhost:4000/empresas>
Authorization: Bearer {{TOKEN_ADMIN_CENTRAL}}

- Criar Empresa (ADMIN_CENTRAL)

-- POST <http://localhost:4000/empresas>
Content-Type: application/json
Authorization: Bearer {{TOKEN_ADMIN_CENTRAL}}

{
  "nome": "Empresa XPTO",
  "nif": "123456789",
  "endereco": "Rua Principal 100, Luanda",
  "email": "<contato@empresa.com>",
  "telefone": "+244900000000"
}

### ⚙️ Equipamentos

- Criar Equipamento (ADMIN_EMPRESA)

-- POST <http://localhost:4000/equipamentos>
Content-Type: application/json
Authorization: Bearer {{TOKEN_ADMIN_EMPRESA}}

{
  "empresaId": "empresa-uuid",
  "nome": "Câmera 1",
  "localizacao": "Portaria",
  "descricao": "Câmera de vigilância"
}

### 🎥 Dispositivos

- Listar Dispositivos (FUNCIONARIO)

-- GET <http://localhost:4000/dispositivos?equipamentoId=uuid-equipamento>
Authorization: Bearer {{TOKEN_FUNCIONARIO}}

### 🚨 Alertas

- Criar Alerta (ADMIN_EMPRESA)

-- POST <http://localhost:4000/alertas>
Content-Type: application/json
Authorization: Bearer {{TOKEN_ADMIN_EMPRESA}}

{
  "avariaId": "uuid-avaria",
  "empresaId": "uuid-empresa",
  "mensagem": "Falha na câmera da portaria",
  "severidade": "ALTA"
}

### Reconhecer Alerta (FUNCIONARIO)

POST <http://localhost:4000/alertas/uuid-alerta/reconhecer>
Content-Type: application/json
Authorization: Bearer {{TOKEN_FUNCIONARIO}}

{
  "usuarioId": "uuid-funcionario"
}

### 📜 Logs

Listar Logs (ADMIN_CENTRAL)

GET <http://localhost:4000/logs>
Authorization: Bearer {{TOKEN_ADMIN_CENTRAL}}

---

⚡ Observação:

Sempre substitua {{TOKEN_...}} pelo token JWT obtido no login.

Os uuid devem ser substituídos pelos IDs reais gerados no banco.

API para gestão de empresas, usuários, equipamentos, dispositivos, avarias, alertas, licenças, pagamentos e logs.  
Desenvolvida em **Node.js + Express + Prisma + TypeScript** com autenticação JWT e controle de permissões por papéis de usuário
