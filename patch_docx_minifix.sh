#!/usr/bin/env bash
set -euo pipefail

FILE="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_docx_minifix_${TS}.sh"

[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

# UNDO
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

# Garante a lib UMD (se já tiver, não duplica)
if 'docx@' not in s and 'window.docx' not in s:
    s=re.sub(r'(</head>)',
             r'  <script src="https://cdn.jsdelivr.net/npm/docx@8.0.1/build/index.umd.js"></script>\n\1',
             s,1,flags=re.I)

new_fn = r"""
async function gerarDOCX(){
  try{
    const D = window.docx;

    const totR = (document.getElementById('total-receitas')?.textContent||'').trim();
    const totD = (document.getElementById('total-despesas')?.textContent||'').trim();
    const totS = (document.getElementById('saldo-final')?.textContent||'').trim();

    // helper
    async function dataURLtoArrayBuffer(dataURL){
      const res = await fetch(dataURL);
      const blob = await res.blob();
      return await blob.arrayBuffer();
    }

    // 1) pega imagens dos gráficos ANTES de criar o doc
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const images = [];
    for (const cv of canvases){
      try{
        const url = cv.toDataURL('image/png');
        const ab  = await dataURLtoArrayBuffer(url);
        images.push(ab);
      }catch(e){ console.warn('canvas -> dataURL falhou', e); }
    }

    // 2) monta todos os children primeiro
    const children = [
      new D.Paragraph({ alignment: D.AlignmentType.CENTER, children:[ new D.TextRun({text:"Relatórios Financeiros", bold:true, size:48}) ]}),
      new D.Paragraph({ text: "" }),
      new D.Paragraph({ children:[ new D.TextRun({text:"Resumo", bold:true, underline:{}, color:"2b579a", size:28}) ]}),
      new D.Table({
        width:{ size:100, type:D.WidthType.PERCENTAGE },
        rows:[
          new D.TableRow({ children:[
            new D.TableCell({children:[new D.Paragraph({children:[new D.TextRun({text:"Indicador", bold:true})]})]}),
            new D.TableCell({children:[new D.Paragraph({children:[new D.TextRun({text:"Valor", bold:true})]})]}),
          ]}),
          new D.TableRow({ children:[
            new D.TableCell({children:[new D.Paragraph("Receitas")]}),
            new D.TableCell({children:[new D.Paragraph(totR||"-")]}),
          ]}),
          new D.TableRow({ children:[
            new D.TableCell({children:[new D.Paragraph("Despesas")]}),
            new D.TableCell({children:[new D.Paragraph(totD||"-")]}),
          ]}),
          new D.TableRow({ children:[
            new D.TableCell({children:[new D.Paragraph("Saldo")]}),
            new D.TableCell({children:[new D.Paragraph(totS||"-")]}),
          ]})
        ]
      }),
      new D.Paragraph({ text: "" }),
      new D.Paragraph({ children:[ new D.TextRun({text:"Gráficos", bold:true, underline:{}, color:"2b579a", size:28}) ]}),
      new D.Paragraph({ text: "" }),
    ];

    for (const ab of images){
      try{
        const img = D.Media.addImage({} /* compat */, ab, 600, 320);
        // truque: cria o ImageRun diretamente (API do UMD aceita)
        children.push(new D.Paragraph(img));
        children.push(new D.Paragraph({text:""}));
      }catch(e){ console.warn('addImage falhou', e); }
    }

    // 3) cria o documento só agora
    const doc = new D.Document({ sections:[{ properties:{}, children }] });

    const blob = await D.Packer.toBlob(doc);
    const a = document.createElement('a');
    a.download = 'relatorios_financeiros.docx';
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(err){
    console.error('DOCX error (minifix):', err);
    alert('Não foi possível gerar o DOCX. Veja o console (F12).');
  }
}
"""

# troca apenas o corpo da função
s = re.sub(r'function\s+gerarDOCX\s*\([\s\S]*?\n\}', new_fn.strip()+"\n", s, count=1)
io.open(p,'w',encoding='utf-8').write(s)
print("OK: gerarDOCX substituída (minifix).")
PY

echo ">> Patch aplicado. Faça o deploy em seguida:"
echo "   npx vercel@latest --prod"
echo "Depois recarregue a página (Ctrl+F5) e teste 'Gerar DOCX'."
