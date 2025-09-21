#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILE="admin/financeiro/repasses.html"
[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

# UNDO
UNDO="UNDO_fix_repasse_trim_${TS}.sh"
cp -f "$FILE" "$FILE.bak.$TS"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [ -f "$FILE.bak.$TS" ]; then
  mv -f "$FILE.bak.$TS" "$FILE"
  echo "Restaurado: $FILE"
else
  echo "Backup não encontrado."
fi
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# Remove linhas que contenham exatamente o fragmento (fora de <script>)
# - ignora linhas que tenham "script"
# - aceita espaços/crases/backticks/; extras
awk '
  {
    line=$0
    low=line
    gsub(/\t/," ", low)
    # normaliza espaços
    gsub(/ +/," ", low)
    # tira crases/backticks isolados
    gsub(/`/,"", low)
    # recorta espaços nas pontas
    sub(/^ +/,"", low); sub(/ +$/,"", low)
    # se tiver tag script na linha, mantem
    if (tolower(line) ~ /<\s*\/?\s*script/){ print $0; next }
    # se a linha é exatamente o vazamento, descarta
    if (low == "}); })();" || low == "});})();" ){ next }
    print $0
  }
' "$FILE" > "$FILE.__clean__" && mv -f "$FILE.__clean__" "$FILE"

# Segurança extra: remove qualquer linha com o padrão literal, se ainda ficou, desde que não tenha "script"
grep -n "}); })();" "$FILE" | grep -vi "script" && sed -i -E '/script/!{/}\);\ \}\)$begin:math:text$$end:math:text$;\ *$/d' "$FILE" || true

echo "✓ Limpesa aplicada em: $FILE"
echo "Agora faça o deploy: npx vercel@latest --prod"
