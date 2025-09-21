#!/usr/bin/env bash
set -euo pipefail

files=(
  "./api/financeiro/recibo.js"
  "./api/financeiro/recibo_email.js"
  "./api/financeiro/recibo_whatsapp.js"
)

echo ">> Backups e patch da linha 'Colaborador:' ..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src = io.open(path, 'r', encoding='utf-8').read()

# Substitui qualquer linha atual de "Colaborador: ..." para a versão condicional usando labelAux(p)
# Nova regra:
# - Se o nome já tem "(", usamos só o nome.
# - Senão, se labelAux(p) existir e for diferente de "Colaborador", acrescenta " (label)".
# - Caso contrário, só o nome.
new_line = r'      `Colaborador: ${ (p.nome && p.nome.indexOf("(")!==-1) ? p.nome : ((labelAux(p) && labelAux(p)!=="Colaborador") ? (p.nome + " (" + labelAux(p) + ")") : p.nome) }`,'

pattern = re.compile(r'^\s*`Colaborador:.*`,\s*$', re.M)
src2, n = pattern.subn(new_line, src)
if n == 0:
    # tenta variantes anteriores
    pattern2 = re.compile(r'^\s*`Colaborador:\s*\$\{[^\n]+?\}\s*`,\s*$', re.M)
    src2, n = pattern2.subn(new_line, src)

io.open(path, 'w', encoding='utf-8').write(src2)
print(f"   - atualizado: {path}")
PY
done

echo
echo ">> Conferindo como ficou:"
grep -RIn "Colaborador:" ./api/financeiro | sed -n '1,120p' || true
