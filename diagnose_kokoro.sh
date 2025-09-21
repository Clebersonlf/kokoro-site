#!/usr/bin/env bash
set -euo pipefail

GREEN="\033[1;32m"; RED="\033[1;31m"; YELLOW="\033[1;33m"; CYAN="\033[1;36m"; NC="\033[0m"
pass(){ printf "${GREEN}✔ %s${NC}\n" "$*"; }
fail(){ printf "${RED}✘ %s${NC}\n" "$*"; }
warn(){ printf "${YELLOW}⚠ %s${NC}\n" "$*"; }
info(){ printf "${CYAN}— %s${NC}\n" "$*"; }

command -v jq >/dev/null || { echo "Instale jq: sudo apt-get install -y jq"; exit 1; }
command -v psql >/dev/null || { echo "Instale psql: sudo apt-get update && sudo apt-get install -y postgresql-client"; exit 1; }
command -v vercel >/dev/null || { echo "Instale Vercel CLI: npm i -g vercel"; exit 1; }
command -v curl >/dev/null || { echo "cURL não encontrado"; exit 1; }

info "Carregando variáveis (.env.local via Vercel)..."
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local || true; set +a

ADMIN_SECRET="${ADMIN_SECRET:-}"
BASE_URL="${BASE_URL:-https://www.planckkokoro.com}"

CONN="${POSTGRES_URL_NON_POOLING:-}"
[ -z "$CONN" ] && CONN="${DATABASE_URL:-}"
[ -z "$CONN" ] && CONN="${POSTGRES_URL:-}"

info "Checando ENV critical (Admin/DB/Mensageria)..."
[ -n "$ADMIN_SECRET" ] && pass "ADMIN_SECRET presente" || fail "ADMIN_SECRET ausente"
[ -n "$CONN" ] && pass "URL do Postgres presente" || fail "URL do Postgres ausente"

[ -n "${RESEND_API_KEY:-}" ] || warn "RESEND_API_KEY ausente"
[ -n "${TWILIO_ACCOUNT_SID:-}" ] || warn "TWILIO_* ausente"
[ -n "${TWILIO_FROM_WA:-}" ] || warn "TWILIO_FROM_WA ausente"
[ -n "${TWILIO_FROM_SMS:-}" ] || warn "TWILIO_FROM_SMS ausente"
[ -n "${WHATSAPP_API_TOKEN:-}" ] || warn "WHATSAPP_API_TOKEN ausente (se usar Meta WABA)"

info "Testando conexão com o banco..."
psql "$CONN" -c "SELECT now();" >/dev/null && pass "Conectou no Postgres"

info "Checando tabelas/chaves do domínio..."
for t in professores alunos matriculas pagamentos pagamentos_professor settings; do
  psql "$CONN" -c "SELECT 1 FROM $t LIMIT 1;" >/dev/null && pass "Tabela $t existe" || fail "Tabela $t faltando"
done

for c in pix_chave banco_nome agencia conta favorecido_nome doc_favorecido; do
  psql "$CONN" -c "SELECT 1 FROM information_schema.columns WHERE table_name='professores' AND column_name='$c';" | grep -q 1 && pass "professores.$c OK" || warn "professores.$c AUSENTE"
done

psql "$CONN" -c "SELECT value FROM settings WHERE key='org_pix_chave';" >/dev/null && pass "settings.org_pix_chave ok"

info "Checando views..."
for v in vw_saldo_professor vw_extrato_professor; do
  psql "$CONN" -c "SELECT 1 FROM pg_views WHERE viewname='$v';" | grep -q 1 && pass "$v existe" || warn "$v ausente"
done

info "Pingando APIs (GET/sem efeito colateral)..."
curl -s "$BASE_URL/api/admin/check" -H "x-admin-secret: $ADMIN_SECRET" | jq . >/dev/null && pass "GET /api/admin/check (ok/match=true)"
curl -s "$BASE_URL/api/financeiro/preview" | jq . >/dev/null && pass "GET /api/financeiro/preview"
curl -s "$BASE_URL/api/financeiro/saldo-professor" -H "x-admin-secret: $ADMIN_SECRET" | jq . >/dev/null && pass "GET /api/financeiro/saldo-professor"

info "Sumário:"
echo " - Ambiente:    BASE_URL=${BASE_URL}"
echo " - Admin:       ${ADMIN_SECRET:+OK}"
echo " - Banco:       ${CONN:+OK}"
