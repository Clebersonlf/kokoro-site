#!/usr/bin/env bash
set -euo pipefail

files=( \
  "./api/financeiro/recibo.js" \
  "./api/financeiro/recibo_email.js" \
  "./api/financeiro/recibo_whatsapp.js" \
)

echo ">> Atualizando função labelAux (inclui Prof. Titular)..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src = io.open(path, 'r', encoding='utf-8').read()

# normaliza que já injetamos antes; vamos substituir só o corpo da labelAux
new_label = r"""
function labelAux(p){
  const tipo  = String((p && p.tipo)  || '').toLowerCase();   // pode vir 'TITULAR', 'AUXILIAR', etc
  const faixa = String((p && p.faixa) || '').toLowerCase();   // pode vir 'preta', 'marrom', etc
  const tit   = (p && (p.eh_titular || p.is_titular)) ? true : false;

  // Prioridade: titular vence
  if (tit || tipo.includes('titular')) return 'Prof. Titular';

  // Auxiliares por faixa
  if (faixa.includes('preta'))  return 'Prof. Auxiliar';
  if (faixa.includes('marrom')) return 'Inst. Auxiliar';

  // fallback
  return 'Colaborador';
}
""".strip()

# troca definição anterior de labelAux (qualquer conteúdo) por esta
src = re.sub(r"function\s+labelAux\s*\([^)]*\)\s*\{[\s\S]*?\}\s*", new_label, src, count=1)

io.open(path, 'w', encoding='utf-8').write(src)
print(f"   - atualizado: {path}")
PY
done

echo
echo ">> Conferindo trechos com 'Colaborador:' e 'labelAux':"
grep -RIn "labelAux" ./api/financeiro | sed -n '1,120p' || true
grep -RIn "Colaborador:" ./api/financeiro | sed -n '1,120p' || true
