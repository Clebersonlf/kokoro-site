#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
BASE="admin/financeiro"
FIN="$BASE/repasses.html"
UNDO="UNDO_finish_repasses_${TS}.sh"

[ -f "$FIN" ] || { echo "ERRO: não achei $FIN"; exit 1; }

# ==== UNDO ====
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [ -f "$FIN.bak.$TS" ]; then
  mv -f "$FIN.bak.$TS" "$FIN"
  echo "OK: restaurado $FIN"
else
  echo "Nada para desfazer (backup não encontrado)."
fi
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

cp -f "$FIN" "$FIN.bak.$TS"

# ==== PATCH HTML ====
python3 - <<'PY'
import io,re,sys
fin="admin/financeiro/repasses.html"
s=io.open(fin,'r',encoding='utf-8').read()

# 1) Garante libs jsPDF + html2canvas (para PDF) e Chart.js (cores)
need_html2 = 'html2canvas.min.js' not in s
need_jspdf = 'jspdf.umd.min.js' not in s
need_chart = 'cdn.jsdelivr.net/npm/chart.js' not in s

injections=[]
if need_html2:
  injections.append('<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>')
if need_jspdf:
  injections.append('<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>')
if need_chart:
  injections.append('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>')

if injections:
  s=re.sub(r'</body>','\n'+'\n'.join(injections)+'\n</body>',s,1,flags=re.I)

# 2) Bloco de UI (cores + export)
ui_block = r"""
<style>
  .tools-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:10px 0 16px}
  .tools-row label{font-size:12px;color:#9aa7b5}
  .color-box{display:flex;align-items:center;gap:6px;background:#232323;border:1px solid #3a3a3a;padding:8px 10px;border-radius:10px}
  .export-btn{border:none;padding:10px 14px;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer}
  .export-btn:active{transform:translateY(1px)}
  .export-btn.secondary{background:transparent;border:1px solid #4b5563;color:#e5e7eb}
</style>
<div id="repasses-tools" class="tools-row">
  <div class="color-box"><label>Cor Linha</label><input id="corLinha" type="color" value="#3b82f6"></div>
  <div class="color-box"><label>Cor Pizza</label><input id="corPizza" type="color" value="#10b981"></div>
  <div class="color-box"><label>Cor Colunas</label><input id="corColuna" type="color" value="#f59e0b"></div>
  <button id="btnExportCSV" class="export-btn secondary">Exportar CSV</button>
  <button id="btnPDF" class="export-btn">Gerar PDF</button>
</div>
"""

# tenta inserir o bloco logo depois do <h1> da página
s_new = re.sub(r'(<h1[^>]*>[^<]*Repasses[^<]*</h1>)', r'\1\n'+ui_block, s, count=1, flags=re.I)
if s_new==s:
  # se não achar, insere antes do fechamento do container
  s_new = re.sub(r'</div>\s*</div>\s*</div>\s*</body>', ui_block+r'</div></div></div></body>', s, count=1, flags=re.I)
s=s_new

# 3) JS: wiring de cores + export (usa Chart.js se existir; ignora silencioso se não)
js = r"""
<script>
(function(){
  function $(id){return document.getElementById(id);}

  // ===== CORES (tenta atualizar charts se existirem) =====
  function setIfChart(id, color){
    var cv = document.getElementById(id);
    if(!cv) return;
    if(!cv._chart) return; // espero chart em cv._chart (padrão que usamos)
    try{
      // linha/coluna: 1º dataset
      if (cv._chart.data && cv._chart.data.datasets && cv._chart.data.datasets.length){
        cv._chart.data.datasets.forEach((ds,idx)=>{
          ds.borderColor = color;
          ds.backgroundColor = color;
        });
      }
      cv._chart.update('none');
    }catch(e){}
  }

  var corLinha = $('corLinha'), corPizza = $('corPizza'), corColuna = $('corColuna');
  if(corLinha) corLinha.addEventListener('input', ()=>setIfChart('chartLinha', corLinha.value));
  if(corPizza) corPizza.addEventListener('input', ()=>setIfChart('chartPizza', corPizza.value));
  if(corColuna) corColuna.addEventListener('input', ()=>setIfChart('chartColuna', corColuna.value));

  // ===== CSV (exporta a tabela principal visível) =====
  function exportCSV(){
    // tenta achar uma tabela com dados de repasses:
    var tbl = document.querySelector('#tabela-repasses') || document.querySelector('table');
    if(!tbl){ alert('Tabela não encontrada.'); return; }
    var rows=[...tbl.querySelectorAll('tr')];
    var csv = rows.map(tr=>{
      return [...tr.querySelectorAll('th,td')].map(td=>{
        var t = (td.innerText||'').replace(/\s+/g,' ').trim().replace(/"/g,'""');
        return `"${t}"`;
      }).join(',');
    }).join('\n');
    var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'repasses.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ===== PDF (usa html2canvas + jsPDF) =====
  async function exportPDF(){
    const root = document.querySelector('.container') || document.body;
    if(!window.html2canvas || !window.jspdf){ alert('Libs de PDF não carregadas.'); return; }
    const { jsPDF } = window.jspdf;
    const scale = 2;

    // snapshot do container
    const canvas = await html2canvas(root, {scale});
    const imgData = canvas.toDataURL('image/png');

    // A4 portrait
    const pdf = new jsPDF({unit:'pt', format:'a4', orientation:'p'});
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // calcula proporção para caber
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    const x = (pageW - w)/2, y = 20;

    pdf.addImage(imgData, 'PNG', x, y, w, h);
    pdf.save('repasses.pdf');
  }

  var btnCSV = $('btnExportCSV'), btnPDF = $('btnPDF');
  if(btnCSV) btnCSV.addEventListener('click', exportCSV);
  if(btnPDF) btnPDF.addEventListener('click', exportPDF);

})();
</script>
"""
s = re.sub(r'</body>', js+'\n</body>', s, count=1, flags=re.I)

io.open(fin,'w',encoding='utf-8').write(s)
print("OK: repasses.html patch aplicado.")
PY

echo
echo ">> Deploy produção (Vercel)…"
npx vercel@latest --prod

echo
echo "Pronto! Abra: https://www.planckkokoro.com/admin/financeiro/repasses.html"
echo "Para desfazer: ./$UNDO"
