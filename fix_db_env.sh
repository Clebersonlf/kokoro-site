#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/mnt/c/Users/clebe/Desktop/kokoro-site"
cd "$PROJECT_DIR"

echo "==> ENVs atuais (só conferindo):"
vercel env ls || true
echo

# === Solicita as strings do Neon ===
read -r -p "Cole a POOLED (tem '-pooler') -> POSTGRES_URL: " POOLED
read -r -p "Cole a DIRETA (sem '-pooler') -> POSTGRES_URL_NON_POOLING & DATABASE_URL: " DIRECT

# Validação rápida
case "$POOLED" in *-pooler* ) : ;; * ) echo "ERRO: a POOLED precisa ter -pooler no host."; exit 1;; esac
case "$DIRECT" in *-pooler* ) echo "ERRO: a DIRETA não pode ter -pooler."; exit 1;; * ) : ;; esac

echo
echo "==> Removendo ENVs antigas (Production) se existirem..."
vercel env rm POSTGRES_URL production -y || true
vercel env rm POSTGRES_URL_NON_POOLING production -y || true
vercel env rm DATABASE_URL production -y || true

echo
echo "==> Adicionando ENVs corretas (Production)..."
printf "%s" "$POOLED" | vercel env add POSTGRES_URL production >/dev/null
printf "%s" "$DIRECT" | vercel env add POSTGRES_URL_NON_POOLING production >/dev/null
printf "%s" "$DIRECT" | vercel env add DATABASE_URL production >/dev/null

echo
echo "==> Conferindo ENVs..."
vercel env ls

echo
echo "==> Deploy em produção..."
DEPLOY_OUT="$(vercel --prod || true)"
echo "$DEPLOY_OUT"

BASE="$(printf '%s\n' "$DEPLOY_OUT" | sed -n 's/^✅  Production: //p' | tail -n1)"
if [ -z "${BASE:-}" ]; then
  read -r -p "Cole o URL de produção (https://...vercel.app): " BASE
fi
echo "USANDO BASE: $BASE"
echo

echo "==> Teste /api/test/db:"
curl -sS "$BASE/api/test/db" || true
echo; echo

echo "==> Teste /api/financeiro/lancamentos (GET):"
curl -sS "$BASE/api/financeiro/lancamentos" || true
echo; echo

echo "==> POST de teste (financeiro):"
curl -sS -X POST "$BASE/api/financeiro/lancamentos" \
  -H "Content-Type: application/json" \
  -d '{"aluno_id":null,"tipo":"receita","valor":120.00,"descricao":"Mensalidade Setembro","data":"2025-09-28"}' || true
echo; echo

echo "==> GET novamente:"
curl -sS "$BASE/api/financeiro/lancamentos" || true
echo; echo

echo "FIM. Se /api/test/db retornar algo como ok:true, está resolvido."
