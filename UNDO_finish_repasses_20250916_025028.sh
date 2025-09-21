#!/usr/bin/env bash
set -euo pipefail
if [ -f "admin/financeiro/repasses.html.bak.20250916_025028" ]; then
  mv -f "admin/financeiro/repasses.html.bak.20250916_025028" "admin/financeiro/repasses.html"
  echo "OK: restaurado admin/financeiro/repasses.html"
else
  echo "Nada para desfazer (backup não encontrado)."
fi
