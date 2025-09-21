#!/usr/bin/env bash
set -euo pipefail

echo "==> Procurando handlers possíveis de /api/pagamentos ..."
CANDIDATES=$(find . -type f \( \
  -path "./app/api/pagamentos/route.ts" -o \
  -path "./app/api/pagamentos/route.js" -o \
  -path "./src/app/api/pagamentos/route.ts" -o \
  -path "./src/app/api/pagamentos/route.js" -o \
  -path "./pages/api/pagamentos.ts" -o \
  -path "./pages/api/pagamentos.js" -o \
  -path "./src/pages/api/pagamentos.ts" -o \
  -path "./src/pages/api/pagamentos.js" -o \
  -name "pagamentos.ts" -o \
  -name "pagamentos.js" \
\) 2>/dev/null | sort || true)

if [ -z "$CANDIDATES" ]; then
  echo "Nenhum arquivo candidato encontrado nas pastas usuais."
  echo "Mostrando qualquer arquivo com 'pagamentos' no nome dentro de 'api'..."
  find . -type f -path "*api*/*pagamentos*" | sort || true
  exit 0
fi

echo
echo "==> Arquivos candidatos:"
echo "$CANDIDATES"
echo

for f in $CANDIDATES; do
  echo "-----------------------------------------------"
  echo "ARQUIVO: $f"
  echo "MIME: $(file -bi "$f" 2>/dev/null || true)"
  echo "Tamanho: $(wc -c < "$f" 2>/dev/null) bytes"
  echo "Modificado: $(date -r "$f" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || true)"
  echo

  echo ">> Checando caracteres fora do ASCII básico (podem causar SyntaxError se soltos):"
  if grep -nP "[^\x09\x0A\x0D\x20-\x7E]" "$f" >/tmp/_nonascii.txt 2>/dev/null; then
    cat /tmp/_nonascii.txt | sed -e 's/^/NONASCII: /'
  else
    echo "Nenhum fora do ASCII básico encontrado (ou arquivo é binário/TS com UTF-8 ok)."
  fi
  echo

  echo ">> Trechos com 'export', 'default', 'POST', 'handler':"
  grep -nE "export|default|POST|handler|Request|Response" "$f" 2>/dev/null || true
  echo

  echo ">> Conteúdo (com número de linha):"
  nl -ba "$f" | sed -n '1,300p'
  echo "-----------------------------------------------"
  echo
done
