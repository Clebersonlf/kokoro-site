#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FIN="admin/financeiro/repasses.html"
UNDO="UNDO_fix_csv_button_v2_${TS}.sh"

# ========= UNDO =========
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [ -f "$FIN.bak.$TS" ]; then
  mv -f "$FIN.bak.$TS" "$FIN"
  echo ">> Restaurado $FIN"
else
  echo "Nada para restaurar"
fi
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# ========= PATCH =========
[ -f "$FIN" ] || { echo "ERRO: não achei $FIN"; exit 1; }
cp -f "$FIN" "$FIN.bak.$TS"

python3 - <<'PY'
import io, re, sys
fin = "admin/financeiro/repasses.html"
s = io.open(fin, 'r', encoding='utf-8').read()

# já existe?
if 'id="btn-export-csv"' in s:
    print(">> Já existe botão CSV — nada a fazer no HTML")
else:
    inserted = False
    # 1) depois do botão PDF
    s2 = re.sub(r'(<button[^>]*id="btn-export-pdf"[^>]*>.*?</button>)',
                r'\1\n            <button type="button" id="btn-export-csv" class="btn btn-ghost">Exportar CSV</button>',
                s, count=1, flags=re.S)
    if s2 != s:
        s = s2
        inserted = True
        print(">> Inserido após btn-export-pdf")
    else:
        # 2) depois do botão DOCX
        s2 = re.sub(r'(<button[^>]*id="btn-export-docx"[^>]*>.*?</button>)',
                    r'\1\n            <button type="button" id="btn-export-csv" class="btn btn-ghost">Exportar CSV</button>',
                    s, count=1, flags=re.S)
        if s2 != s:
            s = s2
            inserted = True
            print(">> Inserido após btn-export-docx")
    if not inserted:
        # 3) criar barra simples logo após <h1> se nada encontrado
        s = re.sub(
            r'(<h1[^>]*>.*?</h1>)',
            r'\1\n    <div class="card" id="export-bar-fallback" style="margin-top:10px;padding:10px;display:flex;gap:8px;">'
            r'\n      <button type="button" id="btn-export-csv" class="btn btn-ghost">Exportar CSV</button>\n    </div>',
            s, count=1, flags=re.S)
        print(">> Criada barra de exportação com botão CSV")

# JS handler (só se não existir)
if 'btn-export-csv' in s and 'generateCsvFromTable' not in s:
    s += r"""

<script>
(function(){
  function generateCsvFromTable() {
    const rows = [["Data","Descrição / Aluno","Plano / Dias","Valor","Status","Ações"]];
    const trs = document.querySelectorAll("#tabela-lancamentos tr");
    trs.forEach(tr=>{
      const cols=[...tr.querySelectorAll("td")].map(td=>td.innerText.replace(/\s+/g,' ').trim());
      if (cols.length) rows.push(cols);
    });
    const csv = rows.map(r=>r.map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="repasses.csv"; a.click();
    URL.revokeObjectURL(url);
  }
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn-export-csv");
    if (btn) btn.addEventListener("click", generateCsvFromTable);
  });
})();
</script>
"""
    print(">> JS do CSV injetado")

io.open(fin, 'w', encoding='utf-8').write(s)
print(">> Patch aplicado em", fin)
PY

echo ">> Pronto. Se não aparecer, force refresh (Ctrl+F5)."
echo ">> Para desfazer: ./$UNDO"
