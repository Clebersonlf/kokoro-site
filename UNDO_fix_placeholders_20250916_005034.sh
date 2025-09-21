#!/usr/bin/env bash
set -euo pipefail
if [ -f "admin/financeiro/repasses.html.bak.20250916_005034" ]; then
  mv -f "admin/financeiro/repasses.html.bak.20250916_005034" "admin/financeiro/repasses.html"
  echo ">> Restaurado: admin/financeiro/repasses.html"
else
  echo "Nenhum backup encontrado para restaurar."
fi
