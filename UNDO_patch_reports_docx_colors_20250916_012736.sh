#!/usr/bin/env bash
set -euo pipefail
[ -f "admin/financeiro/relatorios.html.bak.20250916_012736" ] && mv -f "admin/financeiro/relatorios.html.bak.20250916_012736" "admin/financeiro/relatorios.html" && echo "Restaurado: admin/financeiro/relatorios.html"
echo "OK."
