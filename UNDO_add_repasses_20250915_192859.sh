#!/usr/bin/env bash
set -euo pipefail
echo ">> Restaurando alterações do patch 'Repasses (Colaboradores)'..."
# remover a página criada
[ -f "admin/financeiro/repasses.html" ] && rm -f "admin/financeiro/repasses.html" && echo " - removido: admin/financeiro/repasses.html"
# restaurar financeiro.html se backup existir
if [ -f "admin/financeiro/financeiro.html.bak.20250915_192859" ]; then
  mv -f "admin/financeiro/financeiro.html.bak.20250915_192859" "admin/financeiro/financeiro.html"
  echo " - restaurado: admin/financeiro/financeiro.html"
fi
echo "OK: desfazido."
