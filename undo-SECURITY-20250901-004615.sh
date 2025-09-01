#!/usr/bin/env bash
set -euo pipefail
cd "/mnt/c/Users/clebe/Desktop/kokoro-site"
echo "[UNDO] restaurando backup dos HTMLs e removendo security-hardening.js…"
tar -xzf ".bak/security-20250901-004615/admin-html.tgz" -C .
rm -f shared/js/security-hardening.js || true
echo "[UNDO] voltando git para a tag pre-security-20250901-004615 …"
git reset --hard "pre-security-20250901-004615"
echo "[UNDO] fazendo deploy de rollback…"
npx vercel@latest --prod
echo "[UNDO] pronto. Estado anterior restaurado."
