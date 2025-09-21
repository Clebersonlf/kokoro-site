#!/usr/bin/env bash
set -euo pipefail

F="./api/financeiro/recibo_email.js"
[ -f "$F" ] || { echo "ERRO: não achei $F"; exit 1; }

cp -f "$F" "$F.bak.$(date +%Y%m%d%H%M%S)"

python3 - "$F" <<'PY'
import io,sys,re
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()

# trocamos o from fixo por: from: process.env.RESEND_FROM || 'Planck Kokoro <no-reply@planckkokoro.com>'
tpl = "from: process.env.RESEND_FROM || 'Planck Kokoro <no-reply@planckkokoro.com>'"
s2=re.sub(r"from:\s*'[^']*<[^']+@[^']+>'", tpl, s, count=1)
io.open(p,'w',encoding='utf-8').write(s2)
print("alterado" if s2!=s else "já estava ok")
PY
