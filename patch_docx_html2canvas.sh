#!/usr/bin/env bash
set -euo pipefail

FILE="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_docx_html2canvas_${TS}.sh"

[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

cp -f "$FILE" "${FILE}.bak.${TS}"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
mv -f "${FILE}.bak.${TS}" "$FILE"
echo "Restaurado: $FILE"
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

python3 - "$FILE" <<'PY'
import io,sys,re
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()

# garante libs
if 'html2canvas.min.js' not in s:
    s = s.replace('</head>',
        '  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>\n</head>', 1)
if 'docx@' not in s and 'window.docx' not in s:
    s = s.replace('</head>',
        '  <script src="https://cdn.jsdelivr.net/npm/docx@8.0.1/build/index.umd.js"></script>\n</head>', 1)

# remove gerarDOCX antigo
s = re.sub(r'function\s+gerarDOCX\s*\([\s\S]*?\}\s*\n', '', s, count=3)

patch = r"""
<script>
(function(){
  // Lê dados do localStorage e calcula KPIs
  function getFinanceTotals(){
    try{
      // chaves comuns usadas pelo financeiro v2
      const keys = ['kokoro_financeiro_v2','kokoro_financeiro','financeiro'];
      for(const k of keys){
        const raw = localStorage.getItem(k);
        if(!raw) continue;
        const data = JSON.parse(raw);
        const items = Array.isArray(data) ? data : (Array.isArray(data?.lancamentos) ? data.lancamentos : []);
        let receitas = 0, despesas = 0;
        for(const it of items){
          const v = Number(it.valor || it.amount || 0);
          if(!v) continue;
          const tipo = String(it.tipo || it.kind || it.category || '').toLowerCase();
          if (tipo.includes('desp') || tipo.includes('repasse')) despesas += v;
          else receitas += v;
        }
        return {receitas, despesas, saldo: receitas - despesas};
      }
    }catch(e){ console.warn('getFinanceTotals erro', e); }
    return {receitas:0, despesas:0, saldo:0};
  }

  // Captura gráficos: tenta <canvas>, senão "fotografa" cards com html2canvas
  async function captureGraphs(){
    const images = [];

    // 1) canvases diretos (Chart.js)
    const cvs = Array.from(document.querySelectorAll('canvas'));
    for(const c of cvs){
      try{
        images.push(await (await fetch(c.toDataURL('image/png'))).arrayBuffer());
      }catch(_){}
    }
    if(images.length >= 3) return images; // já tem o bastante

    // 2) fallback: "cards" dos gráficos ou seções
    const candidates = []
      .concat(Array.from(document.querySelectorAll('.card')))
      .concat(Array.from(document.querySelectorAll('[data-chart],[data-grafico]')))
      .slice(0,4);

    for(const node of candidates){
      try{
        const can = await html2canvas(node, {backgroundColor: '#ffffff', scale: 2});
        images.push(await (await fetch(can.toDataURL('image/png'))).arrayBuffer());
      }catch(e){ console.warn('html2canvas falhou', e); }
    }
    return images;
  }

  async function gerarDOCX(){
    try{
      const D = window.docx;
      if(!D){ alert('Biblioteca DOCX não carregou.'); return; }

      const {receitas, despesas, saldo} = getFinanceTotals();

      const children = [
        new D.Paragraph({ alignment:D.AlignmentType.CENTER, children:[
          new D.TextRun({ text:'Relatórios Financeiros', bold:true, size:48 })
        ]}),
        new D.Paragraph({ text:'' }),
        new D.Paragraph({ children:[ new D.TextRun({ text:'Resumo', bold:true, underline:{}, color:'2b579a', size:28 }) ]}),
        new D.Table({
          width:{ size:100, type:D.WidthType.PERCENTAGE },
          rows:[
            new D.TableRow({ children:[
              new D.TableCell({children:[new D.Paragraph({children:[new D.TextRun({text:'Indicador', bold:true})]})]}),
              new D.TableCell({children:[new D.Paragraph({children:[new D.TextRun({text:'Valor', bold:true})]})]}),
            ]}),
            new D.TableRow({ children:[
              new D.TableCell({children:[new D.Paragraph('Receitas')]}),
              new D.TableCell({children:[new D.Paragraph(receitas.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}))]}),
            ]}),
            new D.TableRow({ children:[
              new D.TableCell({children:[new D.Paragraph('Despesas + Repasses')]}),
              new D.TableCell({children:[new D.Paragraph(despesas.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}))]}),
            ]}),
            new D.TableRow({ children:[
              new D.TableCell({children:[new D.Paragraph('Saldo')]}),
              new D.TableCell({children:[new D.Paragraph(saldo.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}))]}),
            ]}),
          ]
        }),
        new D.Paragraph({ text:'' }),
        new D.Paragraph({ children:[ new D.TextRun({ text:'Gráficos', bold:true, underline:{}, color:'2b579a', size:28 }) ]}),
        new D.Paragraph({ text:'' }),
      ];

      const imgs = await captureGraphs();
      const doc = new D.Document({ sections:[{ properties:{}, children: [] }] });
      const imgParas = [];
      for(const ab of imgs){
        try{
          const run = D.Media.addImage(doc, ab, 600, 320);
          imgParas.push(new D.Paragraph(run));
          imgParas.push(new D.Paragraph({ text:'' }));
        }catch(e){ console.warn('addImage erro', e); }
      }

      const finalDoc = new D.Document({
        sections:[{ properties:{}, children: children.concat(imgParas) }]
      });

      const blob = await D.Packer.toBlob(finalDoc);
      const a = document.createElement('a');
      a.download = 'relatorios_financeiros.docx';
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }catch(err){
      console.error('DOCX erro:', err);
      alert('Não foi possível gerar o DOCX. Abra o console (F12) para detalhes.');
    }
  }

  // expõe e re-liga o botão
  window.gerarDOCX = gerarDOCX;
  window.addEventListener('DOMContentLoaded', ()=>{
    const idCandidates = ['btn-docx','btnGerarDocx','gerar-docx'];
    let btn = null;
    for(const id of idCandidates){ btn = document.getElementById(id); if(btn) break; }
    if(!btn){
      btn = Array.from(document.querySelectorAll('button,a')).find(b => (b.textContent||'').toLowerCase().includes('gerar docx'));
    }
    if(btn){ btn.onclick = (e)=>{ e.preventDefault(); gerarDOCX(); }; }
  });
})();
</script>
"""

# injeta antes de </body>
s = s.replace('</body>', patch+'\n</body>', 1)

io.open(p,'w',encoding='utf-8').write(s)
print("OK: patch docx+html2canvas aplicado.")
PY

echo ">> Agora faça o deploy:"
echo "   npx vercel@latest --prod"
echo "Depois: atualize a página (Ctrl+F5) e teste o botão Gerar DOCX."
