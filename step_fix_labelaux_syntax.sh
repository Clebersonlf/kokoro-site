#!/usr/bin/env bash
set -euo pipefail
files=( ./api/financeiro/recibo.js ./api/financeiro/recibo_email.js ./api/financeiro/recibo_whatsapp.js )
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f"; continue; }
  cp -f "$f" "$f.bak.$(date +%s)"
  python3 - "$f" <<'PY'
import io,sys,re
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()
# Colapsa duplicata do tail da função labelAux:
# ... return 'Colaborador'; }\n    return 'Colaborador'; }\n
s2=re.sub(r"(return 'Colaborador';\s*}\s*)\s*return 'Colaborador';\s*}\s*", r"\1", s, count=1, flags=re.M)
io.open(p,'w',encoding='utf-8').write(s2)
print(("corrigido" if s2!=s else "sem-alteracao")+":", p)
PY
done
echo "OK: correção aplicada."
