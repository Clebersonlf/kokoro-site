#!/usr/bin/env bash
set -euo pipefail
echo ">> Removendo artefatos do auditor (_audit_kokoro/)..."
rm -rf "./_audit_kokoro"
echo "OK: limpo."
