#!/usr/bin/env bash
set -euo pipefail

files=(
  "./api/financeiro/recibo.js"
  "./api/financeiro/recibo_email.js"
  "./api/financeiro/recibo_whatsapp.js"
)

echo ">> Backups e patch da linha 'Colaborador:' ..."
for f in "${files[@]}"; do
  if [ -f "$f" ]; then
    cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"
    python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src = io.open(path, 'r', encoding='utf-8').read()

# Alvo: linha como `Colaborador: ${p.nome} (${p.tipo})`,
# Troca por: só acrescenta (Tipo) se p.nome não tiver parênteses
re_ = re.compile(r'`Colaborador:\s*\$\{\s*p\.nome\s*\}\s*\(\$\{\s*p\.tipo\s*\}\)\s*`,')
new = r'`Colaborador: ${p.nome}${(!p.nome || p.nome.indexOf("(")===-1) && p.tipo ? " (" + (String(p.tipo).charAt(0).toUpperCase() + String(p.tipo).slice(1).toLowerCase()) + ")" : ""}`,'

out = re_.sub(new, src)
io.open(path, 'w', encoding='utf-8').write(out)
print(f"   - atualizado: {path}")
PY
  else
    echo "AVISO: não achei $f (ok)"
  fi
done

echo
echo ">> Conferindo ocorrências:"
grep -RIn "Colaborador:" ./api/financeiro | sed -n '1,200p' || true
