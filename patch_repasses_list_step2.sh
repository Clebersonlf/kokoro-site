#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
API="./api/financeiro/repasses_list.js"
UI="./admin/financeiro/repasses.html"
ADMIN="./admin/financeiro/financeiro.html"
UNDO="UNDO_patch_repasses_list_${TS}.sh"

# ---------- UNDO ----------
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
[ -f "$API" ] && rm -f "$API" && echo " - removido: $API"
[ -f "$UI.bak.$TS" ] && mv -f "$UI.bak.$TS" "$UI" && echo " - restaurado: $UI"
[ -f "$ADMIN.bak.$TS" ] && mv -f "$ADMIN.bak.$TS" "$ADMIN" && echo " - restaurado: $ADMIN"
echo "OK: desfazido."
EOF
chmod +x "$UNDO"
echo ">> UNDO criado: ./$UNDO"

# ---------- API: GET /api/financeiro/repasses_list ----------
mkdir -p "$(dirname "$API")"
cat > "$API" <<'JS'
import { getClient } from '../../lib/db.js';

export default async function handler(req,res){
  try{
    if(req.method!=='GET'){ res.setHeader('Allow','GET'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
    const secret = req.headers['x-admin-secret'];
    if(!secret || secret !== process.env.ADMIN_SECRET){ return res.status(401).json({ok:false,error:'unauthorized'}); }

    const u = new URL(req.url, `https://${req.headers.host}`);
    const q = Object.fromEntries(u.searchParams.entries());
    const professor_id = q.professor_id || null;
    const from = q.from || null;
    const to   = q.to   || null;
    const search = (q.search||'').trim();
    const limit = Math.max(1, Math.min(200, Number(q.limit||50)));
    const offset= Math.max(0, Number(q.offset||0));

    const client = getClient(); await client.connect();
    try{
      await client.sql`CREATE TABLE IF NOT EXISTS repasses (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        professor_id UUID NOT NULL,
        base_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
        percent NUMERIC(7,4) NOT NULL DEFAULT 0,
        repasse_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
        metodo TEXT NOT NULL DEFAULT 'PIX',
        pago_em TIMESTAMPTZ NOT NULL,
        observacao TEXT,
        referencia TEXT NOT NULL
      );`;
      await client.sql`CREATE UNIQUE INDEX IF NOT EXISTS repasses_ref_uniq ON repasses(referencia);`;

      // filtros dinâmicos
      const where = [];
      const params = {};
      if(professor_id){ where.push(`professor_id = ${'professor_id'}`); params.professor_id = professor_id; }
      if(from){ where.push(`pago_em >= ${'from'}`); params.from = new Date(from).toISOString(); }
      if(to){ where.push(`pago_em < ${'to'}`); params.to = new Date(to).toISOString(); }
      if(search){
        where.push(`(LOWER(observacao) LIKE ${'s1'} OR LOWER(referencia) LIKE ${'s2'})`);
        params.s1 = `%${search.toLowerCase()}%`;
        params.s2 = `%${search.toLowerCase()}%`;
      }
      const whereSql = where.length ? ('WHERE '+where.join(' AND ')) : '';

      const { rows } = await client.sql({
        text: `
          SELECT id, created_at, professor_id, base_valor, percent, repasse_valor,
                 metodo, pago_em, observacao, referencia
          FROM repasses
          ${whereSql}
          ORDER BY pago_em DESC, id DESC
          LIMIT ${limit} OFFSET ${offset};`,
        values: Object.values(params)
      });

      const { rows: tot } = await client.sql({
        text: `
          SELECT COUNT(*)::int AS count,
                 COALESCE(SUM(base_valor),0)::numeric(12,2) AS base_total,
                 COALESCE(SUM(repasse_valor),0)::numeric(12,2) AS repasse_total
          FROM repasses
          ${whereSql};`,
        values: Object.values(params)
      });

      return res.json({ ok:true, items: rows, total: tot[0] });
    }catch(e){
      return res.status(500).json({ok:false,error:String(e)});
    }finally{
      await client.end();
    }
  }catch(err){
    return res.status(500).json({ok:false,error:String(err)});
  }
}
JS
echo " - API criada/atualizada: $API"

# ---------- UI: injeta card de histórico em repasses.html ----------
if [ -f "$UI" ]; then
  cp -f "$UI" "$UI.bak.$TS"
  python3 - "$UI" <<'PY'
import io,re,sys
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()

if 'id="kkr-repasses-lista"' not in s:
  card = r"""
<section class="card" id="kkr-repasses-lista" style="margin-top:16px">
  <h2>Histórico de Repasses</h2>
  <div class="form-grid">
    <div class="form-group"><label>Professor ID</label><input id="flt-prof" type="text" placeholder="UUID"></div>
    <div class="form-group"><label>De</label><input id="flt-from" type="date"></div>
    <div class="form-group"><label>Até</label><input id="flt-to" type="date"></div>
    <div class="form-group"><label>Busca</label><input id="flt-search" type="text" placeholder="referência/observação"></div>
    <div class="form-actions"><button type="button" class="btn btn-principal" id="btn-carregar">Carregar</button></div>
  </div>
  <div class="hint" id="sum-totais" style="margin:.5rem 0"></div>
  <div style="overflow:auto">
    <table style="width:100%; border-collapse:collapse" id="tbl-repasses">
      <thead>
        <tr>
          <th style="text-align:left">Pago em</th>
          <th style="text-align:left">Professor</th>
          <th style="text-align:right">Base (R$)</th>
          <th style="text-align:right">% Rep.</th>
          <th style="text-align:right">Repasse (R$)</th>
          <th style="text-align:left">Método</th>
          <th style="text-align:left">Ref.</th>
          <th style="text-align:left">Obs.</th>
        </tr>
      </thead>
      <tbody id="rows-repasses"></tbody>
    </table>
  </div>
</section>

<script>
(function(){
  const SECRET_KEY='kkr_admin_secret';
  const getSecret = ()=>localStorage.getItem(SECRET_KEY)||'';
  const fmtBR = (n,dec=2)=> (Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:dec, maximumFractionDigits:dec});
  const qs=(q)=>document.querySelector(q);

  async function carregar(){
    const params = new URLSearchParams();
    const pid = qs('#flt-prof').value.trim(); if(pid) params.set('professor_id', pid);
    const f = qs('#flt-from').value; if(f) params.set('from', f);
    const t = qs('#flt-to').value;   if(t) params.set('to', t);
    const s = qs('#flt-search').value.trim(); if(s) params.set('search', s);
    const url = '/api/financeiro/repasses_list?'+params.toString();

    const sec = getSecret();
    if(!sec){ alert('Configure o Admin Secret no bloco acima.'); return; }

    const resp = await fetch(url, { headers: { 'x-admin-secret': sec } });
    const data = await resp.json();
    if(!resp.ok || !data.ok){ throw new Error(data.error||('HTTP '+resp.status)); }

    const tb = qs('#rows-repasses'); tb.innerHTML='';
    for(const it of data.items){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(it.pago_em).toLocaleString('pt-BR',{ timeZone:'America/Sao_Paulo' })}</td>
        <td><code>${it.professor_id}</code></td>
        <td style="text-align:right">${fmtBR(it.base_valor)}</td>
        <td style="text-align:right">${fmtBR(it.percent,4)}</td>
        <td style="text-align:right"><b>${fmtBR(it.repasse_valor)}</b></td>
        <td>${it.metodo||'—'}</td>
        <td>${it.referencia||'—'}</td>
        <td>${it.observacao||'—'}</td>
      `;
      tb.appendChild(tr);
    }
    qs('#sum-totais').textContent =
      `Total linhas: ${data.total.count} • Base: R$ ${fmtBR(data.total.base_total)} • Repasses: R$ ${fmtBR(data.total.repasse_total)}`;
  }

  const btn = document.querySelector('#btn-carregar');
  if(btn){ btn.addEventListener('click', ()=>carregar().catch(e=>alert('Erro: '+e.message))); }

  // auto-carrega na primeira abertura
  setTimeout(()=>{ if(btn) btn.click(); }, 300);
})();
</script>
"""
  # injeta antes do </body> (ou no fim)
  if '</body>' in s.lower():
    s = re.sub(r'</body>', card+'\n</body>', s, flags=re.I)
  else:
    s = s + '\n' + card
  io.open(p,'w',encoding='utf-8').write(s)
  print(" - UI historico injetada:", p)
else:
  print(" - UI já tinha o histórico, mantido.")
PY
else
  echo "AVISO: não achei $UI (pulei o histórico)."
fi

# ---------- Admin: garante botão Repasses ----------
if [ -f "$ADMIN" ]; then
  cp -f "$ADMIN" "$ADMIN.bak.$TS"
  python3 - "$ADMIN" <<'PY'
import io,re,sys
p=sys.argv[1]
s=io.open(p,'r',encoding='utf-8').read()

btn = r'<a class="btn-back" href="/admin/financeiro/repasses.html"><span class="chevron">↗</span> Repasses (Colaboradores)</a>'
if 'Repasses (Colaboradores)' not in s:
  s = s.replace('</nav>', btn+'\n</nav>')
  io.open(p,'w',encoding='utf-8').write(s)
  print(" - Botão adicionado ao topo:", p)
else:
  print(" - Botão já existia no topo:", p)
PY
else
  echo "AVISO: não achei $ADMIN (pulei o botão no topo)."
fi

echo "OK."
