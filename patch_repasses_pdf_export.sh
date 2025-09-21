#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILE="admin/financeiro/repasses.html"
UNDO="UNDO_patch_repasses_pdf_${TS}.sh"

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

# 1) Garante que exista o botão "Exportar PDF (imprimir)" na barra de filtros
s = re.sub(
  r'(<button[^>]*id=["\']?btn-exportar-csv["\']?[^>]*>[^<]*Exportar CSV[^<]*</button>)',
  r'\1\n      <button type="button" class="btn" id="btn-exportar-pdf" style="background:#10b981">Exportar PDF (imprimir)</button>',
  s,
  count=1,
  flags=re.I
)

# 2) Injeta o JS do export PDF antes de </script></body></html>
js = r'''
/* ==== Exportar PDF (imprimir) da tabela filtrada ==== */
(function(){
  const btn = document.getElementById('btn-exportar-pdf');
  const tbl = document.getElementById('tabela-lancamentos');
  if(!btn || !tbl) return;

  function parseBRL(s){
    if(!s) return 0;
    const num = String(s).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',', '.');
    return Number(num)||0;
  }

  function getFiltrosResumo(){
    const get = id => document.getElementById(id);
    const v = el => el ? el.value : '';
    return {
      colaborador: v(get('f-colaborador')),
      status:      v(get('f-status')),
      de:          v(get('f-data-de')),
      ate:         v(get('f-data-ate')),
      min:         v(get('f-min')),
      max:         v(get('f-max')),
      ord:         v(get('f-ordenar')),
    };
  }

  btn.addEventListener('click', ()=>{
    // Coleta linhas visíveis da tabela
    const rows = [];
    let total = 0;
    tbl.querySelectorAll('tr').forEach(tr=>{
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 5) {
        const linha = {
          data: tds[0].innerText || '',
          colaborador: tds[1].innerText || '',
          desc: tds[2].innerText || '',
          valor: tds[3].innerText || '',
          status: tds[4].innerText || ''
        };
        rows.push(linha);
        total += parseBRL(linha.valor);
      }
    });

    // Monta HTML de impressão
    const filtros = getFiltrosResumo();
    const dt = new Date();
    const pad2 = n=>String(n).padStart(2,'0');
    const agora = `${pad2(dt.getDate())}/${pad2(dt.getMonth()+1)}/${dt.getFullYear()} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;

    const css = `
      <style>
        @media print {
          @page { size: A4 portrait; margin: 16mm; }
        }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111; }
        h1 { margin:0 0 6px; font-size:18pt; }
        .muted { color:#555; font-size:10pt; margin-bottom:14px; }
        .chips { display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 14px; }
        .chip { background:#eef2ff; border:1px solid #c7d2fe; color:#1e293b; padding:4px 8px; border-radius:999px; font-size:9pt; }
        table { width:100%; border-collapse: collapse; }
        th, td { border-bottom:1px solid #e5e7eb; padding:8px 10px; font-size:10.5pt; text-align:left; }
        th { background:#f8fafc; }
        td.valor, th.valor { text-align: right; white-space: nowrap; }
        .total { text-align:right; font-weight:700; margin-top:10px; }
        .footer { margin-top:24px; font-size:9pt; color:#555; }
      </style>
    `;

    const tableHead = `
      <thead>
        <tr>
          <th>Data</th>
          <th>Colaborador</th>
          <th>Descrição / Aluno</th>
          <th class="valor">Valor</th>
          <th>Status</th>
        </tr>
      </thead>`;

    const tableBody = rows.map(r=>`
      <tr>
        <td>${r.data}</td>
        <td>${r.colaborador}</td>
        <td>${r.desc}</td>
        <td class="valor">${r.valor}</td>
        <td>${r.status}</td>
      </tr>
    `).join('');

    const filtrosChips = Object.entries(filtros)
      .filter(([k,v])=>String(v||'').trim()!=='')
      .map(([k,v])=>`<span class="chip">${k}: <b>${String(v)}</b></span>`).join('');

    const somaFmt = total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

    const html = `
      <!doctype html>
      <html>
      <head><meta charset="utf-8">${css}<title>Repasses - PDF</title></head>
      <body>
        <h1>Relatório de Repasses (Filtrados)</h1>
        <div class="muted">Gerado em ${agora} • planckkokoro.com</div>
        <div class="chips">${filtrosChips || '<span class="chip">Sem filtros</span>'}</div>
        <table>${tableHead}<tbody>${tableBody}</tbody></table>
        <div class="total">Total (linhas visíveis): <span>${somaFmt}</span></div>
        <div class="footer">Observação: este PDF reflete exatamente o que está filtrado/visível na tela de repasses.</div>
        <script>window.print(); setTimeout(()=>window.close(), 400);</script>
      </body>
      </html>
    `;

    const w = window.open('', '_blank', 'width=1024,height=768');
    if (!w) return alert('Bloqueado pelo navegador. Permita pop-ups para gerar o PDF.');
    w.document.open(); w.document.write(html); w.document.close();
  });
})();
'''

s = re.sub(r'(</script>\s*</body>\s*</html>\s*)$', js + r'\n\1', s, count=1, flags=re.I)

io.open(p,'w',encoding='utf-8').write(s)
print("OK: exportar PDF adicionado em", p)
PY
