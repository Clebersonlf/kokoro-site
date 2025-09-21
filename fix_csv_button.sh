#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FIN="admin/financeiro/repasses.html"
UNDO="UNDO_fix_csv_button_${TS}.sh"

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

# insere o botão CSV logo depois do botão PDF
sed -i '/id="btn-export-pdf"/a \            <button type="button" id="btn-export-csv" class="btn btn-ghost">Exportar CSV</button>' "$FIN"

# insere script para tratar clique do CSV
grep -q 'btn-export-csv' "$FIN" || cat >> "$FIN" <<'EOF'

<script>
document.addEventListener("DOMContentLoaded", () => {
  const btnCsv = document.getElementById("btn-export-csv");
  if (btnCsv) {
    btnCsv.addEventListener("click", () => {
      try {
        const rows = [["Data","Descrição","Valor","Status"]];
        document.querySelectorAll("#tabela-lancamentos tr").forEach(tr=>{
          const cols=[...tr.querySelectorAll("td")].map(td=>td.innerText.trim());
          if(cols.length) rows.push(cols);
        });
        const csvContent = rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "repasses.csv";
        a.click();
        URL.revokeObjectURL(url);
      } catch(e) {
        alert("Erro ao gerar CSV: " + e);
      }
    });
  }
});
</script>
EOF

echo ">> Botão Exportar CSV adicionado em $FIN"
