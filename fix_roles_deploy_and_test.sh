#!/usr/bin/env bash
set -euo pipefail

FILES=( "./api/financeiro/recibo.js" "./api/financeiro/recibo_email.js" "./api/financeiro/recibo_whatsapp.js" )

echo ">> 1) Patch: inserir helper labelTitle() e usar na linha 'Colaborador:'"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io,sys,re
p=sys.argv[1]
src=io.open(p,'r',encoding='utf-8').read()

# -------- helper com o teu mapa de faixas -> abreviação --------
helper = r"""
function labelTitle(p, extra){
  const e = extra || {};
  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
  const tipoRaw  = String(e.tipo  || (p && p.tipo)  || '').toLowerCase();
  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));

  const deAcento = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const f = deAcento(rawFaixa);

  // 0) Titular tem prioridade
  if (titular) return 'Prof. Titular';

  // 1) Mapa por FAIXA
  // Azul / Roxa -> Mon.
  if (/azul/.test(f) || /roxa?/.test(f)) return 'Mon.';

  // Marrom -> Instr.
  if (/marrom/.test(f)) return 'Instr.';

  // Faixa Preta
  if (/preta/.test(f)) {
    // 3º–6º -> Prof.
    if (/\b(3|3o|3º|4|4o|4º|5|5o|5º|6|6o|6º)\b/.test(f)) return 'Prof.';
    // Lisa, 1º ou 2º -> Instr.
    if (/lisa/.test(f) || /\b(1|1o|1º|2|2o|2º)\b/.test(f)) return 'Instr.';
    return 'Instr.'; // sem grau: Instr.
  }

  // 7º (Vermelha e Preta) -> Mestre
  if (/vermelha\s*e\s*preta/.test(f) || /\b7\b/.test(f)) return 'M.';

  // 8º (Vermelha e Branca) -> Grande Mestre
  if (/vermelha\s*e\s*branca/.test(f) || /\b8\b/.test(f)) return 'G.M.';

  // 9º (Vermelha) -> Grão-Mestre
  if (/vermelha/.test(f) && /\b9\b/.test(f)) return 'G.M.';

  // 10º (Vermelha) -> Venerável Mestre
  if (/vermelha/.test(f) && /\b10\b/.test(f)) return 'V.M.';

  // 2) Fallback por TIPO explícito (permite exceções)
  if (tipoRaw === 'monitor' || tipoRaw === 'monitora' || tipoRaw === 'monitor(a)') return 'Mon.';
  if (tipoRaw.startsWith('instrut')) return 'Instr.';
  if (tipoRaw.startsWith('prof'))    return 'Prof.';

  // 3) Fallback geral
  return 'Colaborador';
}
"""

# Injeta helper se ainda não existe
if 'function labelTitle(' not in src:
    # coloca após o primeiro import/export do arquivo
    m = re.search(r'(\n\s*\n)', src, flags=re.M)
    if m:
        idx = m.end()
        src = src[:idx] + helper + '\n' + src[idx:]
    else:
        src = helper + '\n' + src

# Define EXTRA conforme o arquivo
EXTRA = 'src' if p.endswith('/recibo.js') else '(req.body || {})'

# Nova linha "Colaborador:" usando labelTitle
new_line = '`Colaborador: ${ (p.nome && p.nome.indexOf("(")!==-1) ? p.nome : ((labelTitle(p, EXTRA) && labelTitle(p, EXTRA)!=="Colaborador") ? (p.nome + " (" + labelTitle(p, EXTRA) + ")") : p.nome) }`'
new_line = new_line.replace('EXTRA', EXTRA)

# Substitui qualquer linha que comece com `Colaborador:` (entre crases)
pat = re.compile(r'^(\s*)`Colaborador:.*?`\,?', flags=re.M)
if pat.search(src):
    src = pat.sub(lambda m: m.group(1)+new_line+',', src, count=1)
else:
    # fallback: insere após a linha com "*Recibo de Repasse*"
    src = re.sub(r'(`\*Recibo de Repasse\*`\s*,?)',
                 r'\1\n        '+new_line+',', src, count=1)

io.open(p,'w',encoding='utf-8').write(src)
print("   - atualizado:", p)
PY
done

echo
echo ">> 2) Conferindo:"
grep -RIn "labelTitle" ./api/financeiro | sed -n '1,200p' || true
grep -RIn "Colaborador:" ./api/financeiro | sed -n '1,200p' || true

echo
echo ">> 3) Deploy na Vercel (produção)..."
npx vercel@latest --prod

echo
echo ">> 4) Testes (prévia do e-mail)"
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a

API="https://www.planckkokoro.com/api/financeiro/recibo_email"
HDRS=(-H "Content-Type: application/json" -H "x-admin-secret: ${ADMIN_SECRET}")

echo
echo "==== TESTE 1: César = FAIXA PRETA (esperado: Instr. ou Prof. conforme grau) ===="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":50.00,
  "metodo":"PIX",
  "pago_em":"2025-09-15T14:10:00-03:00",
  "para_email":"clebersonlf@gmail.com",
  "faixa":"preta"   // se quiser forçar "Prof.", envie algo como: "faixa":"preta 3º"
}' | jq -r '.preview_texto'

echo
echo "==== TESTE 2: Victor = FAIXA MARROM (exceção: forçar Monitor) ===="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":50.00,
  "metodo":"PIX",
  "pago_em":"2025-09-15T14:10:00-03:00",
  "para_email":"clebersonlf@gmail.com",
  "faixa":"marrom",
  "tipo":"monitor"
}' | jq -r '.preview_texto'

echo
echo "==== TESTE 3: Robert = FAIXA ROXA (Mon.) ===="
curl -s -X POST "$API" "${HDRS[@]}" -d '{
  "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
  "valor_pago":50.00,
  "metodo":"PIX",
  "pago_em":"2025-09-15T14:10:00-03:00",
  "para_email":"clebersonlf@gmail.com",
  "faixa":"roxa"
}' | jq -r '.preview_texto'

echo
echo ">> FIM: Cole aqui as três prévias para eu validar."
