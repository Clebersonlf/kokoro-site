#!/usr/bin/env bash
set -euo pipefail
echo ">> Desfazendo 'Relatórios'..."
[ -f "admin/financeiro/relatorios.html" ] && rm -f "admin/financeiro/relatorios.html" && echo " - removido: admin/financeiro/relatorios.html"
if [ -f "admin/financeiro/financeiro.html.bak.20250916_010945" ]; then mv -f "admin/financeiro/financeiro.html.bak.20250916_010945" "admin/financeiro/financeiro.html"; echo " - restaurado: admin/financeiro/financeiro.html"; fi
if [ -f "admin/financeiro/repasses.html.bak.20250916_010945" ]; then mv -f "admin/financeiro/repasses.html.bak.20250916_010945" "admin/financeiro/repasses.html"; echo " - restaurado: admin/financeiro/repasses.html"; fi
echo "OK: desfazido."
