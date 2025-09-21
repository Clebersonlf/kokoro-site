#!/usr/bin/env bash
set -euo pipefail
[ -f "./api/financeiro/repasses_record.js" ] && rm -f "./api/financeiro/repasses_record.js" && echo " - removido: ./api/financeiro/repasses_record.js"
if [ -f "./admin/financeiro/repasses.html.bak.20250916_021755" ]; then mv -f "./admin/financeiro/repasses.html.bak.20250916_021755" "./admin/financeiro/repasses.html" && echo " - restaurado: ./admin/financeiro/repasses.html"; fi
echo "OK: desfazido."
