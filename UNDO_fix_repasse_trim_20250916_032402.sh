#!/usr/bin/env bash
set -euo pipefail
if [ -f "admin/financeiro/repasses.html.bak.20250916_032402" ]; then
  mv -f "admin/financeiro/repasses.html.bak.20250916_032402" "admin/financeiro/repasses.html"
  echo "Restaurado: admin/financeiro/repasses.html"
else
  echo "Backup não encontrado."
fi
