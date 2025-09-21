#!/usr/bin/env bash
set -euo pipefail

FILES=( "./api/financeiro/recibo.js" "./api/financeiro/recibo_email.js" "./api/financeiro/recibo_whatsapp.js" )

echo ">> Aplicando patch final para labelTitle() em: \${FILES[*]}"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io,sys,re
p=sys.argv[1]
src=io.open(p,'r',encoding='utf-8').read()

# Remove versões antigas do labelTitle se já existirem
src = re.sub(r"function labelTitle[\s\S]*?\}\n", "", src, count=1)

helper = r"""
function labelTitle(p, extra){
  const e = extra || {};
  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));

  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const f = norm(rawFaixa);

  if (titular) return "Prof. Titular";

  if (f.includes("azul")) return "Mon.";
  if (f.includes("roxa")) return "Mon.";
  if (f.includes("marrom")) return "Instr.";
  if (f.includes("preta")) {
    if (f.includes("3") || f.includes("4") || f.includes("5") || f.includes("6"))
      return "Prof.";
    return "Instr.";
  }
  if (f.includes("vermelha e preta") || f.includes("7")) return "M.";
  if (f.includes("vermelha e branca") || f.includes("8")) return "G.M.";
  if (f=="vermelha 9" || f=="9") return "G.M.";
  if (f=="vermelha 10" || f=="10") return "V.M.";

  return "Colaborador";
}
"""

# Insere o helper logo após o primeiro import
src = re.sub(r"(import[^\n]+\n)", r"\1" + helper + "\n", src, count=1)

# Substitui a linha que monta o "Colaborador:" para usar labelTitle
src = re.sub(
  r"`Colaborador:.*?`",
  "`Colaborador: ${ (p.nome && p.nome.indexOf(\"(\")!==-1) ? p.nome : ((labelTitle(p, (req.body||src||{})) && labelTitle(p, (req.body||src||{}))!==\"Colaborador\") ? (p.nome + \" (\" + labelTitle(p, (req.body||src||{})) + \")\") : p.nome) }`",
  src,
  count=1
)

io.open(p,'w',encoding='utf-8').write(src)
print("patch aplicado em:", p)
PY
done

echo ">> Deployando para produção..."
npx vercel@latest --prod
