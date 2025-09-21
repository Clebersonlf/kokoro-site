#!/usr/bin/env bash
set -euo pipefail

REL="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_patch_reports_docx_colors_${TS}.sh"

[ -f "$REL" ] || { echo "ERRO: não encontrei $REL"; exit 1; }

cp -f "$REL" "$REL.bak.$TS"

cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
[ -f "$REL.bak.$TS" ] && mv -f "$REL.bak.$TS" "$REL" && echo "Restaurado: $REL"
echo "OK."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# 1) Injeta CDNs docx + FileSaver (se faltar)
if ! grep -q 'cdn.jsdelivr.net/npm/docx@' "$REL"; then
  sed -i 's#</head>#  <script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"></script>\n  <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>\n</head>#' "$REL"
  echo " - CDNs do DOCX e FileSaver injetadas"
else
  echo " - CDNs já presentes"
fi

# 2) Insere painel de cores (se não existir)
if ! grep -q 'data-kokoro-colors-panel' "$REL"; then
  sed -i 's#<body[^>]*>#&\n\n<!-- Painel de Cores (Kokoro) -->\n<div data-kokoro-colors-panel style="position:relative;z-index:1;max-width:1200px;margin:0 auto 12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">\n  <strong style=\"opacity:.85\">🎨 Cores dos gráficos:</strong>\n  <label> Principal <input type=\"color\" id=\"cor-principal\" value=\"#3b82f6\"></label>\n  <label> Borda <input type=\"color\" id=\"cor-borda\" value=\"#1e40af\"></label>\n  <label> Pizza (lista, vírgula) <input type=\"text\" id=\"cores-pizza\" placeholder=\"#3b82f6,#10b981,#f59e0b,#ef4444\" style=\"width:280px\"></label>\n  <button id=\"aplicar-cores\" type=\"button\" style=\"padding:6px 10px;border-radius:8px;border:1px solid #444;background:#222;color:#eee;cursor:pointer\">Aplicar</button>\n</div>\n#' "$REL"
  echo " - Painel de cores inserido"
else
  echo " - Painel de cores já existia"
fi

# 3) Remove bloco antigo gerarDOCX (se houver) e insere novo + lógica de cores
sed -i '/KOKORO_DOCX_START/,/KOKORO_DOCX_END/d' "$REL"

cat >> "$REL" <<'EOF'
<script>
// KOKORO_DOCX_START
(function(){
  // ---- Utilidades ----
  const qs  = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const BRL = n => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  // Alguns ids usados na página de relatórios; ajuste se seus canvases tiverem outros ids:
  const CHART_IDS = ['chartLinha','chartColunas','chartBarras','chartPizza'];

  // tenta achar instâncias Chart.js já criadas
  function getCharts(){
    // se o app guardou numa global, usa; senão tenta dos canvases
    const found = [];
    if (window._kokoroCharts && Array.isArray(window._kokoroCharts)){
      window._kokoroCharts.forEach(c=>{ if(c && c.update) found.push(c); });
    }
    CHART_IDS.forEach(id=>{
      const cv = document.getElementById(id);
      if (!cv) return;
      const inst = cv.__chartist || cv.__chart || cv._chart || cv.chart || (window.Chart && Chart.getChart && Chart.getChart(cv));
      if (inst && inst.update && !found.includes(inst)) found.push(inst);
    });
    return found;
  }

  // ---- Aplicar Cores ----
  function aplicarCores(){
    const cPrincipal = qs('#cor-principal')?.value || '#3b82f6';
    const cBorda     = qs('#cor-borda')?.value     || '#1e40af';
    const listaPizza = (qs('#cores-pizza')?.value || '').trim();

    const charts = getCharts();
    charts.forEach(ch=>{
      try{
        if (ch.config.type === 'pie' || ch.config.type === 'doughnut'){
          if (listaPizza){
            const arr = listaPizza.split(',').map(s=>s.trim()).filter(Boolean);
            if (ch.data && ch.data.datasets && ch.data.datasets[0]){
              ch.data.datasets[0].backgroundColor = arr;
              ch.data.datasets[0].borderColor = arr.map(()=> '#111'); // borda discreta
            }
          }
        } else {
          // linha/colunas/barras
          (ch.data?.datasets||[]).forEach(ds=>{
            if (Array.isArray(ds.backgroundColor)) {
              ds.backgroundColor = ds.backgroundColor.map(()=> cPrincipal);
            } else {
              ds.backgroundColor = cPrincipal + (ch.config.type==='line' ? '55' : ''); // leve transparência para line
            }
            ds.borderColor = cBorda;
          });
        }
        ch.update('none');
      }catch(_){}
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const btnCores = document.getElementById('aplicar-cores');
    if (btnCores) btnCores.addEventListener('click', aplicarCores);
  });

  // ---- DOCX ----
  async function gerarDOCX(){
    try{
      if (!(window.docx && window.saveAs)){
        alert('Bibliotecas para DOCX ainda não carregadas. Recarregue a página (Ctrl+Shift+R).');
        return;
      }
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, Media } = docx;

      const totalRec  = (qs('#total-receitas')||{}).textContent || '';
      const totalDesp = (qs('#total-despesas')||{}).textContent || '';
      const saldo     = (qs('#saldo-final')||{}).textContent || '';

      const doc = new Document({
        sections: [{ children: [
          new Paragraph({ text: 'Relatórios Financeiros', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Resumo', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: `Total de Receitas: ${totalRec}` }),
          new Paragraph({ text: `Total de Despesas: ${totalDesp}` }),
          new Paragraph({ text: `Saldo Final: ${saldo}` }),
          new Paragraph({ text: ' ' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ children:[ new Paragraph({children:[new TextRun({text:'Indicador',bold:true})]}) ]}),
                new TableCell({ children:[ new Paragraph({children:[new TextRun({text:'Valor',bold:true})]}) ]}),
              ]}),
              new TableRow({ children: [
                new TableCell({ children:[ new Paragraph('Receitas') ]}),
                new TableCell({ children:[ new Paragraph(totalRec) ]}),
              ]}),
              new TableRow({ children: [
                new TableCell({ children:[ new Paragraph('Despesas') ]}),
                new TableCell({ children:[ new Paragraph(totalDesp) ]}),
              ]}),
              new TableRow({ children: [
                new TableCell({ children:[ new Paragraph('Saldo') ]}),
                new TableCell({ children:[ new Paragraph(saldo) ]}),
              ]}),
            ]
          }),
          new Paragraph({ text: ' ' }),
          new Paragraph({ text: 'Gráficos', heading: HeadingLevel.HEADING_2 }),
        ]}]
      });

      // adiciona canvases como imagens
      for (const id of CHART_IDS){
        const cv = document.getElementById(id);
        if (!cv) continue;
        try{
          const dataUrl = cv.toDataURL('image/png', 1.0);
          const base64 = dataUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
          const image = Media.addImage(doc, bytes, 600, 320);
          doc.Sections[0].children.push(new Paragraph({ text: id, heading: HeadingLevel.HEADING_3 }));
          doc.Sections[0].children.push(new Paragraph(image));
          doc.Sections[0].children.push(new Paragraph({ text: ' ' }));
        }catch(err){
          console.warn('Falha ao capturar canvas', id, err);
        }
      }

      const blob = await Packer.toBlob(doc);
      const nome = `Relatorio_Financeiro_${new Date().toISOString().slice(0,10)}.docx`;
      saveAs(blob, nome);
    }catch(err){
      console.error(err);
      alert('Não foi possível gerar o DOCX. Veja o console (F12) para detalhes.');
    }
  }

  // Conecta no botão
  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('btn-docx') || document.querySelector('[data-action="gerar-docx"]');
    if (btn){
      btn.disabled = false;
      btn.addEventListener('click', gerarDOCX);
    }
  });
})();
 // KOKORO_DOCX_END
</script>
EOF
echo " - Funções (cores + DOCX) aplicadas"

echo ">> Deploy (produção)…"
npx vercel@latest --prod

echo
echo "Pronto! Recarregue /admin/financeiro/relatorios.html com Ctrl+Shift+R."
echo "Se precisar desfazer: ./$UNDO"
