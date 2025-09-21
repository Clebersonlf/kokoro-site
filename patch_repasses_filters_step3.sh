#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILE="admin/financeiro/repasses.html"
UNDO="UNDO_patch_repasses_filters_${TS}.sh"

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

# --- PATCH (injeta barra de filtros acima da tabela e JS para filtrar/ordenar/exportar) ---
python3 - "$FILE" <<'PY'
import io, re, sys
p = sys.argv[1]
s = io.open(p,'r',encoding='utf-8').read()

# 1) Adiciona barra de filtros (HTML) logo acima de <table> do histórico
filtros_html = r'''
<div class="card" id="repasse-filtros" style="margin-top:16px">
  <h2 style="margin-top:0">Filtros, Ordenação e Exportação</h2>
  <div class="form-grid">
    <div class="form-group">
      <label for="f-colaborador">Colaborador</label>
      <input type="text" id="f-colaborador" placeholder="Nome contém..." />
    </div>
    <div class="form-group">
      <label for="f-status">Status</label>
      <select id="f-status">
        <option value="">(todos)</option>
        <option value="pago">Pago</option>
        <option value="pendente">Pendente</option>
      </select>
    </div>
    <div class="form-group">
      <label for="f-data-de">Data de</label>
      <input type="date" id="f-data-de" />
    </div>
    <div class="form-group">
      <label for="f-data-ate">Data até</label>
      <input type="date" id="f-data-ate" />
    </div>
    <div class="form-group">
      <label for="f-min">Valor mín. (R$)</label>
      <input type="number" step="0.01" id="f-min" />
    </div>
    <div class="form-group">
      <label for="f-max">Valor máx. (R$)</label>
      <input type="number" step="0.01" id="f-max" />
    </div>

    <div class="form-group">
      <label for="f-ordenar">Ordenar por</label>
      <select id="f-ordenar">
        <option value="data_desc">Data ↓</option>
        <option value="data_asc">Data ↑</option>
        <option value="valor_desc">Valor ↓</option>
        <option value="valor_asc">Valor ↑</option>
        <option value="colab_asc">Colaborador A-Z</option>
        <option value="colab_desc">Colaborador Z-A</option>
      </select>
    </div>

    <div class="form-actions" style="grid-column:1 / -1">
      <button type="button" class="btn btn-ghost" id="btn-limpar-filtros">Limpar</button>
      <button type="button" class="btn btn-principal" id="btn-aplicar-filtros">Aplicar</button>
      <button type="button" class="btn" id="btn-exportar-csv" style="background:#0ea5e9">Exportar CSV</button>
    </div>
  </div>
</div>
'''.strip()

s = re.sub(
  r'(<h2>\s*Histórico de Lançamentos\s*</h2>\s*)',
  r'\1' + filtros_html + '\n',
  s,
  count=1,
  flags=re.I
)

# 2) Injeta JS: filtro/ordenação/export
js_block = r'''
/* ==== Filtros/Ordenação/Export (Histórico de Repasses) ==== */
(function(){
  // Guarda dataset carregado na aba de repasses (seu script já popula a tabela)
  // Vamos interceptar a criação de linhas para manter um array-base em memória
  const TBL = document.getElementById('tabela-lancamentos');
  if(!TBL) return;

  // Se já existe hook, evita duplicar
  if (window.__kokoroRepassesHookInstalled) return;
  window.__kokoroRepassesHookInstalled = true;

  // Cache das linhas "cruas"
  window.__kokoroRepassesData = window.__kokoroRepassesData || [];

  // Função util para (re)renderizar a tabela a partir do array
  function renderTabela(linhas){
    TBL.innerHTML = '';
    for(const r of linhas){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.data}</td>
        <td>${r.colaborador||'—'}</td>
        <td>${r.desc||'—'}</td>
        <td class="valor">${r.valor_fmt||'R$ 0,00'}</td>
        <td>${r.status_badge||''}</td>
        <td>${r.acoes_html||''}</td>
      `;
      TBL.appendChild(tr);
    }
  }

  // Tenta descobrir se já existe função que popula a tabela; se existir, envolvemos ela
  const _append = (rowObj)=>{
    // rowObj: {data, colaborador, desc, valor, valor_fmt, status('pago'|'pendente'), status_badge, acoes_html}
    window.__kokoroRepassesData.push(rowObj);
  };
  window.kokoroAppendRepasseRow = _append; // expõe helper para seu código existente usar

  // Botões/inputs
  const qColab = document.getElementById('f-colaborador');
  const qStatus = document.getElementById('f-status');
  const qDe = document.getElementById('f-data-de');
  const qAte = document.getElementById('f-data-ate');
  const qMin = document.getElementById('f-min');
  const qMax = document.getElementById('f-max');
  const qOrd = document.getElementById('f-ordenar');

  function parseBRL(s){
    if(!s) return 0;
    if (typeof s === 'number') return s;
    // aceita "R$ 1.234,56"
    const num = String(s).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',', '.');
    return Number(num)||0;
  }

  function aplicaFiltros(){
    const base = window.__kokoroRepassesData.slice();

    // filtros
    const colabTerm = (qColab.value||'').trim().toLowerCase();
    const st = (qStatus.value||'').toLowerCase();
    const de = qDe.value ? new Date(qDe.value+'T00:00:00') : null;
    const ate = qAte.value ? new Date(qAte.value+'T23:59:59') : null;
    const vmin = qMin.value ? Number(qMin.value) : null;
    const vmax = qMax.value ? Number(qMax.value) : null;

    let out = base.filter(r=>{
      // colaborador contains
      if (colabTerm && !(String(r.colaborador||'').toLowerCase().includes(colabTerm))) return false;
      // status
      if (st && String(r.status||'').toLowerCase()!==st) return false;
      // datas (r.data é string dd/mm/aaaa ou aaaa-mm-dd)
      if (de || ate){
        let d;
        const m = String(r.data||'').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) d = new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00`);
        else d = new Date(r.data);
        if (de && d<de) return false;
        if (ate && d>ate) return false;
      }
      // valores
      const v = r.valor!=null ? Number(r.valor) : parseBRL(r.valor_fmt);
      if (vmin!=null && v < vmin) return false;
      if (vmax!=null && v > vmax) return false;
      return true;
    });

    // ordenação
    switch(qOrd.value){
      case 'data_asc': out.sort((a,b)=>new Date(a.data_raw||a.data)-new Date(b.data_raw||b.data)); break;
      case 'data_desc': out.sort((a,b)=>new Date(b.data_raw||b.data)-new Date(a.data_raw||a.data)); break;
      case 'valor_asc': out.sort((a,b)=>(Number(a.valor)||parseBRL(a.valor_fmt))-(Number(b.valor)||parseBRL(b.valor_fmt))); break;
      case 'valor_desc': out.sort((a,b)=>(Number(b.valor)||parseBRL(b.valor_fmt))-(Number(a.valor)||parseBRL(a.valor_fmt))); break;
      case 'colab_asc': out.sort((a,b)=>String(a.colaborador||'').localeCompare(String(b.colaborador||''))); break;
      case 'colab_desc': out.sort((a,b)=>String(b.colaborador||'').localeCompare(String(a.colaborador||''))); break;
    }

    renderTabela(out);
  }

  // Botões
  document.getElementById('btn-aplicar-filtros')?.addEventListener('click', aplicaFiltros);
  document.getElementById('btn-limpar-filtros')?.addEventListener('click', ()=>{
    for (const el of [qColab,qStatus,qDe,qAte,qMin,qMax,qOrd]) {
      if (!el) continue;
      if (el.tagName==='SELECT') el.selectedIndex = 0;
      else el.value = '';
    }
    aplicaFiltros();
  });

  // Export CSV do conjunto filtrado atual (renderizado)
  document.getElementById('btn-exportar-csv')?.addEventListener('click', ()=>{
    // Reaplica para garantir sincronismo
    aplicaFiltros();
    // lê linhas visíveis (tabela atual)
    const rows = [];
    const trs = TBL.querySelectorAll('tr');
    trs.forEach(tr=>{
      const tds = tr.querySelectorAll('td');
      rows.push([
        tds[0]?.innerText||'',
        tds[1]?.innerText||'',
        tds[2]?.innerText||'',
        tds[3]?.innerText||'',
        tds[4]?.innerText||'',
      ]);
    });
    const csv = ['Data,Colaborador,Descrição/Aluno,Valor,Status']
      .concat(rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')))
      .join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'repasses_filtrados.csv';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  });

  // Se o código original já popular a tabela ao carregar, basta chamar aplicaFiltros uma vez no final
  setTimeout(aplicaFiltros, 300);
})();
'''

# injeta antes do fechamento </script> principal da página (no final)
s = re.sub(r'(</script>\s*</body>\s*</html>\s*)$', js_block + r'\n\1', s, count=1, flags=re.I)

io.open(p,'w',encoding='utf-8').write(s)
print("OK: filtros/ordenação/exportação adicionados em", p)
PY
