#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
REL="admin/financeiro/relatorios.html"
UNDO="UNDO_add_docx_${TS}.sh"

[ -f "$REL" ] || { echo "ERRO: não encontrei $REL"; exit 1; }

# === UNDO ===
cp -f "$REL" "$REL.bak.$TS"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
[ -f "$REL.bak.$TS" ] && mv -f "$REL.bak.$TS" "$REL" && echo "Restaurado: $REL"
echo "OK: desfazido."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# === 1) Adicionar botão "Gerar DOCX" ao lado do "Gerar PDF" (se ainda não existir) ===
if ! grep -q 'id="btn-docx"' "$REL"; then
  sed -i 's#id="btn-pdf">Gerar PDF</button>#id="btn-pdf">Gerar PDF</button>\n      <button id="btn-docx">Gerar DOCX</button>#' "$REL"
  echo " - botão DOCX inserido"
else
  echo " - botão DOCX já existia (mantido)"
fi

# === 2) Incluir a lib docx (browser) antes de </body> (uma vez) ===
if ! grep -q 'unpkg.com/docx' "$REL"; then
  sed -i 's#</body>#  <script src="https://unpkg.com/docx@7.7.0/build/index.js"></script>\n</body>#' "$REL"
  echo " - script docx adicionado"
else
  echo " - script docx já existia (mantido)"
fi

# === 3) Injetar script para gerar o .docx com KPIs e imagens dos gráficos ===
if ! grep -q 'function gerarDOCX' "$REL"; then
  awk -v add="
  <script>
  // Gera DOCX com docx.js: inclui KPIs e os 4 gráficos como imagens
  async function canvasToArrayBuffer(canvas){
    const dataUrl = canvas.toDataURL('image/png');
    const res = await fetch(dataUrl);
    return await res.arrayBuffer();
  }
  async function gerarDOCX(){
    const d = window.docx;
    if(!d){ alert('Biblioteca DOCX não carregada'); return; }

    // Coletar KPIs da página
    const kRec = document.getElementById('kpi-receitas')?.textContent || 'R$ 0,00';
    const kDes = document.getElementById('kpi-despesas')?.textContent || 'R$ 0,00';
    const kSal = document.getElementById('kpi-saldo')?.textContent    || 'R$ 0,00';

    // Montar documento
    const children = [
      new d.Paragraph({ text: 'KOKORO – Relatórios Financeiros', heading: d.HeadingLevel.TITLE, alignment: d.AlignmentType.CENTER }),
      new d.Paragraph({ text: new Date().toLocaleString('pt-BR'), alignment: d.AlignmentType.CENTER }),
      new d.Paragraph({ text: '' }),
      new d.Paragraph({ children:[ new d.TextRun({ text: 'Receitas: ' + kRec, bold:true }) ] }),
      new d.Paragraph({ children:[ new d.TextRun({ text: 'Despesas + Repasses: ' + kDes, bold:true }) ] }),
      new d.Paragraph({ children:[ new d.TextRun({ text: 'Saldo: ' + kSal, bold:true }) ] }),
      new d.Paragraph({ text: '' }),
    ];

    // Pegar canvases dos gráficos e inserir como imagens
    const ids = ['chartLinha','chartPizza','chartBarras','chartColunas'];
    for (const id of ids){
      const c = document.getElementById(id);
      if(!c) continue;
      const buf = await canvasToArrayBuffer(c);
      // largura padrão 600px (~15cm); altura proporcional
      const w = 600, h = Math.round(600*(c.height/c.width));
      const img = d.Media.addImage(new d.Document(), buf, w, h);
      // truque: criar ImageRun manualmente ligado ao doc final
      children.push(new d.Paragraph(img));
      children.push(new d.Paragraph({ text: '' }));
    }

    const doc = new d.Document({ sections:[{ children }] });
    const blob = await d.Packer.toBlob(doc);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'relatorio_kokoro.docx';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Listener do botão
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-docx');
    if(btn) btn.addEventListener('click', gerarDOCX);
  });
  </script>
  " '
    /<\/body>/ && !x { print add; x=1 }
    { print }
  ' "$REL" > "$REL.tmp" && mv -f "$REL.tmp" "$REL"
  echo " - script gerarDOCX injetado"
else
  echo " - script gerarDOCX já existia (mantido)"
fi

# === 4) Deploy e teste rápido ===
echo ">> Deploy (produção)…"
npx vercel@latest --prod

echo
echo "--- Testando /admin/financeiro/relatorios.html ---"
curl -sSI "https://www.planckkokoro.com/admin/financeiro/relatorios.html" | sed -n '1,12p'

echo
echo "OK. Para desfazer: ./$UNDO"
