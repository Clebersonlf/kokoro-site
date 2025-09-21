#!/usr/bin/env bash
set -euo pipefail
if [ -f "admin/financeiro/relatorios.html.bak.20250916_013859" ]; then
  mv -f "admin/financeiro/relatorios.html.bak.20250916_013859" "admin/financeiro/relatorios.html"
  echo "OK: restaurado admin/financeiro/relatorios.html a partir do backup admin/financeiro/relatorios.html.bak.20250916_013859"
else
  echo "Nada para restaurar (backup não encontrado)."
fi
