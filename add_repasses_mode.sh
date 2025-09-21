#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
BASE="admin/financeiro"
DEST="$BASE/repasses.html"
FIN="$BASE/financeiro.html"
UNDO="UNDO_repasses_mode_${TS}.sh"

mkdir -p "$BASE"

# ========= UNDO =========
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
echo ">> Desfazendo alterações do modo Repasses..."
# 1) remover página criada (se não existia antes)
if [ -f "$DEST.created.$TS" ]; then
  rm -f "$DEST" && rm -f "$DEST.created.$TS"
  echo " - removido: $DEST"
fi
# 2) restaurar financeiro.html se houver backup desse patch
if [ -f "$FIN.bak.$TS" ]; then
  mv -f "$FIN.bak.$TS" "$FIN"
  echo " - restaurado: $FIN"
fi
echo "OK: desfazido."
EOF
chmod +x "$UNDO"

echo ">> UNDO criado: ./$UNDO"

# ========= 1) CRIAR/ATUALIZAR repasses.html (simulador) =========
if [ -f "$DEST" ]; then
  echo " - $DEST já existe (mantendo)."
else
  cat > "$DEST" <<'HTML'
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <title>Repasses (Simulador)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root{
      --bg:#0f1115; --panel:#161a22; --line:#283143;
      --text:#eef2ff; --muted:#9aa7b5; --accent:#60a5fa;
      --green:#22c55e; --red:#ef4444; --amber:#f59e0b;
    }
    *{box-sizing:border-box}
    body{margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}
    .wrap{max-width:900px; margin:32px auto; padding:0 16px}
    h1{margin:0 0 16px; text-align:center; color:var(--accent)}
    .card{background:linear-gradient(180deg,var(--panel),#121621); border:1px solid var(--line); border-radius:14px; padding:20px; box-shadow:0 8px 24px rgba(0,0,0,.35)}
    .grid{display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
    label{font-size:12px; color:var(--muted); display:block; margin:0 0 6px}
    input,select{width:100%; padding:11px 12px; border-radius:10px; border:1px solid #3a4358; background:#121827; color:var(--text); outline:none; font-size:15px}
    input:focus,select:focus{border-color:var(--accent); box-shadow:0 0 0 3px rgba(96,165,250,.15)}
    .row{display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:10px}
    .btn{border:none; padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:600}
    .btn-ghost{background:transparent; color:#cbd5e1; border:1px solid #475569}
    .btn-ghost:hover{border-color:#64748b}
    .btn-ok{background:var(--accent); color:#0b1220}
    .btn-ok:hover{filter:brightness(1.05)}
    .nums{display:flex; gap:12px; align-items:baseline; flex-wrap:wrap}
    .val{font-size:26px; font-weight:800; letter-spacing:.2px; white-space:nowrap}
    .ok{color:var(--green)} .warn{color:var(--amber)} .bad{color:var(--red)}
    .muted{color:var(--muted)}
    .sep{height:1px; background:#223049; margin:14px 0}
    .help{font-size:12px; color:var(--muted)}
    .right{justify-content:flex-end}
    .mono{font-family:ui-monospace, Menlo, Consolas, "Liberation Mono","Courier New", monospace}
    .tag{display:inline-block; padding:6px 9px; border-radius:8px; background:#0d1422; border:1px solid #2a3650; color:#9ad1ff; font-size:12px}
    nav.top{display:flex; justify-content:flex-end; padding:10px 16px}
    a.back{display:inline-flex; gap:.5rem; padding:.55rem .9rem; background:#111827; border:1px solid #334155; border-radius:.6rem; color:#bfdbfe; text-decoration:none}
    a.back:hover{border-color:#3b82f6; color:#dbeafe}
  </style>
</head>
<body>
  <nav class="top"><a href="/admin/financeiro/financeiro.html" class="back">← Voltar</a></nav>
  <div class="wrap">
    <h1>Repasses (Simulador)</h1>
    <div class="card">
      <div class="grid">
        <div>
          <label>Colaborador</label>
          <input id="colab" list="colab-list" placeholder="Ex.: César / Victor / Robert">
          <datalist id="colab-list">
            <option value="César">
            <option value="Victor">
            <option value="Robert">
          </datalist>
        </div>
        <div>
          <label>Valor Recebido (R$)</label>
          <input id="valorTotal" type="number" step="any" inputmode="decimal" placeholder="Ex.: 230">
        </div>
        <div>
          <label>Repasse (%)</label>
          <input id="pct" type="number" step="any" inputmode="decimal" placeholder="Ex.: 30 (pode 0.09, 11, 200…)">
        </div>
        <div>
          <label>Repasse (R$)</label>
          <input id="repasse" type="number" step="any" inputmode="decimal" placeholder="Ex.: 69">
        </div>
      </div>

      <div class="row help">
        <span class="tag">Dica</span>
        <span>Digite na <b>%</b> ou no <b>R$</b> — os dois são sincronizados. Valores livres (0%, 0.09%, 11%, 200%… ou R$ fixo).</span>
      </div>

      <div class="sep"></div>

      <div class="nums">
        <div>
          <div class="muted">Vai para colaborador</div>
          <div id="outRepasse" class="val ok mono">R$ 0,00</div>
        </div>
        <div>
          <div class="muted">Fica para academia</div>
          <div id="outAcademia" class="val warn mono">R$ 0,00</div>
        </div>
        <div>
          <div class="muted">Resumo</div>
          <div id="outResumo" class="mono">—</div>
        </div>
      </div>

      <div class="sep"></div>

      <div class="row right">
        <button id="btnLimpar" class="btn btn-ghost">Limpar</button>
        <button id="btnGerar" class="btn btn-ok">Gerar Recibo (simulado)</button>
      </div>

      <div class="sep"></div>

      <div>
        <label>Prévia do Recibo (simulado)</label>
        <pre id="preview" class="mono" style="white-space:pre-wrap; background:#0c111b; border:1px solid #293248; border-radius:10px; padding:12px; min-height:110px; margin:0"></pre>
      </div>
    </div>
  </div>

<script>
(function(){
  const fmt = n => (isFinite(n)? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n) : '—');
  const el = id => document.getElementById(id);
  const colab = el('colab'), valorTotal = el('valorTotal'), pct = el('pct'), repasse = el('repasse');
  const outRepasse = el('outRepasse'), outAcademia = el('outAcademia'), outResumo = el('outResumo'), preview = el('preview');
  let lock = false;

  function parseNum(x){
    if (x === '' || x === null || x === undefined) return NaN;
    const v = Number(String(x).replace(',','.'));
    return isFinite(v) ? v : NaN;
  }
  function recalc(from){
    if (lock) return; lock = true;
    let total = parseNum(valorTotal.value);
    let p = parseNum(pct.value);
    let r = parseNum(repasse.value);
    if (!isFinite(total)) total = 0;

    if (from === 'pct') {
      if (isFinite(p)) r = (total * p) / 100;
      repasse.value = isFinite(r) ? String(r) : '';
    } else if (from === 'repasse') {
      if (isFinite(r) && total !== 0) p = (r / total) * 100;
      else if (isFinite(r) && total === 0) p = NaN;
      pct.value = isFinite(p) ? String(p) : '';
    } else {
      if (isFinite(p)) { r = (total * p) / 100; repasse.value = isFinite(r) ? String(r) : ''; }
      else if (isFinite(r)) { p = (total !== 0) ? (r / total) * 100 : NaN; pct.value = isFinite(p) ? String(p) : ''; }
    }

    const rep = isFinite(r) ? r : 0;
    const acad = total - rep;
    outRepasse.textContent = fmt(rep);
    outAcademia.textContent = fmt(acad);
    const showP = isFinite(p) ? (Math.round(p*10000)/10000) : '—';
    outResumo.textContent = `Total ${fmt(total)} • Repasse ${fmt(rep)} (${showP}%) • Academia ${fmt(acad)}`;

    const nome = (colab.value || 'Colaborador').trim();
    const agora = new Date().toLocaleString('pt-BR', { timeZone:'America/Sao_Paulo' });
    preview.textContent =
`Recibo de Repasse (SIMULAÇÃO)
Colaborador: ${nome}
Valor Recebido: ${fmt(total)}
Repasse ao colaborador: ${fmt(rep)} (${isFinite(p)? (p.toFixed(4).replace('.',','))+'%' : '—'})
Fica para academia: ${fmt(acad)}
Data/Hora: ${agora}
—
*Observação*: esta é uma prévia local. Ao aprovarmos, ligaremos o botão com /api/financeiro/recibo_email.`;
    lock = false;
  }
  valorTotal.addEventListener('input', ()=> recalc('total'));
  pct.addEventListener('input', ()=> recalc('pct'));
  repasse.addEventListener('input', ()=> recalc('repasse'));
  colab.addEventListener('input', ()=> recalc('colab'));
  document.getElementById('btnLimpar').addEventListener('click', ()=>{
    colab.value = ''; valorTotal.value = ''; pct.value = ''; repasse.value = ''; recalc('clear');
  });
  document.getElementById('btnGerar').addEventListener('click', ()=>{
    alert('Simulação: ao aprovarmos, este botão chamará /api/financeiro/recibo_email com os dados.');
  });
  recalc('init');
})();
</script>
</body>
</html>
HTML
  touch "$DEST.created.$TS"
  echo " - criado: $DEST"
fi

# ========= 2) INJETAR / GARANTIR o botão no financeiro.html =========
if [ -f "$FIN" ]; then
  cp -f "$FIN" "$FIN.bak.$TS"

  if grep -q 'Repasses (Colaboradores)' "$FIN"; then
    echo " - botão já existe em $FIN (mantendo)."
  else
    # insere após o <h1> principal
    python3 - "$FIN" <<'PY'
import io,sys,re
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()
btn_html = '\n    <div style="text-align:center;margin:10px 0 18px;">\n      <a class="btn-back" href="/admin/financeiro/repasses.html" style="display:inline-flex;align-items:center;gap:.5rem;padding:.6rem 1rem;background:#111827;border:1px solid #334155;border-radius:.6rem;color:#bfdbfe;text-decoration:none">↗ Repasses (Colaboradores)</a>\n    </div>\n'
s2 = re.sub(r'(<h1[^>]*>[^<]*</h1>)', r'\1'+btn_html, s, count=1, flags=re.I)
io.open(p,'w',encoding='utf-8').write(s2)
PY
    echo " - patch aplicado ao $FIN"
  fi
else
  echo "AVISO: não encontrei $FIN — pulei o patch do botão."
fi

echo "OK. Arquivo pronto em: $DEST"
echo "Para desfazer: ./$UNDO"
echo "Dica: faça deploy para servir em produção (ex.: npx vercel@latest --prod)"
