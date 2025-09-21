#!/usr/bin/env bash
set -euo pipefail

FILE="admin/financeiro/relatorios.html"

echo ">> Procurando backups de ${FILE}.bak.* ..."
LAST_BAK="$(ls -1t "${FILE}.bak."* 2>/dev/null | head -n1 || true)"

if [ -z "${LAST_BAK}" ]; then
  echo "ERRO: não encontrei backups (${FILE}.bak.*). Nada alterado."
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_restore_relatorios_${TS}.sh"

# cria desfazer (volta ao estado pré-restauração)
cat > "${UNDO}" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cp -f "${FILE}" "${FILE}.restored.${TS}.bak"
cp -f "${LAST_BAK}" "${FILE}"
echo "Restaurado novamente a partir: ${LAST_BAK}"
EOF
chmod +x "${UNDO}"

echo ">> Backup mais recente encontrado:"
echo "   ${LAST_BAK}"
cp -f "${LAST_BAK}" "${FILE}"
echo "OK: restaurado ${FILE} a partir de ${LAST_BAK}"
echo ">> Desfazer disponível: ./${UNDO}"
