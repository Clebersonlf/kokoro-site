#!/usr/bin/env bash
set -euo pipefail
if [[ -f "admin/index.html.bak.20250918_025541" ]]; then
  cp -v "admin/index.html.bak.20250918_025541" "admin/index.html"
  echo "Restaurei: admin/index.html ← admin/index.html.bak.20250918_025541"
else
  echo "Backup não encontrado: admin/index.html.bak.20250918_025541"
fi
