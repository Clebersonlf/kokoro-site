#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
BASE="admin/financeiro"
REPORT="$BASE/relatorios.html"
FIN="$BASE/financeiro.html"
REP="$BASE/repasses.html"
UNDO="UNDO_add_reports_${TS}.sh"

mkdir -p "$BASE"

# ---------- UNDO ----------
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
echo ">> Desfazendo Relatórios & Gráficos..."
[ -f "$REPORT" ] && rm -f "$REPORT" && echo " - removido: $REPORT"
# restaurar botões nos arquivos, se backup existir
for F in "$FIN" "$REP"; do
  if [ -f "$F.bak.$TS" ]; then
    mv -f "$F.bak.$TS" "$F"
    echo " - restaurado: $F"
  fi
done
echo "OK."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# ---------- 1) relatorios.html ----------
cat > "$REPORT" <<'HTML'
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>KOKORO 心 - Relatórios & Gráficos</title>
  <style>
    :root { --bg:#0f1115; --paper:#141824; --ink:#e6eefc; --muted:#9fb2d3; --b:#25324a; --blue:#2d8cff; --green:#2ecc71; --red:#e74c3c; --amber:#f1c40f; }
    body{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Arial; background:var(--bg); color:var(--ink); margin:0; padding:20px; }
    .topbar{display:flex; gap:10px; justify-content:space-between; align-items:center; margin-bottom:16px}
    .btn{border:1px solid var(--b); background:#101522; color:#cfe0ff; padding:10px 14px; border-radius:10px; text-decoration:none; cursor:pointer}
    .btn:hover{border-color:#3b82f6; color:#e7f1ff}
    .grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px}
    .card{background:linear-gradient(180deg,#141824,#121622); border:1px solid var(--b); border-radius:12px; padding:16px; box-shadow:0 6px 18px rgba(0,0,0,.25)}
    h1{margin:0 0 6px; color:#9ad1ff}
    h2{margin:0 0 10px; color:#cde1ff; font-size:1.05rem; border-bottom:1px solid #223; padding-bottom:8px}
    label{font-size:12px; color:var(--muted)}
    input,select{background:#101522; color:#e6eefc; border:1px solid #2a3550; border-radius:8px; padding:9px 10px; width:100%}
    .row{display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:10px; align-items:end}
    .resumo{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; text-align:center}
    .kpi{background:#0f1524; border:1px solid #24314a; border-radius:12px; padding:12px}
    .kpi h3{margin:4px 0 6px; font-weight:500; color:#96b9ff}
    .kpi p{margin:0; font-weight:800; font-size:1.6rem}
    .hint{font-size:12px; color:#a7b7d6}
    .chart-wrap{padding:8px; background:#0e1422; border:1px solid #222c44; border-radius:10px}
  </style>
  <!-- Chart.js + jsPDF (CDNs) -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
  <div class="topbar">
    <a class="btn" href="/admin/financeiro/financeiro.html">← Voltar Finanças</a>
    <div style="display:flex; gap:8px">
      <button id="btn-atualizar" class="btn">Atualizar</button>
      <button id="btn-pdf" class="btn">Gerar PDF</button>
    </div>
  </div>

  <h1>Relatórios & Gráficos</h1>
  <div class="card">
    <h2>Filtros</h2>
    <div class="row">
      <div>
        <label>Período rápido</label>
        <select id="periodo">
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365" selected>Últimos 12 meses</option>
          <option value="all">Tudo</option>
        </select>
      </div>
      <div>
        <label>De</label>
        <input type="date" id="de">
      </div>
      <div>
        <label>Até</label>
        <input type="date" id="ate">
      </div>
    </div>
    <p class="hint">Fonte de dados v1: lançamentos do painel (localStorage) + repasses (localStorage). Na próxima etapa plugamos no backend /api.</p>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Resumo</h2>
      <div class="resumo">
        <div class="kpi"><h3>Receitas</h3><p id="kpi-receitas">R$ 0,00</p></div>
        <div class="kpi"><h3>Despesas + Repasses</h3><p id="kpi-despesas">R$ 0,00</p></div>
        <div class="kpi"><h3>Saldo</h3><p id="kpi-saldo">R$ 0,00</p></div>
      </div>
    </div>

    <div class="card">
      <h2>Receitas x Despesas (Linha)</h2>
      <div class="chart-wrap"><canvas id="chartLinha" height="180"></canvas></div>
    </div>

    <div class="card">
      <h2>Composição de Receitas (Pizza)</h2>
      <div class="chart-wrap"><canvas id="chartPizza" height="180"></canvas></div>
    </div>

    <div class="card">
      <h2>Repasses por Colaborador (Barras)</h2>
      <div class="chart-wrap"><canvas id="chartBarras" height="180"></canvas></div>
    </div>

    <div class="card">
      <h2>Receitas por Mês (Colunas)</h2>
      <div class="chart-wrap"><canvas id="chartColunas" height="180"></canvas></div>
    </div>
  </div>

<script>
(function(){
  const STORAGE_FIN = 'kokoro_financeiro_v2';
  const STORAGE_REP = 'kokoro_repasses_v1'; // v1: salvamos repasses na tela de repasses

  // helpers
  const BRL = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const fmtYM = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const parseDate = s => { const d=new Date(s); return isNaN(d)?null:d; };

  function loadFin(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_FIN)||'{"lancamentos":[]}'); }catch(_){ return {lancamentos:[]}; }
  }
  function loadRepasses(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_REP)||'{"repasses":[]}'); }catch(_){ return {repasses:[]}; }
  }

  function filterByRange(arr, de, ate){
    return arr.filter(x=>{
      const d = parseDate(x.data || x.pago_em || x.created_at || x.dt);
      if(!d) return false;
      if(de && d < de) return false;
      if(ate && d > ate) return false;
      return true;
    });
  }

  // coleta dados
  function collect(de,ate){
    const fin = loadFin().lancamentos||[];
    const reps = loadRepasses().repasses||[];

    const receitas = filterByRange(fin.filter(x=>x.tipo==='receita'), de, ate);
    const despesas = filterByRange(fin.filter(x=>x.tipo==='despesa'), de, ate);
    const repasses = filterByRange(reps, de, ate);

    // totais
    const totRec = receitas.reduce((s,x)=>s+Number(x.valor||0),0);
    const totDes = despesas.reduce((s,x)=>s+Number(x.valor||0),0);
    const totRep = repasses.reduce((s,x)=>s+Number(x.valor_repasse||x.repasses||x.valor||0),0);

    return { receitas, despesas, repasses, totRec, totDes: totDes+totRep };
  }

  // gráficos
  let gLinha, gPizza, gBarras, gColunas;

  function renderCharts(dados){
    const byMonth = {};
    const all = [
      ...dados.receitas.map(x=>({k:fmtYM(new Date(x.data)), t:'R', v:+x.valor||0})),
      ...dados.despesas.map(x=>({k:fmtYM(new Date(x.data)), t:'D', v:+x.valor||0})),
      ...dados.repasses.map(x=>({k:fmtYM(new Date(x.pago_em||x.data)), t:'P', v:+(x.valor_repasse||x.valor||0)})),
    ];
    all.forEach(r=>{
      byMonth[r.k] = byMonth[r.k] || {R:0,D:0,P:0};
      byMonth[r.k][r.t]+=r.v;
    });
    const labels = Object.keys(byMonth).sort();
    const dsR = labels.map(k=>byMonth[k].R);
    const dsDP = labels.map(k=>byMonth[k].D + byMonth[k].P);

    // Linha
    gLinha && gLinha.destroy();
    gLinha = new Chart(document.getElementById('chartLinha'), {
      type:'line',
      data:{ labels, datasets:[
        { label:'Receitas', data:dsR },
        { label:'Despesas + Repasses', data:dsDP }
      ]},
      options:{ responsive:true, maintainAspectRatio:false }
    });

    // Pizza (composição receitas por item)
    const comp = {};
    dados.receitas.forEach(x=>{
      const item = x.item || 'Outros';
      comp[item] = (comp[item]||0) + (+x.valor||0);
    });
    const lblComp = Object.keys(comp);
    const valComp = lblComp.map(k=>comp[k]);
    gPizza && gPizza.destroy();
    gPizza = new Chart(document.getElementById('chartPizza'), {
      type:'pie', data:{ labels:lblComp, datasets:[{ data:valComp }]},
      options:{ responsive:true, maintainAspectRatio:false }
    });

    // Barras (repasses por colaborador)
    const porColab = {};
    dados.repasses.forEach(r=>{
      const nome = r.nome || r.professor_nome || r.professor_id || '—';
      porColab[nome] = (porColab[nome]||0) + (+r.valor_repasse||+r.valor||0);
    });
    const lblColab = Object.keys(porColab);
    const valColab = lblColab.map(k=>porColab[k]);
    gBarras && gBarras.destroy();
    gBarras = new Chart(document.getElementById('chartBarras'), {
      type:'bar', data:{ labels:lblColab, datasets:[{ label:'R$', data:valColab }]},
      options:{ responsive:true, maintainAspectRatio:false }
    });

    // Colunas (receitas por mês)
    gColunas && gColunas.destroy();
    gColunas = new Chart(document.getElementById('chartColunas'), {
      type:'bar', data:{ labels, datasets:[{ label:'Receitas', data:dsR }]},
      options:{ responsive:true, maintainAspectRatio:false }
    });
  }

  function refresh(){
    const sel = document.getElementById('periodo').value;
    const deI = document.getElementById('de').value;
    const ateI = document.getElementById('ate').value;
    let de=null, ate=null;

    if(deI) de = new Date(deI+'T00:00:00');
    if(ateI) ate = new Date(ateI+'T23:59:59');
    if(sel!=='all' && !deI && !ateI){
      const days = +sel;
      ate = new Date();
      de = new Date(); de.setDate(ate.getDate()-days);
    }

    const d = collect(de,ate);
    document.getElementById('kpi-receitas').textContent = BRL(d.totRec);
    document.getElementById('kpi-despesas').textContent = BRL(d.totDes);
    document.getElementById('kpi-saldo').textContent = BRL(d.totRec - d.totDes);
    renderCharts(d);
    window.__last_dataset__ = d; // para PDF
  }

  async function exportPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const d = window.__last_dataset__ || collect(null,null);

    // capa
    doc.setFontSize(18); doc.text('KOKORO 心 — Relatórios Financeiros', 40, 60);
    doc.setFontSize(12); doc.text('Resumo & gráficos (v1 localStorage)', 40, 80);

    // KPIs
    doc.setFontSize(13);
    doc.text(`Receitas: ${ (d.totRec||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }`, 40, 120);
    doc.text(`Despesas + Repasses: ${ (d.totDes||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }`, 40, 140);
    doc.text(`Saldo: ${ ( (d.totRec-d.totDes)||0 ).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }`, 40, 160);

    // inserir gráficos como imagens
    const charts = ['chartLinha','chartPizza','chartBarras','chartColunas'];
    let y = 200;
    for (const id of charts){
      const c = document.getElementById(id);
      if(!c) continue;
      const img = c.toDataURL('image/png', 1.0);
      if(y > 720){ doc.addPage(); y=60; }
      doc.addImage(img, 'PNG', 40, y, 515, 180); y += 200;
    }

    // tabela simples (top 20 receitas)
    const rows = (d.receitas||[]).slice(0,20).map(r=>[r.data||'-', r.item||'-', (r.aluno||'-'), (Number(r.valor)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) ]);
    if(rows.length){
      if(y > 680){ doc.addPage(); y=60; }
      doc.autoTable({ startY:y, head:[['Data','Item','Aluno','Valor']], body: rows });
    }

    doc.save('relatorio_kokoro.pdf');
  }

  document.getElementById('btn-atualizar').addEventListener('click', refresh);
  document.getElementById('btn-pdf').addEventListener('click', exportPDF);
  document.getElementById('periodo').addEventListener('change', ()=>{ document.getElementById('de').value=''; document.getElementById('ate').value=''; refresh(); });
  ['de','ate'].forEach(id=>document.getElementById(id).addEventListener('change', ()=>{ document.getElementById('periodo').value='all'; refresh(); }));

  // inicial
  refresh();
})();
</script>
</body>
</html>
HTML

# ---------- 2) patch: botão "Relatórios" no financeiro.html ----------
if [ -f "$FIN" ]; then
  cp -f "$FIN" "$FIN.bak.$TS"
  python3 - "$FIN" <<'PY'
import io,sys,re
p=sys.argv[1]; s=io.open(p,'r',encoding='utf-8').read()
btn = '\n<nav class="topbar"><a class="btn-back" href="/admin/index.html"><span class="chevron">←</span> Voltar ao Admin</a><a class="btn-back" href="/admin/financeiro/relatorios.html">📊 Relatórios</a></nav>'
if 'href="/admin/financeiro/relatorios.html"' not in s:
    s=re.sub(r'(<nav class="topbar">[\s\S]*?</nav>)', btn, s, count=1)
io.open(p,'w',encoding='utf-8').write(s)
print("patched:",p)
PY
fi

# ---------- 3) patch: botão "Relatórios" no repasses.html ----------
if [ -f "$REP" ]; then
  cp -f "$REP" "$REP.bak.$TS"
  python3 - "$REP" <<'PY'
import io,sys,re
p=sys.argv[1]; s=io.open(p,'r',encoding='utf-8').read()
btn = '<a class="btn-back" href="/admin/financeiro/relatorios.html" style="margin-left:8px">📊 Relatórios</a>'
if 'href="/admin/financeiro/relatorios.html"' not in s:
    s=s.replace('Voltar ao Admin</a>', 'Voltar ao Admin</a>'+btn)
io.open(p,'w',encoding='utf-8').write(s)
print("patched:",p)
PY
fi

echo "OK. Página criada em $REPORT"
echo "Para desfazer: ./$UNDO"
