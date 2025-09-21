#!/usr/bin/env bash
set -euo pipefail

FILE="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_patch_docx_${TS}.sh"

[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

# backup + undo
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

# garante a lib docx UMD (se já houver, não duplica)
if 'docx@' not in s and 'window.docx' not in s:
    s = s.replace('</head>',
                  '  <script src="https://cdn.jsdelivr.net/npm/docx@8.0.1/build/index.umd.js"></script>\n</head>', 1)

# remove qualquer função gerarDOCX antiga (evita conflito)
s = re.sub(r'function\s+gerarDOCX\s*\([\s\S]*?\}\s*\n', '', s, count=1)

# injeta uma versão fechadinha no fim do body + bind do botão
patch = r"""
<script>
(function(){
  async function gerarDOCX(){
    try{
      const D = window.docx;
      if(!D){ alert('Biblioteca DOCX não carregou.'); return; }

      // Coleta números do topo (texto já formatado)
      const totR = (document.getElementById('total-receitas')?.textContent||'').trim();
      const totD = (document.getElementById('total-despesas')?.textContent||'').trim();
      const totS = (document.getElementById('saldo-final')?.textContent||'').trim();

      // Ajuda: dataURL -> ArrayBuffer
      async function dataURLtoArrayBuffer(dataURL){
        const res = await fetch(dataURL);
        return await res.arrayBuffer();
      }

      // 1) Captura os gráficos (antes de criar o doc)
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const imgBuffers = [];
      for (const cv of canvases){
        try{
          const url = cv.toDataURL('image/png');
          imgBuffers.push(await dataURLtoArrayBuffer(url));
        }catch(e){ console.warn('Falha ao ler canvas', e); }
      }

      // 2) Monta as seções (children) primeiro
      const children = [
        new D.Paragraph({ alignment: D.AlignmentType.CENTER, children:[
          new D.TextRun({ text: "Relatórios Financeiros", bold:true, size:48 })
        ]}),
        new D.Paragraph({ text: "" }),
        new D.Paragraph({ children:[ new D.TextRun({ text:"Resumo", bold:true, underline:{}, color:"2b579a", size:28 }) ]}),
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
        new D.Paragraph({ children:[ new D.TextRun({ text:"Gráficos", bold:true, underline:{}, color:"2b579a", size:28 }) ]}),
        new D.Paragraph({ text: "" })
      ];

      // 3) Cria doc e adiciona imagens via API correta
      const doc = new D.Document({ sections:[{ properties:{}, children: [] }] });
      const imgParas = [];
      for (const ab of imgBuffers){
        try{
          const imgRun = D.Media.addImage(doc, ab, 600, 320);
          imgParas.push(new D.Paragraph(imgRun));
          imgParas.push(new D.Paragraph({ text:"" }));
        }catch(e){ console.warn('addImage falhou', e); }
      }

      // junta tudo no doc (children precisam estar na criação final)
      const finalDoc = new D.Document({
        sections: [{ properties:{}, children: children.concat(imgParas) }]
      });

      const blob = await D.Packer.toBlob(finalDoc);
      const a = document.createElement('a');
      a.download = 'relatorios_financeiros.docx';
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }catch(err){
      console.error('DOCX error (force):', err);
      alert('Não foi possível gerar o DOCX. Veja o console (F12).');
    }
  }
  // expõe e re-liga o botão por id ou pelo texto
  window.gerarDOCX = gerarDOCX;
  window.addEventListener('DOMContentLoaded', ()=>{
    // tenta id clássico
    let btn = document.getElementById('btn-docx');
    if(!btn){
      // fallback: busca botão cujo texto contenha "Gerar DOCX"
      const cand = Array.from(document.querySelectorAll('button, a')).find(b => (b.textContent||'').trim().toLowerCase().includes('gerar docx'));
      if(cand) btn = cand;
    }
    if(btn){
      btn.onclick = (e)=>{ e.preventDefault(); gerarDOCX(); };
    }
  });
})();
</script>
"""

# injeta antes de </body>
s = s.replace('</body>', patch+'\n</body>', 1)
io.open(p,'w',encoding='utf-8').write(s)
print("OK: função gerarDOCX substituída e botão re-ligado.")
PY

echo ">> Agora faça o deploy:"
echo "   npx vercel@latest --prod"
echo "Depois: atualize a página de relatórios com Ctrl+F5 e teste novamente."
