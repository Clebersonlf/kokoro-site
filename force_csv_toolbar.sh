#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FIN="admin/financeiro/repasses.html"
UNDO="UNDO_force_csv_toolbar_${TS}.sh"

# ---------- UNDO ----------
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [ -f "$FIN.bak.$TS" ]; then
  mv -f "$FIN.bak.$TS" "$FIN"
  echo ">> Restaurado: $FIN"
else
  echo "Nada para restaurar."
fi
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# ---------- PATCH ----------
[ -f "$FIN" ] || { echo "ERRO: não achei $FIN"; exit 1; }
cp -f "$FIN" "$FIN.bak.$TS"

python3 - <<'PY'
import io, re

fin = "admin/financeiro/repasses.html"
s = io.open(fin, 'r', encoding='utf-8').read()

# 1) Garante a barra de exportação logo após <h1> se o CSV não existir
if 'id="btn-export-csv"' not in s:
    toolbar = '''
    <div class="card" id="export-toolbar" style="margin:12px 0; padding:12px; display:flex; gap:8px; flex-wrap:wrap;">
      <button type="button" id="btn-export-pdf" class="btn btn-ghost">Exportar PDF</button>
      <button type="button" id="btn-export-docx" class="btn btn-ghost">Exportar DOCX</button>
      <button type="button" id="btn-export-csv" class="btn btn-principal">Exportar CSV</button>
    </div>
    '''
    s2 = re.sub(r'(<h1\b[^>]*>.*?</h1>)', r'\1\n'+toolbar, s, count=1, flags=re.S)
    if s2 == s:
        # se não achou <h1>, coloca no começo do body
        s2 = re.sub(r'(<body[^>]*>)', r'\1\n'+toolbar, s, count=1, flags=re.S)
    s = s2

# 2) Injeta o JS do CSV (uma única vez, ao final)
if 'function generateCsvFromTable' not in s:
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
io.open(fin, 'w', encoding='utf-8').write(s)
print(">> Toolbar/CSV garantidos em", fin)
PY

# ---------- Deploy (opcional) ----------
if command -v npx >/dev/null 2>&1; then
  echo ">> Fazendo deploy (produção)…"
  npx vercel@latest --prod || true
else
  echo ">> AVISO: npx não encontrado, pulei o deploy. Arquivo HTML já está patchado localmente."
fi

echo ">> Pronto. Atualize a página com Ctrl+F5. Para desfazer: ./$UNDO"
