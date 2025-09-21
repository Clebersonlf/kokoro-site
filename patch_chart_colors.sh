#!/usr/bin/env bash
set -euo pipefail

FILE="admin/financeiro/relatorios.html"
[ -f "$FILE" ] || { echo "ERRO: não achei $FILE"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
BAK="${FILE}.bak.${TS}"
cp -f "$FILE" "$BAK"

UNDO="UNDO_patch_chart_colors_${TS}.sh"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cp -f "$BAK" "$FILE"
echo "OK: restaurado $FILE a partir de $BAK"
EOF
chmod +x "$UNDO"

python3 - "$FILE" <<'PY'
import io, sys, re
path = sys.argv[1]
html = io.open(path, 'r', encoding='utf-8').read()

panel_html = r"""
<!-- === KOKORO: Painel de Cores dos Gráficos === -->
<style>
  .kkr-color-panel{margin:16px 0;padding:12px;border:1px solid #334155;border-radius:10px;background:#0b1220;}
  .kkr-color-panel h3{margin:0 0 10px;font-size:16px;color:#93c5fd}
  .kkr-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
  .kkr-color-item{display:flex;flex-direction:column;gap:6px;align-items:center}
  .kkr-color-item label{font-size:12px;color:#a3b3c7}
  .kkr-color-item input[type="color"]{width:44px;height:34px;border:0;background:transparent;padding:0}
  .kkr-btn{border:1px solid #3b82f6;background:#1e293b;color:#e5f0ff;border-radius:8px;padding:8px 10px;cursor:pointer}
  .kkr-btn:active{transform:translateY(1px)}
  .kkr-preset{display:flex;gap:8px;flex-wrap:wrap}
  .kkr-note{font-size:12px;color:#8fa6c1;margin-top:8px}
</style>
<div class="kkr-color-panel" id="kkr-color-panel" style="display:none">
  <h3>🎨 Cores dos Gráficos</h3>
  <div class="kkr-row" id="kkr-color-pickers"></div>
  <div style="height:8px"></div>
  <div class="kkr-row">
    <div class="kkr-preset">
      <button type="button" class="kkr-btn" data-preset="default">Preset: Padrão</button>
      <button type="button" class="kkr-btn" data-preset="warm">Preset: Quente</button>
      <button type="button" class="kkr-btn" data-preset="cool">Preset: Frio</button>
      <button type="button" class="kkr-btn" data-preset="mono">Preset: Monocromático</button>
    </div>
    <div style="flex:1"></div>
    <button type="button" class="kkr-btn" id="kkr-save">Salvar</button>
    <button type="button" class="kkr-btn" id="kkr-reset">Resetar cores</button>
  </div>
  <div class="kkr-note">Dica: as cores são salvas no seu navegador e aplicadas a todos os gráficos desta página.</div>
</div>

<script>
(function(){
  // Só monta o painel quando Chart.js estiver presente
  function whenChartReady(cb){
    if (window.Chart) return cb();
    let tries = 0;
    const iv = setInterval(()=>{
      tries++;
      if (window.Chart){ clearInterval(iv); cb(); }
      if (tries > 50) clearInterval(iv); // ~5s
    }, 100);
  }

  const STORAGE_KEY = 'kokoro_chart_palette_v1';
  const DEFAULT = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#22d3ee'];
  const PRESETS = {
    default: DEFAULT,
    warm:    ['#ef4444','#f97316','#f59e0b','#eab308','#fb7185','#fca5a5'],
    cool:    ['#3b82f6','#22d3ee','#06b6d4','#14b8a6','#10b981','#84cc16'],
    mono:    ['#3b82f6','#2f6ad1','#2451a8','#1a3b85','#10275f','#0b1b42']
  };

  function loadPalette(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }catch(e){}
    return DEFAULT.slice();
  }
  function savePalette(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function applyPaletteToCharts(palette){
    if (!window.Chart) return;
    // Chart.js 3/4: instances pode ser Map/objeto. Tentamos cobrir ambos.
    let instances = [];
    try {
      if (Chart.instances) {
        instances = Array.isArray(Chart.instances) ? Chart.instances
                  : Array.from(Object.values(Chart.instances));
      } else if (Chart.registry && Chart.registry._instances) {
        instances = Array.from(Chart.registry._instances.items || []);
      }
    } catch(e){}
    // Fallback: procurar gráficos conhecidos via canvases com _chart
    document.querySelectorAll('canvas').forEach(cv=>{
      if (cv && cv._chart && instances.indexOf(cv._chart)===-1) instances.push(cv._chart);
    });

    instances.forEach(ch=>{
      if (!ch || !ch.config) return;
      const type = ch.config.type || '';
      const dsArr = (ch.config.data && ch.config.data.datasets) ? ch.config.data.datasets : [];

      dsArr.forEach((ds, idx)=>{
        const color = palette[idx % palette.length];
        if (type==='pie' || type==='doughnut' || type==='polarArea') {
          // série única com várias fatias -> vetor de cores
          const n = (ch.config.data.labels||[]).length || 0;
          const arr = Array.from({length:n}).map((_,i)=> palette[i % palette.length]);
          ds.backgroundColor = arr;
          ds.borderColor = arr;
        } else {
          // linhas / barras
          ds.borderColor = color;
          ds.backgroundColor = (type==='line')
            ? color + '33' // 20% alpha (hex)
            : color;
          if (ds.pointBackgroundColor !== undefined) ds.pointBackgroundColor = color;
          if (ds.pointBorderColor !== undefined) ds.pointBorderColor = color;
        }
      });

      try{ ch.update(); }catch(e){}
    });
  }

  function buildPanel(){
    const panel = document.getElementById('kkr-color-panel');
    if (!panel) return;
    panel.style.display = '';

    const pickers = document.getElementById('kkr-color-pickers');
    pickers.innerHTML = '';
    const pal = loadPalette();
    const inputs = [];

    for (let i=0;i<6;i++){
      const wrap = document.createElement('div');
      wrap.className = 'kkr-color-item';
      const label = document.createElement('label');
      label.textContent = 'Cor '+(i+1);
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.value = pal[i] || DEFAULT[i];
      wrap.appendChild(label);
      wrap.appendChild(inp);
      pickers.appendChild(wrap);
      inputs.push(inp);
    }

    // presets
    panel.querySelectorAll('button[data-preset]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const key = btn.getAttribute('data-preset');
        const arr = PRESETS[key] || DEFAULT;
        inputs.forEach((inp, i)=> inp.value = arr[i] || DEFAULT[i]);
      });
    });

    // salvar
    document.getElementById('kkr-save').addEventListener('click', ()=>{
      const arr = inputs.map(i=>i.value);
      savePalette(arr);
      applyPaletteToCharts(arr);
    });

    // reset
    document.getElementById('kkr-reset').addEventListener('click', ()=>{
      inputs.forEach((inp,i)=> inp.value = DEFAULT[i]);
      savePalette(DEFAULT.slice());
      applyPaletteToCharts(DEFAULT.slice());
    });

    // aplica ao carregar
    applyPaletteToCharts(pal);
  }

  // Insere o painel acima do primeiro <h1> encontrado
  function injectPanel(){
    const container = document.body || document.documentElement;
    const h1 = document.querySelector('h1, .page-title, .title');
    if (h1 && h1.parentElement) {
      h1.insertAdjacentHTML('afterend', document.getElementById('kkr-color-panel') ? '' : document.currentScript.previousElementSibling.outerHTML);
    }
  }

  // Monta painel quando Chart estiver pronto
  whenChartReady(()=> {
    buildPanel();
  });

})();
</script>
"""

# Inserir antes de </body>. Se não tiver, no final do arquivo.
if re.search(r'</body\s*>', html, re.I):
    html = re.sub(r'</body\s*>', panel_html + '\n</body>', html, flags=re.I, count=1)
else:
    html = html + '\n' + panel_html

io.open(path, 'w', encoding='utf-8').write(html)
print("OK: painel de cores injetado em", path)
PY

echo "OK. Backup em: $BAK"
echo "Para desfazer: ./$UNDO"
