#!/usr/bin/env bash
set -euo pipefail

REL="admin/financeiro/relatorios.html"
TS="$(date +%Y%m%d_%H%M%S)"
UNDO="UNDO_add_chart_colors_${TS}.sh"

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

# 1) Insere um painel de cores (logo antes do </body>, se ainda não existir)
if ! grep -q 'id="chart-color-panel"' "$REL"; then
  sed -i 's#</body>#\n<!-- Painel de cores dos gráficos -->\n<section id="chart-color-panel" style="margin:24px auto;max-width:1200px;background:#171717;border:1px solid #333;border-radius:12px;padding:16px;">\n  <h2 style="margin:0 0 10px;color:#9ad1ff">🎨 Cores dos Gráficos</h2>\n  <p style="margin:6px 0 16px;color:#9aa7b5">Ajuste as cores abaixo e clique em <strong>Salvar</strong>. As escolhas ficam salvas neste navegador.</p>\n  <div id="chart-color-controls" style="display:grid;gap:16px"></div>\n</section>\n</body>#' "$REL"
  echo " - painel injetado"
else
  echo " - painel já existe (OK)"
fi

# 2) Injeta JS para construir color pickers dinamicamente e salvar/resetar
cat >> "$REL" <<'EOF'
<script>
(function(){
  // IDs esperados dos <canvas> já existentes:
  const CHART_IDS = [
    {id:'chartLinha',   titulo:'Gráfico de Linha'},
    {id:'chartPizza',   titulo:'Gráfico de Pizza'},
    {id:'chartBarras',  titulo:'Gráfico de Barras'},
    {id:'chartColunas', titulo:'Gráfico de Colunas'}
  ];

  const lsKey = id => `kokoro_chart_colors_${id}`;

  // util: normaliza cores para array
  function normalizeColors(bg){
    if(!bg) return [];
    if(Array.isArray(bg)) return bg.slice();
    return [bg];
  }

  // cria bloco de UI por gráfico
  function createControlsForChart(canvasId, titulo){
    const chart = (window.Chart && window.Chart.getChart) ? window.Chart.getChart(canvasId) : null;
    if(!chart) return null;

    // Usamos o primeiro dataset como base das cores (padrão do Chart.js)
    const ds = chart.data.datasets?.[0];
    if(!ds) return null;

    // se não houver cores, geramos a partir do número de labels/dados
    const labelsCount = Math.max(chart.data.labels?.length || 0, (Array.isArray(ds.data)? ds.data.length : 0));
    let colors = normalizeColors(ds.backgroundColor);
    if(colors.length===0){
      // gera tons básicos
      for(let i=0;i<Math.max(1, labelsCount);i++){
        const hue = Math.round((i*360/Math.max(1,labelsCount))%360);
        colors.push(`hsl(${hue} 70% 50%)`);
      }
    } else if(colors.length < labelsCount) {
      // duplica até cobrir
      const base = colors.slice();
      while(colors.length < labelsCount){ colors = colors.concat(base); }
      colors = colors.slice(0, labelsCount);
    }

    // tenta carregar customização salva
    try{
      const saved = JSON.parse(localStorage.getItem(lsKey(canvasId)) || 'null');
      if(saved && Array.isArray(saved) && saved.length>0){
        colors = saved.slice(0, labelsCount);
        if(colors.length<labelsCount){
          while(colors.length<labelsCount) colors.push('#888888');
        }
      }
    }catch(_e){}

    // monta UI
    const wrap = document.createElement('div');
    wrap.style.border = '1px solid #2a2a2a';
    wrap.style.borderRadius = '10px';
    wrap.style.padding = '12px';

    const h3 = document.createElement('h3');
    h3.textContent = titulo;
    h3.style.margin = '0 0 10px';
    h3.style.color = '#e5e7eb';
    wrap.appendChild(h3);

    // grade de pickers
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    grid.style.gap = '10px';

    const pickers = [];
    // para linha/coluna que usam 1 cor, vamos permitir 1 picker; para pizza/barras com múltiplos segmentos usamos N
    const isMulti = Array.isArray(ds.data) && ds.data.length>1 && (chart.config.type==='pie' || chart.config.type==='doughnut' || chart.config.type==='bar');
    const total = isMulti ? colors.length : 1;

    for(let i=0;i<total;i++){
      const box = document.createElement('div');
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.gap = '8px';

      const lab = document.createElement('label');
      lab.textContent = isMulti ? `Cor ${i+1}` : `Cor principal`;
      lab.style.fontSize = '12px';
      lab.style.color = '#9aa7b5';

      const inp = document.createElement('input');
      inp.type = 'color';
      // converte hsl/rgba para hex simples quando possível
      const tmp = document.createElement('canvas');
      function anyToHex(c){
        // já é hex
        if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return c;
        // usa um canvas para converter qualquer css color para rgba e então para hex
        const ctx = tmp.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.clearRect(0,0,1,1);
        ctx.fillStyle = c;
        // pega valor computado
        const s = ctx.fillStyle;
        // esperado: rgba(r,g,b,a)
        const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(s);
        if(!m) return '#888888';
        const r = parseInt(m[1],10), g = parseInt(m[2],10), b = parseInt(m[3],10);
        const toHex = n => ('0'+n.toString(16)).slice(-2);
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
      inp.value = anyToHex(colors[i] || '#888888');
      inp.style.width = '48px';
      inp.style.height = '32px';
      inp.style.border = '1px solid #444';
      inp.style.borderRadius = '6px';
      pickers.push(inp);

      box.appendChild(lab);
      box.appendChild(inp);
      grid.appendChild(box);
    }

    wrap.appendChild(grid);

    // ações
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.marginTop = '12px';

    const btnApply = document.createElement('button');
    btnApply.textContent = 'Salvar';
    btnApply.className = 'btn btn-principal';
    btnApply.onclick = ()=>{
      let newColors = pickers.map(p=>p.value);
      if(isMulti){
        ds.backgroundColor = newColors;
        if(Array.isArray(ds.borderColor) && ds.borderColor.length===ds.backgroundColor.length){
          ds.borderColor = newColors;
        } else {
          ds.borderColor = newColors;
        }
      } else {
        ds.backgroundColor = newColors[0];
        ds.borderColor = newColors[0];
      }
      chart.update();
      localStorage.setItem(lsKey(canvasId), JSON.stringify(isMulti ? newColors : [newColors[0]]));
    };

    const btnReset = document.createElement('button');
    btnReset.textContent = 'Resetar';
    btnReset.className = 'btn btn-ghost';
    btnReset.onclick = ()=>{
      localStorage.removeItem(lsKey(canvasId));
      // força reload para restaurar cores originais da página
      location.reload();
    };

    actions.appendChild(btnApply);
    actions.appendChild(btnReset);
    wrap.appendChild(actions);

    return wrap;
  }

  function buildPanel(){
    const host = document.getElementById('chart-color-controls');
    if(!host) return;
    host.innerHTML = '';
    CHART_IDS.forEach(({id, titulo})=>{
      const block = createControlsForChart(id, titulo);
      if(block) host.appendChild(block);
    });
  }

  // tenta montar o painel quando a página e os gráficos já existem
  const tryBuild = ()=>{
    if (!window.Chart || !window.Chart.getChart) return false;
    let ok = false;
    for(const {id} of [{id:'chartLinha'},{id:'chartPizza'},{id:'chartBarras'},{id:'chartColunas'}]){
      if(window.Chart.getChart(id)) { ok = true; break; }
    }
    if(ok){ buildPanel(); return true; }
    return false;
  };

  document.addEventListener('DOMContentLoaded', ()=>{
    // tenta já; se ainda não estiverem prontos, re-tenta por alguns segundos
    if(tryBuild()) return;
    let tries = 0;
    const iv = setInterval(()=>{
      tries++;
      if(tryBuild() || tries>40){ clearInterval(iv); }
    }, 250);
  });
})();
</script>
EOF
echo " - JS de controle de cores injetado"

echo ">> Deploy (produção)…"
npx vercel@latest --prod

echo
echo "OK! Atualize a página de Relatórios (Ctrl/Cmd+Shift+R)."
echo "Se quiser desfazer: ./$UNDO"
