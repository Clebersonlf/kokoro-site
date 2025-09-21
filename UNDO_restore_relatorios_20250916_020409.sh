#!/usr/bin/env bash
set -euo pipefail
cp -f "admin/financeiro/relatorios.html" "admin/financeiro/relatorios.html.restored.20250916_020409.bak"
cp -f "admin/financeiro/relatorios.html.bak.20250916_020047" "admin/financeiro/relatorios.html"
echo "Restaurado novamente a partir: admin/financeiro/relatorios.html.bak.20250916_020047"
