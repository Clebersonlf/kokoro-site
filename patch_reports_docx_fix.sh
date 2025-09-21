#!/usr/bin/env bash
set -euo pipefail

REL="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_patch_reports_docx_fix_${TS}.sh"

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

# Garante CDNs (docx + FileSaver)
if ! grep -q 'cdn.jsdelivr.net/npm/docx@' "$REL"; then
  sed -i 's#</head>#  <script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"></script>\n  <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>\n</head>#' "$REL"
  echo " - CDNs do DOCX e FileSaver injetadas"
else
  echo " - CDNs já presentes"
fi

# Substitui o bloco antigo entre marcadores (se houver) e injeta um novo
sed -i '/KOKORO_DOCX_START/,/KOKORO_DOCX_END/d' "$REL"

cat >> "$REL" <<'EOF'
<script>
// KOKORO_DOCX_START
(function(){
  const qs  = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // aguarda libs carregarem
  function waitLibs(maxMs=6000){
    return new Promise((resolve, reject)=>{
      const t0 = Date.now();
      (function tick(){
        if (window.docx && window.saveAs) return resolve();
        if (Date.now()-t0 > maxMs) return reject(new Error('docx ou FileSaver não carregados'));
        setTimeout(tick, 120);
      })();
    });
  }

  function canvasesAlvo(){
    // pega todos os canvases visíveis
    const list = qsa('canvas').filter(c=>{
      const r = c.getBoundingClientRect();
      return r.width>0 && r.height>0;
    });
    console.log('[DOCX] canvases detectados:', list.map(c=>c.id||'(sem id)'));
    return list;
  }

  async function gerarDOCX(){
    try{
      await waitLibs();
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, Media } = docx;

      const children = [];
      children.push(new Paragraph({ text: 'Relatórios Financeiros', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
      children.push(new Paragraph({ text: 'Resumo', heading: HeadingLevel.HEADING_2 }));

      const totalRec  = (qs('#total-receitas')||{}).textContent || '';
      const totalDesp = (qs('#total-despesas')||{}).textContent || '';
      const saldo     = (qs('#saldo-final')||{}).textContent || '';

      children.push(new Paragraph(`Total de Receitas: ${totalRec}`));
      children.push(new Paragraph(`Total de Despesas: ${totalDesp}`));
      children.push(new Paragraph(`Saldo Final: ${saldo}`));
      children.push(new Paragraph(' '));

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            new TableCell({ children:[ new Paragraph({children:[ new TextRun({text:'Indicador',bold:true}) ]}) ]}),
            new TableCell({ children:[ new Paragraph({children:[ new TextRun({text:'Valor',bold:true}) ]}) ]}),
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
      }));

      children.push(new Paragraph(' '));
      children.push(new Paragraph({ text: 'Gráficos', heading: HeadingLevel.HEADING_2 }));

      // adiciona cada canvas como imagem
      const cvs = canvasesAlvo();
      for (const cv of cvs){
        try{
          const title = cv.getAttribute('aria-label') || cv.id || 'Gráfico';
          const dataUrl = cv.toDataURL('image/png', 1.0);
          const base64 = dataUrl.split(',')[1];
          const bytes = Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
          const img = Media.addImage(new Document({sections:[{children:[]}]}), bytes, 600, 320);
          // truque: Media.addImage precisa de um doc, então criamos um temporário
          children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_3 }));
          children.push(new Paragraph(img));
          children.push(new Paragraph(' '));
        }catch(err){
          console.warn('[DOCX] Falha canvas -> imagem', cv.id, err);
        }
      }

      // cria o doc definitivo
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      const nome = `Relatorio_Financeiro_${new Date().toISOString().slice(0,10)}.docx`;
      saveAs(blob, nome);
    }catch(err){
      console.error('[DOCX] Erro ao gerar:', err);
      alert('Não foi possível gerar o DOCX. Abra o console (F12) e me envie o erro mostrado.');
    }
  }

  // liga no botão por id ou data-attr
  function bindBtn(){
    const btn = document.getElementById('btn-docx') || document.querySelector('[data-action="gerar-docx"]');
    if (!btn) { console.warn('[DOCX] Botão não encontrado'); return; }
    btn.disabled = false;
    btn.addEventListener('click', gerarDOCX);
    console.log('[DOCX] Botão conectado');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindBtn);
  } else {
    bindBtn();
  }
})();
 // KOKORO_DOCX_END
</script>
EOF

echo " - Novo bloco DOCX inserido"

echo ">> Deploy (produção)…"
npx vercel@latest --prod

echo
echo "Pronto. Atualize /admin/financeiro/relatorios.html com Ctrl+Shift+R."
echo "Se ainda falhar, abra o Console (F12) e me mande o erro. Para desfazer: ./$UNDO"
