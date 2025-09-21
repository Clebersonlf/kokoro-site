#!/usr/bin/env bash
set -euo pipefail

REL="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_fix_docx_${TS}.sh"

[ -f "$REL" ] || { echo "ERRO: não encontrei $REL"; exit 1; }

# UNDO
cp -f "$REL" "$REL.bak.$TS"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
[ -f "$REL.bak.$TS" ] && mv -f "$REL.bak.$TS" "$REL" && echo "Restaurado: $REL"
echo "OK: desfazido."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# 1) Garante a lib docx no HTML (uma vez)
if ! grep -q 'unpkg.com/docx' "$REL"; then
  sed -i 's#</body>#  <script src="https://unpkg.com/docx@7.7.0/build/index.js"></script>\n</body>#' "$REL"
  echo " - adicionado script docx"
else
  echo " - script docx já presente"
fi

# 2) Injeta (no final) um novo gerarDOCX que:
#    - cria o Document antes
#    - adiciona as imagens no MESMO doc
#    - trata erros e faz download
cat >> "$REL" <<'EOF'
<!-- patch: gerar DOCX correto -->
<script>
(async function(){
  function byId(id){ return document.getElementById(id); }
  async function canvasToArrayBuffer(canvas){
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL('image/png');
    const res = await fetch(dataUrl);
    return await res.arrayBuffer();
  }

  async function gerarDOCX(){
    try{
      const d = window.docx;
      if(!d){ alert('Biblioteca DOCX não carregada'); return; }

      // KPIs da tela (ids opcionais)
      const kRec = byId('kpi-receitas')?.textContent || 'R$ 0,00';
      const kDes = byId('kpi-despesas')?.textContent || 'R$ 0,00';
      const kSal = byId('kpi-saldo')?.textContent    || 'R$ 0,00';

      // Primeiro criamos o array de parágrafos (children)
      const children = [
        new d.Paragraph({ text: 'KOKORO – Relatórios Financeiros', heading: d.HeadingLevel.TITLE, alignment: d.AlignmentType.CENTER }),
        new d.Paragraph({ text: new Date().toLocaleString('pt-BR'), alignment: d.AlignmentType.CENTER }),
        new d.Paragraph({ text: '' }),
        new d.Paragraph({ children:[ new d.TextRun({ text: 'Receitas: ' + kRec, bold:true }) ] }),
        new d.Paragraph({ children:[ new d.TextRun({ text: 'Despesas + Repasses: ' + kDes, bold:true }) ] }),
        new d.Paragraph({ children:[ new d.TextRun({ text: 'Saldo: ' + kSal, bold:true }) ] }),
        new d.Paragraph({ text: '' }),
      ];

      // Criamos o doc FINAL agora
      const doc = new d.Document({ sections:[{ children: [] }] });

      // Helper para inserir gráficos (se existirem)
      async function addChart(id, titulo){
        const c = byId(id);
        if(!c) return;
        const buf = await canvasToArrayBuffer(c);
        if(!buf) return;
        const width = 600;
        const height = Math.max(200, Math.round(width * (c.height/(c.width||1))));
        const imageRun = d.Media.addImage(doc, buf, width, height); // MESMO doc!
        children.push(new d.Paragraph({ text: titulo, spacing:{ after: 120 } }));
        children.push(new d.Paragraph(imageRun));
        children.push(new d.Paragraph({ text: '' }));
      }

      await addChart('chartLinha',   'Gráfico de Linha');
      await addChart('chartPizza',   'Gráfico de Pizza');
      await addChart('chartBarras',  'Gráfico de Barras');
      await addChart('chartColunas', 'Gráfico de Colunas');

      // Monta doc final com children
      const finalDoc = new d.Document({ sections:[{ children }] });
      const blob = await d.Packer.toBlob(finalDoc);

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'relatorio_kokoro.docx';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    }catch(err){
      console.error('Erro ao gerar DOCX:', err);
      alert('Não foi possível gerar o DOCX. Veja o console (F12) para detalhes.');
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = byId('btn-docx');
    if(btn){
      btn.addEventListener('click', gerarDOCX);
    }
  });
})();
</script>
EOF
echo " - função gerarDOCX corrigida e injetada (última ganha precedência)"

# 3) Deploy
echo ">> Deploy (produção)…"
npx vercel@latest --prod

# 4) Teste simples (HEAD)
echo
echo "--- Testando /admin/financeiro/relatorios.html ---"
curl -sSI "https://www.planckkokoro.com/admin/financeiro/relatorios.html" | sed -n '1,12p'

echo
echo "OK. Se precisar desfazer: ./$UNDO"
