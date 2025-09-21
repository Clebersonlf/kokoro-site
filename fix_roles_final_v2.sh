#!/usr/bin/env bash
set -euo pipefail

FILES=( "./api/financeiro/recibo.js" "./api/financeiro/recibo_email.js" "./api/financeiro/recibo_whatsapp.js" )

echo ">> 1) Aplicando patch final (labelTitle + linha 'Colaborador:')"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io,sys,regex as re
p=sys.argv[1]
src=io.open(p,'r',encoding='utf-8').read()

# 0) remove versão anterior do labelTitle (se existir) — só a primeira ocorrência
src = re.sub(r"\bfunction\s+labelTitle\s*\([^)]*\)\s*\{[\s\S]*?\n\}\s*", "", src, count=1)

# 1) helper novo
helper = """
function labelTitle(p, extra){
  const e = extra || {};
  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));

  const norm = s => String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
  const f = norm(rawFaixa);

  // Professor titular (pro labore etc.)
  if (titular) return "Prof. Titular";

  // Monitores
  if (f.includes("azul"))  return "Mon.";
  if (f.includes("roxa"))  return "Mon.";

  // Instrutor
  if (f.includes("marrom")) return "Instr.";

  // Faixa preta: 1º/2º => Instr.; 3º-6º => Prof.
  if (f.includes("preta")){
    if (f.includes("3") || f.includes("4") || f.includes("5") || f.includes("6")) return "Prof.";
    return "Instr.";
  }

  // 7º Vermelha e Preta => Mestre (M.)
  if (f.includes("vermelha e preta") || f.includes("7")) return "M.";

  // 8º Vermelha e Branca => Grande Mestre (G.M.)
  if (f.includes("vermelha e branca") || f.includes("8")) return "G.M.";

  // 9º e 10º Vermelha => Grão/ Venerável
  if (f.includes("vermelha") && (f.includes(" 9") || f.endsWith("9")))  return "G.M.";
  if (f.includes("vermelha") && (f.includes(" 10")|| f.endsWith("10"))) return "V.M.";

  return "Colaborador";
}
"""

# 2) insere helper após o primeiro import usando função (evita escapes do \u)
def ins_helper(m):
    return m.group(0) + helper + "\n"
src = re.sub(r"(^\s*import[^\n]*\n)", ins_helper, src, count=1, flags=re.M)

# 3) troca a linha do "Colaborador:" para usar labelTitle(...)
# usamos req.body (quando existir) ou src (quando existir) como "extra"
# - recibo.js tem uma var local chamada src; nos outros arquivos, usamos req.body
def repl_colab(m):
    before = m.group(0)
    return "`Colaborador: ${ (p.nome && p.nome.indexOf(\"(\")!==-1) ? p.nome : ((labelTitle(p, (typeof req!=='undefined' ? (req.body||{}) : (typeof src!=='undefined'? (src||{}) : {}))) && labelTitle(p, (typeof req!=='undefined' ? (req.body||{}) : (typeof src!=='undefined'? (src||{}) : {})))!==\"Colaborador\") ? (p.nome + \" (\" + labelTitle(p, (typeof req!=='undefined' ? (req.body||{}) : (typeof src!=='undefined'? (src||{}) : {}))) + \")\") : p.nome) }`"

# substitui apenas a primeira ocorrência por arquivo
src = re.sub(r"`Colaborador:[^`]*`", repl_colab, src, count=1)

io.open(p,'w',encoding='utf-8').write(src)
print("  - patch OK em:", p)
PY
done

echo ">> 2) Deploy na Vercel (produção)"
npx vercel@latest --prod

echo
echo ">> 3) Teste rápido (César — faixa preta lisa => Instr.)"
vercel env pull .env.local >/dev/null 2>&1 || true
set -a; source ./.env.local 2>/dev/null || true; set +a
curl -sS -X POST "https://www.planckkokoro.com/api/financeiro/recibo_email" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "professor_id":"baed8b13-f510-4c37-bd1e-60e809af1d93",
    "valor_pago":50.00,
    "metodo":"PIX",
    "pago_em":"2025-09-15T14:10:00-03:00",
    "para_email":"clebersonlf@gmail.com",
    "faixa":"preta", 
    "eh_titular": false
  }' | jq -r '.preview_texto'
