#!/usr/bin/env bash
set -euo pipefail

files=(
  "./api/financeiro/recibo.js"
  "./api/financeiro/recibo_email.js"
  "./api/financeiro/recibo_whatsapp.js"
)

echo ">> Backups e troca da linha 'Colaborador:' para usar labelAux(p) ..."
for f in "${files[@]}"; do
  if [ -f "$f" ]; then
    cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"
    python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src = io.open(path, 'r', encoding='utf-8').read()

# 1) Garante que labelAux exista (caso ainda não esteja no arquivo)
if 'function labelAux(' not in src:
    helper = r"""
function labelAux(p){
  const tipo  = String((p && p.tipo)  || '').toLowerCase();
  const faixa = String((p && p.faixa) || '').toLowerCase();
  const tit   = (p && (p.eh_titular || p.is_titular)) ? true : false;

  if (tit) return 'Prof. Titular';
  if (tipo === 'auxiliar' || tipo === 'auxiliar_prof' || tipo === 'aux' || tipo === 'assistant') {
    if (faixa === 'preta' || faixa === 'black' || faixa === 'black belt') return 'Prof. Auxiliar';
    if (faixa === 'marrom' || faixa === 'brown' || faixa === 'brown belt') return 'Inst. Auxiliar';
    return 'Colaborador';
  }
  return 'Colaborador';
}
"""
    # injeta antes da primeira export/handler encontrada
    m = re.search(r'\nexport\s+default\s+async\s+function', src)
    if m:
      src = src[:m.start()] + helper + src[m.start():]
    else:
      src = helper + "\n" + src

# 2) Substitui qualquer forma antiga da linha "Colaborador: ..."
#    Exemplos a cobrir:
#    `Colaborador: ${p.nome} (${p.tipo})`,
#    `Colaborador: ${p.nome}${ ... }`,
src_new = re.sub(
    r"`Colaborador:\s*\$\{\s*p\.nome\s*\}.*?`,",
    r"`Colaborador: ${p.nome} (${labelAux(p)})`,",
    src
)

if src_new != src:
    io.open(path, 'w', encoding='utf-8').write(src_new)
    print(f"   - atualizado: {path}")
else:
    print(f"   - sem mudanças: {path}")
PY
  else
    echo "AVISO: não achei $f (ok)"
  fi
done

echo
echo ">> Conferindo como ficou:"
grep -RIn --line-number "Colaborador:" ./api/financeiro | sed -n '1,120p' || true
