#!/usr/bin/env bash
set -euo pipefail

FILES=( "./api/financeiro/recibo.js" "./api/financeiro/recibo_email.js" "./api/financeiro/recibo_whatsapp.js" )

echo ">> 1) Patch da linha 'Colaborador:' (tira qualquer (… ) do nome e aplica labelTitle)"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io,sys,re,os
p=sys.argv[1]
src=io.open(p,'r',encoding='utf-8').read()

# extra passado ao label: no /recibo.js é "src", nos outros é "(req.body || {})"
extra = 'src' if p.endswith('recibo.js') else '(req.body || {})'

# nova linha: remove qualquer sufixo " (…)" já presente no nome e aplica o label calculado
new_line = '      `Colaborador: ${ String((p.nome||"")).replace(/\\s*\\([^)]*\\)\\s*$/,"").trim() } (${labelTitle(p, ' + extra + ')})`,'

# substitui a linha existente que começa com `Colaborador:
pat = re.compile(r'^\s*`Colaborador:.*?`,\s*$', re.M)
if not pat.search(src):
    print("AVISO: padrão não encontrado em", p)
else:
    src = pat.sub(new_line, src, count=1)

io.open(p,'w',encoding='utf-8').write(src)
print("   - atualizado:", p)
PY
done

echo
echo ">> 2) Deploy na Vercel (produção)…"
npx vercel@latest --prod

# 3) Testes mínimos para validar a linha "Colaborador:"
API="https://www.planckkokoro.com/api/financeiro/recibo_email"
HDRS=(-H "Content-Type: application/json" -H "x-admin-secret: ${ADMIN_SECRET}")

echo
echo "---- TESTE A: César (faixa preta lisa) => esperado: (Instr.) ----"
curl -sS -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":50.00, "metodo":"PIX",
  "pago_em":"2025-09-15T14:10:00-03:00", "para_email":"clebersonlf@gmail.com",
  "faixa":"preta"
}' | jq -r '.preview_texto' | sed -n '2p'

echo
echo "---- TESTE B: Victor (marrom) => esperado: (Instr.) ----"
curl -sS -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":50.00, "metodo":"PIX",
  "pago_em":"2025-09-15T14:10:00-03:00", "para_email":"clebersonlf@gmail.com",
  "faixa":"marrom"
}' | jq -r '.preview_texto' | sed -n '2p'

echo
echo "---- TESTE C: Cleberson (Titular) => esperado: (Prof. Titular) ----"
curl -sS -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":50.00, "metodo":"PIX",
  "pago_em":"2025-09-15T14:10:00-03:00", "para_email":"clebersonlf@gmail.com",
  "faixa":"preta 3º", "eh_titular": true
}' | jq -r '.preview_texto' | sed -n '2p'

echo
echo ">> FIM: envie aqui as 3 linhas de 'Colaborador:' que apareceram acima."
