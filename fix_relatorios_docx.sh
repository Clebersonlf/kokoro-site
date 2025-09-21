#!/usr/bin/env bash
set -euo pipefail

REL="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_fix_relatorios_docx_${TS}.sh"

[ -f "$REL" ] || { echo "ERRO: não encontrei $REL"; exit 1; }

# --- UNDO ---
cp -f "$REL" "$REL.bak.$TS"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
[ -f "$REL.bak.$TS" ] && mv -f "$REL.bak.$TS" "$REL" && echo "Restaurado: $REL"
echo "OK."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# 1) Garante a presença das bibliotecas DOCX e FileSaver
if ! grep -q 'docx@' "$REL"; then
  sed -i 's#</head>#  <script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"></script>\n  <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>\n</head>#' "$REL"
  echo " - CDNs do docx e FileSaver injetadas"
else
  echo " - CDNs já existiam (OK)"
fi

# 2) Injeta/atualiza a função gerarDOCX() e liga no botão #btn-docx
if grep -q 'function gerarDOCX' "$REL"; then
  # remove bloco antigo para regravar limpo
  sed -i '/function gerarDOCX/,/\/\/ fim gerarDOCX/d' "$REL"
fi

cat >> "$REL" <<'EOF'
<script>
// ==== gerarDOCX: captura dados e canvases, monta o .docx ====
function gerarDOCX(){
  try{
    if(!(window.docx && window.saveAs)){
      alert("Bibliotecas do DOCX não carregadas. Recarregue a página (Ctrl+Shift+R).");
      return;
    }
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, Media } = docx;

    // helpers
    const brl = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    const getText = sel => (document.querySelector(sel)?.textContent || '').trim();

    // Totais (ajuste os seletores caso estejam diferentes)
    const totalRec  = getText('#total-receitas');
    const totalDesp = getText('#total-despesas');
    const saldo     = getText('#saldo-final');

    // captura canvases (se alguns não existirem, segue)
    const canvasIds = ['chartLinha','chartPizza','chartBarras','chartColunas'];
    const chartParas = [];
    const images = [];

    canvasIds.forEach(id=>{
      const c = document.getElementById(id);
      if(!c) return;
      try{
        const dataUrl = c.toDataURL('image/png', 1.0);
        images.push({id, dataUrl});
      }catch(_){}
    });

    // monta o documento
    const children = [];

    children.push(new Paragraph({
      text: "Relatórios Financeiros",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    }));

    children.push(new Paragraph({ text: "Resumo", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: `Total de Receitas: ${totalRec}` }));
    children.push(new Paragraph({ text: `Total de Despesas: ${totalDesp}` }));
    children.push(new Paragraph({ text: `Saldo Final: ${saldo}` }));
    children.push(new Paragraph({ text: " " }));

    // pequena tabela-resumo
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children:[new Paragraph({children:[new TextRun({text:"Indicador", bold:true})]})]}),
            new TableCell({ children:[new Paragraph({children:[new TextRun({text:"Valor", bold:true})]})]})
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children:[new Paragraph("Receitas")]}),
            new TableCell({ children:[new Paragraph(totalRec)]})
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children:[new Paragraph("Despesas")]}),
            new TableCell({ children:[new Paragraph(totalDesp)]})
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children:[new Paragraph("Saldo")]}),
            new TableCell({ children:[new Paragraph(saldo)]})
          ]
        })
      ]
    });
    children.push(table);
    children.push(new Paragraph({ text: " " }));

    if(images.length){
      children.push(new Paragraph({ text: "Gráficos", heading: HeadingLevel.HEADING_2 }));
      images.forEach((img,i)=>{
        children.push(new Paragraph({ text: `Figura ${i+1}`, heading: HeadingLevel.HEADING_3 }));
        const pngData = img.dataUrl.split(',')[1]; // base64
        const image = Media.addImage(
          new Document(), // dummy para obter o media (será reencapsulado abaixo)
          Uint8Array.from(atob(pngData), c => c.charCodeAt(0)),
          600,  // largura px aproximada
          320   // altura px aproximada
        );
        // NOTA: para usar Media.addImage corretamente, precisamos adicionar depois no doc real.
        chartParas.push(image);
        children.push(new Paragraph(" "));
      });
    }

    // cria doc
    const doc = new Document({ sections: [{ children: [] }] });

    // reconstroi images dentro do doc real
    const rebuiltChildren = [];
    for(const ch of children){
      if(ch._media){ // objeto antigo com media? evitamos
        continue;
      }
      rebuiltChildren.push(ch);
      // onde tínhamos colocado placeholder de chart, já inserimos um parágrafo de imagem
      if(ch.options && ch.options.text && /^Figura \d+/.test(ch.options.text)){
        const idx = Number(ch.options.text.replace(/[^\d]/g,'')) - 1;
        if(chartParas[idx]){
          const dataUrl = images[idx].dataUrl.split(',')[1];
          const img = Media.addImage(
            doc,
            Uint8Array.from(atob(dataUrl), c => c.charCodeAt(0)),
            600, 320
          );
          rebuiltChildren.push(new Paragraph(img));
        }
      }
    }
    doc.Sections[0].children = rebuiltChildren;

    Packer.toBlob(doc).then(blob=>{
      const nome = `Relatorio_Financeiro_${new Date().toISOString().slice(0,10)}.docx`;
      saveAs(blob, nome);
    }).catch(err=>{
      console.error("Falha ao empacotar DOCX:", err);
      alert("Não foi possível gerar o DOCX. Veja o console (F12) para detalhes.");
    });
  }catch(e){
    console.error(e);
    alert("Não foi possível gerar o DOCX. Veja o console (F12) para detalhes.");
  }
}
// liga o botão se existir
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('btn-docx') || document.querySelector('[data-action="gerar-docx"]');
  if(btn){
    btn.disabled = false;
    btn.addEventListener('click', gerarDOCX);
  }
});
// fim gerarDOCX
</script>
EOF
echo " - função gerarDOCX aplicada e botão ligado"

echo ">> Deploy (produção)…"
npx vercel@latest --prod

echo
echo "Pronto! Recarregue a página de Relatórios (Ctrl+Shift+R) e teste o botão 'Gerar DOCX'."
echo "Se precisar desfazer: ./$UNDO"
