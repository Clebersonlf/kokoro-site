#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups
ARQ="backups/kokoro-site_$(date +%F_%H%M%S).tar.gz"
tar --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='backups' --exclude='.vercel' -czf "$ARQ" .
echo "OK: $ARQ"
