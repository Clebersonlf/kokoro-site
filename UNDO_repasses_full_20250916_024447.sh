#!/usr/bin/env bash
set -euo pipefail
echo ">> Restaurando admin/financeiro/repasses.html do backup admin/financeiro/repasses.html.bak.20250916_024447 ..."
cp -f "admin/financeiro/repasses.html.bak.20250916_024447" "admin/financeiro/repasses.html"
echo "OK."
