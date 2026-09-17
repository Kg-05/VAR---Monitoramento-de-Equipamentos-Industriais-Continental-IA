#!/usr/bin/env bash
# =============================================================
# Diagnóstico da API — isola se o problema é da API ou da integração.
#
# Uso:
#   bash diagnostico-api.sh https://industrial-monitoring-api.onrender.com
#   bash diagnostico-api.sh http://localhost:3333
# =============================================================

BASE="${1:?Uso: bash diagnostico-api.sh <url-base-sem-/api/v1>}"
ORIGEM="${2:-https://var-kappa.vercel.app}"

echo "Base: $BASE"
echo "Origem simulada: $ORIGEM"
echo

# ── 1. A API está viva? ──────────────────────────────────────
# Atenção: no plano free do Render o primeiro pedido pode levar ~50s.
echo "── 1. Health check ──"
curl -s -o /dev/null -w "HTTP %{http_code} · %{time_total}s\n" "$BASE/health"
curl -s "$BASE/health"; echo; echo

# ── 2. O prefixo /api/v1 responde? ───────────────────────────
echo "── 2. Login (credenciais do seed) ──"
curl -s -i -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"adm@sistema.ao","senha":"Admin@123"}' \
  | head -30
echo; echo
# Esperado: 200 com { "success": true, "data": { "token": "...", ... } }
# 500 "secretOrPrivateKey must have a value" → JWT_SECRET em falta
# 404 → prefixo de rota errado
# 401 → seed não corrido nesta base de dados

# ── 3. O CORS deixa passar o domínio do front? ───────────────
echo "── 3. Preflight CORS ──"
curl -s -i -X OPTIONS "$BASE/api/v1/auth/login" \
  -H "Origin: $ORIGEM" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  | grep -i "^HTTP\|^access-control"
echo
# Esperado: access-control-allow-origin com o valor de $ORIGEM.
# Ausente → o browser bloqueia e o front vê "Network Error".

# ── 4. As migrations foram aplicadas? ────────────────────────
echo "── 4. Rota de listagem (existe tabela?) ──"
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$BASE/api/v1/empresas"
echo
# 500 com erro Prisma P2021/P1001 → migrations não aplicadas em produção.
# 200 sem token → confirma que a autenticação está desligada (Etapa 3).

echo "── Fim ──"
