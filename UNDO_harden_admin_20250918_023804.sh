#!/usr/bin/env bash
set -euo pipefail
echo ">> Restaurando alterações de segurança do admin..."
# Remover arquivos criados
rm -f ./admin/_auth.js
rm -f ./admin/login.html
# Tentar reverter alterações de botões/links nos HTML conhecidos
for f in ./admin/index.html ./admin/financeiro/financeiro.html ./admin/financeiro/repasses.html; do
  [ -f "$f.bak_pre_harden" ] && mv -f "$f.bak_pre_harden" "$f" && echo " - restaurado: $f"
done
echo "OK."
