#!/usr/bin/env bash
set -euo pipefail
if [ -f "admin/financeiro/repasses.html.bak.20250916_030246" ]; then
  mv -f "admin/financeiro/repasses.html.bak.20250916_030246" "admin/financeiro/repasses.html"
  echo ">> Restaurado admin/financeiro/repasses.html"
else
  echo "Nada para restaurar"
fi
