#!/usr/bin/env bash
set -euo pipefail
[ -f "./api/financeiro/repasses_list.js" ] && rm -f "./api/financeiro/repasses_list.js" && echo " - removido: ./api/financeiro/repasses_list.js"
[ -f "./admin/financeiro/repasses.html.bak.20250916_022427" ] && mv -f "./admin/financeiro/repasses.html.bak.20250916_022427" "./admin/financeiro/repasses.html" && echo " - restaurado: ./admin/financeiro/repasses.html"
[ -f "./admin/financeiro/financeiro.html.bak.20250916_022427" ] && mv -f "./admin/financeiro/financeiro.html.bak.20250916_022427" "./admin/financeiro/financeiro.html" && echo " - restaurado: ./admin/financeiro/financeiro.html"
echo "OK: desfazido."
