#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
FILE="admin/financeiro/repasses.html"
BACKUP="$FILE.bak.$TS"
UNDO="UNDO_patch_repasses_$TS.sh"

# ===== UNDO (para desfazer) =====
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [ -f "$BACKUP" ]; then
  mv -f "$BACKUP" "$FILE"
  echo "Restaurado: $FILE"
else
  echo "Backup não encontrado!"
fi
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# ===== Patch =====
cp -f "$FILE" "$BACKUP"

# Insere a calculadora após o <h1> ou substitui se já existir
python3 - <<'PY'
import io,re,sys
path="admin/financeiro/repasses.html"
src=io.open(path,encoding="utf-8").read()

calc_html = """
<div class="card" style="margin-top:20px;padding:15px;border:1px solid #333;border-radius:8px;">
  <h2>💰 Calculadora de Repasses</h2>
  <label>Valor Recebido (R$):</label>
  <input type="number" id="valorRecebido" step="0.01" value="0" />

  <label>Repasse (%) :</label>
  <input type="number" id="percentual" step="0.01" value="0" />

  <label>Repasse (R$) :</label>
  <input type="number" id="valorRepasse" step="0.01" value="0" />

  <p>💡 Academia fica com: <span id="valorAcademia">R$ 0,00</span></p>
  <p>👤 Colaborador recebe: <span id="valorColaborador">R$ 0,00</span></p>
</div>

<script>
function atualizarCalculo(base){
  const vRecebido = parseFloat(document.getElementById("valorRecebido").value)||0;
  const vPerc = parseFloat(document.getElementById("percentual").value)||0;
  const vRep = parseFloat(document.getElementById("valorRepasse").value)||0;

  if(base==="percentual"){
    const repasse = vRecebido * (vPerc/100);
    document.getElementById("valorRepasse").value = repasse.toFixed(2);
    document.getElementById("valorColaborador").innerText = repasse.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    document.getElementById("valorAcademia").innerText = (vRecebido - repasse).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  }
  else if(base==="valor"){
    const perc = vRecebido>0 ? (vRep/vRecebido)*100 : 0;
    document.getElementById("percentual").value = perc.toFixed(2);
    document.getElementById("valorColaborador").innerText = vRep.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    document.getElementById("valorAcademia").innerText = (vRecebido - vRep).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  }
}

document.getElementById("percentual").addEventListener("input",()=>atualizarCalculo("percentual"));
document.getElementById("valorRepasse").addEventListener("input",()=>atualizarCalculo("valor"));
document.getElementById("valorRecebido").addEventListener("input",()=>atualizarCalculo("percentual"));
</script>
"""

if "Calculadora de Repasses" not in src:
    src = re.sub(r'(<h1[^>]*>.*?</h1>)', r'\1\n'+calc_html, src, count=1, flags=re.S)
else:
    print(">> Calculadora já existe, nada feito")

io.open(path,"w",encoding="utf-8").write(src)
print("OK: Calculadora de Repasses adicionada em", path)
PY

echo ">> Patch aplicado com sucesso."
