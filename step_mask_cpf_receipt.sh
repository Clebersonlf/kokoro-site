#!/usr/bin/env bash
set -euo pipefail

files=( \
  "./api/financeiro/recibo.js" \
  "./api/financeiro/recibo_email.js" \
  "./api/financeiro/recibo_whatsapp.js" \
)

echo ">> Backups e patch para formatar CPF (###.###.###-##)..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src = io.open(path, 'r', encoding='utf-8').read()

# 1) Injeta helper fmtDoc() se ainda não existir
if 'function fmtDoc(' not in src and 'const fmtDoc =' not in src:
    src = src.replace(
        '\n',
        '''
function fmtDoc(s){
  const raw = String(s||'').replace(/\\D/g,'');
  if (raw.length === 11) { // CPF
    return raw.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');
  }
  return s || '—';
}
''', 1
    )

# 2) Troca a linha do "Favorecido: ... (doc)" para usar fmtDoc()
src = re.sub(
    r'`Favorecido:\s*\$\{p\.favorecido_nome\s*\|\|\s*\'—\'\}\s*\(\$\{p\.doc_favorecido\s*\|\|\s*\'—\'\}\)\s*`,',
    r'`Favorecido: ${p.favorecido_nome || "—"} (${fmtDoc(p.doc_favorecido)})`,',
    src
)

io.open(path, 'w', encoding='utf-8').write(src)
print(f"   - atualizado: {path}")
PY
done

echo
echo ">> Conferindo ocorrências após o patch:"
grep -RIn --line-number "Favorecido:" ./api/financeiro | sed -n '1,200p' || true
