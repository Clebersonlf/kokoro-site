#!/usr/bin/env bash
set -euo pipefail
for f in admin/financeiro/repasses.html admin/financeiro/relatorios.html; do
  if [ -f "$f.bak.20250916_031521" ]; then
    mv -f "$f.bak.20250916_031521" "$f"
    echo "Restaurado: $f"
  fi
done
echo "OK (desfeito)."
