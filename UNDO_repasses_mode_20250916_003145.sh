#!/usr/bin/env bash
set -euo pipefail
echo ">> Desfazendo alterações do modo Repasses..."
# 1) remover página criada (se não existia antes)
if [ -f "admin/financeiro/repasses.html.created.20250916_003145" ]; then
  rm -f "admin/financeiro/repasses.html" && rm -f "admin/financeiro/repasses.html.created.20250916_003145"
  echo " - removido: admin/financeiro/repasses.html"
fi
# 2) restaurar financeiro.html se houver backup desse patch
if [ -f "admin/financeiro/financeiro.html.bak.20250916_003145" ]; then
  mv -f "admin/financeiro/financeiro.html.bak.20250916_003145" "admin/financeiro/financeiro.html"
  echo " - restaurado: admin/financeiro/financeiro.html"
fi
echo "OK: desfazido."
