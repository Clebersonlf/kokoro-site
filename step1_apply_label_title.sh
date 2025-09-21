#!/usr/bin/env bash
set -euo pipefail

FILES=( "./api/financeiro/recibo.js" "./api/financeiro/recibo_email.js" "./api/financeiro/recibo_whatsapp.js" )

echo ">> Passo 1: inserir helper labelTitle() (se faltar) e corrigir a linha 'Colaborador:'"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "AVISO: não achei $f"; continue; }
  cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"

  python3 - "$f" <<'PY'
import io, sys, re
path = sys.argv[1]
src  = io.open(path, 'r', encoding='utf-8').read()

# --- 1) Injetar helper labelTitle() (se ainda não existir) ---
if 'function labelTitle(' not in src:
    helper = '''
function labelTitle(p, extra){
  const e = extra || {};
  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));

  // normaliza/remover acentos p/ comparações simples
  const norm = s => String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  const f = norm(rawFaixa);

  // 0) Titular tem prioridade
  if (titular) return 'Prof. Titular';

  // 1) Faixas básicas -> títulos
  if (f.includes('azul'))  return 'Mon.';     // Monitor
  if (f.includes('roxa'))  return 'Mon.';     // Monitor
  if (f.includes('marrom'))return 'Instr.';   // Instrutor

  // 2) Pretas por grau (0..10)
  if (f.includes('preta') || f.includes('black')) {
    // tenta achar número do grau (ex.: "preta 3", "3º", "3o")
    const m = f.match(/(\\d{1,2})/);
    const grau = m ? parseInt(m[1],10) : 0;

    if (grau <= 2) return 'Instr.';           // Preta lisa/1º/2º -> Instr.
    if (grau <= 6) return 'Prof.';            // 3º..6º -> Professor
    if (grau === 7) return 'Me.';             // Mestre (vermelha/preta – mas se vier como "preta 7" cai aqui)
    if (grau === 8) return 'G.M.';            // Grande Mestre
    if (grau === 9) return 'Gr.M.';           // Grão-Mestre
    if (grau >=10) return 'V.M.';             // Venerável Mestre
    return 'Instr.';                           // default preta sem grau especificado
  }

  // 3) Faixas vermelhas (casos especiais, se vierem assim no texto)
  if (f.includes('vermelha') && f.includes('preta'))   return 'Me.';   // 7º
  if (f.includes('vermelha') && f.includes('branca'))  return 'G.M.';  // 8º
  if (f === 'vermelha 9' || f.includes('grao') )       return 'Gr.M.'; // 9º
  if (f.includes('vermelha') && f.match(/10/))         return 'V.M.';  // 10º

  // 4) fallback
  return 'Colaborador';
}
'''.lstrip()

    # injeta o helper logo após o primeiro import (ou no topo)
    m = re.search(r'^(import\\s+[^\\n]+\\n)', src, flags=re.M)
    if m:
      src = src[:m.end()] + helper + src[m.end():]
    else:
      src = helper + src

# --- 2) Forçar a linha "Colaborador:" a usar labelTitle + limpar sufixo existente no nome ---
extra = 'src' if path.endswith('recibo.js') else '(req.body || {})'
new_line = f'      `Colaborador: ${{ String((p.nome||"")).replace(/\\s*\\([^)]*\\)\\s*$/, "").trim() }} (${{labelTitle(p, {extra})}})`,'
pat = re.compile(r'^[ \t]*`Colaborador:.*?`,[ \t]*$', re.M)

if not pat.search(src):
    # tenta uma variante com asterisco em recibo.js/whatsapp.js
    pat2 = re.compile(r'^[ \t]*[`\\*]Colaborador:.*?`,[ \t]*$', re.M)
    if pat2.search(src):
        src = pat2.sub(new_line, src, count=1)
    else:
        # por via das dúvidas, insere após o cabeçalho (Recibo de Repasse / *Recibo de Repasse*)
        hdr = re.search(r'^\\s*[`\\*]Recibo de Repasse[`\\*]?,?\\s*$', src, re.M)
        if hdr:
            insert_at = hdr.end()
            src = src[:insert_at] + '\\n' + new_line + src[insert_at:]
        else:
            print('AVISO: não achei a linha "Colaborador:" para substituir em', path)
else:
    src = pat.sub(new_line, src, count=1)

io.open(path, 'w', encoding='utf-8').write(src)
print('   - atualizado:', path)
PY
done

echo
echo ">> Passo 1 OK. Vamos conferir rapidamente as linhas:"
grep -RIn "function labelTitle" ./api/financeiro | sed -n '1,120p' || true
grep -RIn "Colaborador:" ./api/financeiro | sed -n '1,200p' || true

echo
echo "Pronto. Me envie o resultado acima e eu te passo o PASSO 2 (deploy+testes)."
