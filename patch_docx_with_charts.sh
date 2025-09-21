#!/usr/bin/env bash
set -euo pipefail

FILE="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_patch_docx_${TS}.sh"

[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

# --- UNDO ---
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [ -f "${FILE}.bak.${TS}" ]; then
  mv -f "${FILE}.bak.${TS}" "$FILE"
  echo "OK: restaurado $FILE a partir do backup ${FILE}.bak.${TS}"
else
  echo "Nada para restaurar (backup não encontrado)."
fi
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

cp -f "$FILE" "${FILE}.bak.${TS}"

python3 - "$FILE" <<'PY'
import io,sys,re
path=sys.argv[1]
s=io.open(path,'r',encoding='utf-8').read()

# 1) Garante o docx UMD no <head> (se já houver, não duplica)
if 'docx@' not in s and 'window.docx' not in s:
    s = re.sub(r'(</head>)',
               r'  <script src="https://cdn.jsdelivr.net/npm/docx@8.0.1/build/index.umd.js"></script>\n\\1',
               s, count=1, flags=re.I)

# 2) Substitui a função gerarDOCX pelo novo conteúdo (assíncrono e com gráficos)
new_fn = r"""
async function gerarDOCX(){
  try{
    // pega totais exibidos
    const totR = (document.getElementById('total-receitas')?.textContent||'').trim();
    const totD = (document.getElementById('total-despesas')?.textContent||'').trim();
    const totS = (document.getElementById('saldo-final')?.textContent||'').trim();

    // helper: converte dataURL (canvas.toDataURL) em ArrayBuffer
    async function dataURLtoArrayBuffer(dataURL){
      const res = await fetch(dataURL);
      const blob = await res.blob();
      return await blob.arrayBuffer();
    }

    // captura todos os canvases dos gráficos (ordem de exibição)
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const chartBuffers = [];
    for (const cv of canvases){
      try{
        const url = cv.toDataURL('image/png');
        const ab  = await dataURLtoArrayBuffer(url);
        chartBuffers.push(ab);
      }catch(_){}
    }

    const D = window.docx;
    const doc = new D.Document({
      sections: [{
        properties: {},
        children: [
          // Título
          new D.Paragraph({
            alignment: D.AlignmentType.CENTER,
            children: [ new D.TextRun({text:"Relatórios Financeiros", bold:true, size:48}) ]
          }),
          new D.Paragraph({ text: "" }),

          // Resumo (tabela 2 colunas)
          new D.Paragraph({ children:[ new D.TextRun({text:"Resumo", bold:true, underline:{} , color:"2b579a", size:28}) ]}),
          new D.Table({
            width: { size: 100, type: D.WidthType.PERCENTAGE },
            rows: [
              new D.TableRow({
                children: [
                  new D.TableCell({children:[new D.Paragraph({children:[new D.TextRun({text:"Indicador", bold:true})]})]}),
                  new D.TableCell({children:[new D.Paragraph({children:[new D.TextRun({text:"Valor", bold:true})]})]}),
                ]
              }),
              new D.TableRow({
                children: [
                  new D.TableCell({children:[new D.Paragraph("Receitas")]}),
                  new D.TableCell({children:[new D.Paragraph(totR||"-")]}),
                ]
              }),
              new D.TableRow({
                children: [
                  new D.TableCell({children:[new D.Paragraph("Despesas")]}),
                  new D.TableCell({children:[new D.Paragraph(totD||"-")]}),
                ]
              }),
              new D.TableRow({
                children: [
                  new D.TableCell({children:[new D.Paragraph("Saldo")]}),
                  new D.TableCell({children:[new D.Paragraph(totS||"-")]}),
                ]
              })
            ]
          }),
          new D.Paragraph({ text: "" }),
          new D.Paragraph({ children:[ new D.TextRun({text:"Gráficos", bold:true, underline:{}, color:"2b579a", size:28}) ]}),
          new D.Paragraph({ text: "" }),
          // (as imagens dos charts entram depois)
        ]
      }]
    });

    // insere cada gráfico como imagem (uma por parágrafo)
    for (const ab of chartBuffers){
      try{
        const image = D.Media.addImage(doc, ab, 600, 320); // largura/altura aproximadas
        doc.Sections[0].children.push(new D.Paragraph(image));
        doc.Sections[0].children.push(new D.Paragraph({text:""}));
      }catch(_){}
    }

    const blob = await D.Packer.toBlob(doc);
    const a = document.createElement('a');
    a.download = 'relatorios_financeiros.docx';
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(err){
    console.error('DOCX error:', err);
    alert('Não foi possível gerar o DOCX. Veja o console (F12).');
  }
}
"""

# substitui bloco existente da função (tolerante)
s = re.sub(r'function\s+gerarDOCX\s*\([\s\S]*?\n\}', new_fn.strip() + "\n", s, count=1)

io.open(path,'w',encoding='utf-8').write(s)
print("OK: função gerarDOCX atualizada e docx UMD garantido no <head>.")
PY

echo ">> Patch aplicado."
echo ">> Agora faça o deploy e teste:"
echo "   npx vercel@latest --prod"
echo "   Depois recarregue /admin/financeiro/relatorios.html (Ctrl+F5) e clique em 'Gerar DOCX'."
