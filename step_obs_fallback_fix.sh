#!/usr/bin/env bash
set -euo pipefail

files=( \
  "./api/financeiro/recibo.js" \
  "./api/financeiro/recibo_email.js" \
  "./api/financeiro/recibo_whatsapp.js" \
)

echo ">> Backups e correção via Python..."
for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f (ok)"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - <<'PY' "$f"
import re, sys, io, os
path = sys.argv[1]
with io.open(path, 'r', encoding='utf-8') as fh:
    src = fh.read()

# alvo final
final_line = "      `Obs.: ${ (observacao && observacao.trim()) || ('Repasse ' + new Date(pago_em || Date.now()).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'})) }`,"

# regex pega:
# 1) a forma antiga:   observacao ? `Obs.: ${observacao}` : null,
# 2) qualquer linha já corrompida que comece com `Obs.: ${ ... }`,
pat = re.compile(r"""^[ \t]*(?:observacao\s*\?\s*`Obs\.: \${observacao}`\s*:\s*null,|`Obs\.: \${.*?}`,)[ \t]*$""",
                 re.M | re.S)

new, n = pat.subn(final_line, src)

if n == 0:
    # como fallback, se ainda tiver o trecho antigo dentro da linha mais longa, tenta um replace simples
    new = src.replace("observacao ? `Obs.: ${observacao}` : null,", final_line)

with io.open(path, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(new)

print(f"   - corrigido: {os.path.basename(path)}")
PY

  # mostra 10 linhas de contexto ao redor da nova linha
  echo "----- contexto em $f -----"
  nl -ba "$f" | awk '
    /`Obs\.: \${ \(observacao/ { ln=NR }
    { lines[NR]=$0 }
    END {
      if (ln>0) {
        start=ln-5; if (start<1) start=1
        end=ln+5
        for (i=start;i<=end;i++) if (i in lines) print lines[i]
      } else {
        print "(obs line não encontrada)"
      }
    }'
done
