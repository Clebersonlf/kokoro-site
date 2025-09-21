#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILE="admin/financeiro/repasses.html"
UNDO="UNDO_repasses_full_${TS}.sh"

[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

# --- UNDO ---
cp -f "$FILE" "$FILE.bak.$TS"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
echo ">> Restaurando $FILE do backup $FILE.bak.$TS ..."
cp -f "$FILE.bak.$TS" "$FILE"
echo "OK."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

python3 - "$FILE" <<'PY'
import io, re, sys
p = sys.argv[1]
s = io.open(p,'r',encoding='utf-8').read()

# 1) Injeta bloco de resumo
if 'id="repasses-resumo"' not in s:
  s = re.sub(
    r'(<h2[^>]*>\s*Repasses\s*<\/h2>\s*<div[^>]+class="card"[^>]*>)',
    r'''\\1
      <div class="card" id="resumo-wrapper" style="margin-top:14px">
        <h3 style="margin:0 0 10px">Resumo (linhas filtradas)</h3>
        <div id="repasses-resumo" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:10px">
          <div class="card mini" style="padding:12px">
            <div style="font-size:12px;color:#9aa7b5">Total</div>
            <div id="res-total" style="font-weight:700;font-size:20px">R$ 0,00</div>
          </div>
          <div class="card mini" style="padding:12px">
            <div style="font-size:12px;color:#9aa7b5">Qtd. Linhas</div>
            <div id="res-qtd" style="font-weight:700;font-size:20px">0</div>
          </div>
          <div class="card mini" style="padding:12px">
            <div style="font-size:12px;color:#9aa7b5">Ticket Médio</div>
            <div id="res-media" style="font-weight:700;font-size:20px">R$ 0,00</div>
          </div>
          <div class="card mini" style="padding:12px">
            <div style="font-size:12px;color:#9aa7b5">Top Colaborador</div>
            <div id="res-top" style="font-weight:700;font-size:14px">—</div>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:10px;border-bottom:1px solid #2d2d2d;font-weight:600">Por colaborador</div>
          <div style="max-height:280px;overflow:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#22313f;color:#fff">
                  <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #2d2d2d">Colaborador</th>
                  <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #2d2d2d">Qtd</th>
                  <th style="text-align:right;padding:8px 10px;border-bottom:1px solid #2d2d2d">Total</th>
                </tr>
              </thead>
              <tbody id="tb-por-colab"></tbody>
            </table>
          </div>
        </div>
      </div>
    ''',
    s, count=1, flags=re.I|re.S
  )

# 2) Injeta script de cálculo
js = r'''
<script>
(function(){
  const tabela = document.getElementById('tabela-lancamentos');
  if(!tabela) return;

  const elTotal = document.getElementById('res-total');
  const elQtd   = document.getElementById('res-qtd');
  const elMedia = document.getElementById('res-media');
  const elTop   = document.getElementById('res-top');
  const tbBody  = document.getElementById('tb-por-colab');

  function parseBRL(s){
    if(!s) return 0;
    const num = String(s).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',', '.');
    return Number(num)||0;
  }
  function fmtBRL(n){
    return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }

  function recompute(){
    const map = new Map();
    let total = 0, qtd = 0;

    tabela.querySelectorAll('tr').forEach(tr=>{
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 5 && tr.offsetParent !== null) {
        const nome  = (tds[1]?.innerText||'').trim() || '—';
        const valor = parseBRL(tds[3]?.innerText||'');
        if(!Number.isFinite(valor)) return;
        total += valor; qtd += 1;
        const cur = map.get(nome) || {q:0, t:0};
        cur.q += 1; cur.t += valor;
        map.set(nome, cur);
      }
    });

    elTotal.textContent = fmtBRL(total);
    elQtd.textContent   = String(qtd);
    elMedia.textContent = fmtBRL(qtd ? (total/qtd) : 0);

    let topNome = '—', topVal = -1;
    for(const [nome,agg] of map.entries()){
      if(agg.t > topVal){ topVal = agg.t; topNome = `${nome} (${fmtBRL(agg.t)})`; }
    }
    elTop.textContent = topNome;

    const arr = Array.from(map.entries()).map(([nome,agg])=>({nome,q:agg.q,t:agg.t}));
    arr.sort((a,b)=>b.t - a.t);
    tbBody.innerHTML = arr.map(r=>`
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #2d2d2d">${r.nome}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #2d2d2d;text-align:right">${r.q}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #2d2d2d;text-align:right">${fmtBRL(r.t)}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="padding:10px;color:#9aa7b5">Sem linhas</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', recompute);
  const mo = new MutationObserver(()=>recompute());
  mo.observe(tabela, {childList:true, subtree:true, characterData:true});

  ['f-colaborador','f-status','f-data-de','f-data-ate','f-min','f-max','f-ordenar'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', ()=>setTimeout(recompute, 50));
    if(el) el.addEventListener('change', ()=>setTimeout(recompute, 50));
  });
  const btnAplicar = document.getElementById('btn-aplicar-filtros');
  if(btnAplicar) btnAplicar.addEventListener('click', ()=>setTimeout(recompute, 80));

  setTimeout(recompute, 1000);
})();
</script>
'''
s = re.sub(r'(</body>\s*</html>\s*)$', js + r'\n\\1', s, count=1, flags=re.I)

io.open(p,'w',encoding='utf-8').write(s)
print("OK: resumo + script adicionados")
PY
