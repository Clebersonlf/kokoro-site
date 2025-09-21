#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILES=( "admin/financeiro/repasses.html" "admin/financeiro/relatorios.html" )

UNDO="UNDO_fix_repasses_vazamento_${TS}.sh"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
for f in ${FILES[@]}; do
  if [ -f "\$f.bak.$TS" ]; then
    mv -f "\$f.bak.$TS" "\$f"
    echo "Restaurado: \$f"
  fi
done
echo "OK (desfeito)."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (pulando)"; continue; }
  cp -f "$f" "$f.bak.$TS"

  # Remove a linha vazada (texto) com window.open(...) que apareceu no rodapé
  # Mantém o código correto que está dentro de <script> (não alteramos scripts).
  # Apagamos apenas linhas "renderizadas" contendo esse trecho.
  sed -i '/window\.open('\''\s*'\'',\s*'\''_blank'\''/d' "$f"
  sed -i 's/})(); \\1//g' "$f"

  echo "Corrigido: $f"
done

echo
echo ">> Verificando se ainda há vazamento visível:"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  if grep -q "window.open('', '_blank'" "$f"; then
    echo "  ! Ainda encontrei ocorrência em: $f"
  else
    echo "  ✓ Limpo em: $f"
  fi
done

echo
echo "Pronto. Faça deploy para ver no ar:"
echo "  npx vercel@latest --prod"
