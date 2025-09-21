#!/usr/bin/env bash
set -euo pipefail

F="./api/pagamentos/index.js"

if [ ! -f "$F" ]; then
  echo "ERRO: não encontrei $F"
  exit 1
fi

echo "==> Info do arquivo"
echo "Caminho: $F"
echo "MIME: $(file -bi "$F" 2>/dev/null || true)"
echo "Tamanho: $(wc -c < "$F" 2>/dev/null) bytes"
echo "Modificado: $(date -r "$F" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || true)"
echo

echo "==> Procurando caracteres fora do ASCII básico (podem causar SyntaxError)"
if grep -nP "[^\x09\x0A\x0D\x20-\x7E]" "$F" >/tmp/_nonascii_pag.txt 2>/dev/null; then
  echo "--- Linhas com não-ASCII ---"
  cat /tmp/_nonascii_pag.txt | sed -e 's/^/NONASCII: /'
  echo
  echo "--- Trechos em hexdump (até 10 linhas) ---"
  nl -ba "$F" | grep -nP "[^\x09\x0A\x0D\x20-\x7E]" -n | head -n 10 | cut -d: -f1 | while read -r LN; do
    echo "Linha $LN:"
    sed -n "${LN}p" "$F" | hexdump -C
    echo
  done
else
  echo "Nenhum caractere fora do ASCII básico encontrado."
fi
echo

echo "==> Palavras-chave típicas"
grep -nE "export|default|POST|handler|Request|Response|module\.exports|exports\." "$F" || true
echo

echo "==> Conteúdo com número de linha (primeiros 400 lines)"
nl -ba "$F" | sed -n '1,400p'
echo

echo "==> Checagem de sintaxe com Node (sem executar)"
node --version || true
node --check "$F" || true
