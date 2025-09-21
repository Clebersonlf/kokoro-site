#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILE="admin/financeiro/repasses.html"
[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

# UNDO
UNDO="UNDO_fix_repasse_footer_${TS}.sh"
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

# Remoções diretas de linhas com vazamento visível
# (não mexe em <script> válido; só apaga texto renderizado com esses trechos)
sed -i \
  -e "/window\.open('', '_blank'/d" \
  -e "/Bloqueado pelo navegador/d" \
  -e "/w\.document\.open();/d" \
  -e "/w\.document\.write(html);/d" \
  -e "/w\.document\.close();/d" \
  -e "s/}); \})\(\); \\1//g" \
  -e "s/}); \})\(\);//g" \
  -e "s/\\\1//g" \
  "$FILE"

# Também remove eventuais crases/backticks soltos iniciando a linha
sed -i -E "s/^\s*\`;\s*$//" "$FILE"

# Varredura extra: se sobrar qualquer rastro desses termos, apaga a linha
grep -Eq "(window\.open$begin:math:text$|Bloqueado pelo navegador|document\\.write\\(html$end:math:text$|\)\\\); \\\\1)" "$FILE" && \
  sed -i -E "/window\.open$begin:math:text$|Bloqueado pelo navegador|document\\.write\\(html$end:math:text$|\)\\\); \\\\1/d" "$FILE"

echo "✓ Limpesa aplicada em: $FILE"
echo
echo ">> Verificação:"
if grep -nE "window\.open$begin:math:text$|Bloqueado pelo navegador|document\\.write\\(html$end:math:text$|\)\\\); \\\\1" "$FILE"; then
  echo "! Ainda há rastros — me avise que faço um filtro mais agressivo."
else
  echo "✓ Sem rastros encontrados."
fi

echo
echo "Agora faça o deploy:"
echo "  npx vercel@latest --prod"
