#!/usr/bin/env bash
set -euo pipefail

files=(
  "./api/financeiro/recibo.js"
  "./api/financeiro/recibo_email.js"
  "./api/financeiro/recibo_whatsapp.js"
)

echo ">> Atualizando a função labelAux(p) (Prof. Titular / Prof. Auxiliar / Inst. Auxiliar / Colaborador)..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src = io.open(path, 'r', encoding='utf-8').read()

new_func = r"""function labelAux(p){
  const tipo   = String((p && p.tipo)   || '').toLowerCase();
  const faixa  = String((p && p.faixa)  || '').toLowerCase();
  const titular = !!(p && (p.eh_titular || p.is_titular));

  // 1) Titular tem prioridade
  if (titular) return 'Prof. Titular';

  // 2) Auxiliar com faixa
  if (tipo === 'auxiliar') {
    if (faixa === 'preta' || faixa === 'faixa preta' || faixa === 'black') {
      return 'Prof. Auxiliar';
    }
    if (faixa === 'marrom' || faixa === 'faixa marrom' || faixa === 'brown') {
      return 'Inst. Auxiliar';
    }
    // auxiliar sem faixa conhecida
    return 'Colaborador';
  }

  // 3) Demais casos
  return 'Colaborador';
}"""

# substitui qualquer definição existente de function labelAux(p){ ... }
pat = re.compile(r"function\s+labelAux\s*\(\s*p\s*\)\s*\{[\s\S]*?\}", re.MULTILINE)
if pat.search(src):
    src = pat.sub(new_func, src, count=1)
else:
    # se não existir, insere no topo do arquivo
    src = new_func + "\n\n" + src

io.open(path, 'w', encoding='utf-8').write(src)
print(f"   - atualizado: {path}")
PY
done

echo
echo ">> Resumo das ocorrências da linha 'Colaborador:' pós-ajuste"
grep -RIn "Colaborador:" ./api/financeiro || true
