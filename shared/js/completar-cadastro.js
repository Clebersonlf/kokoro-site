(() => {
  const $ = (s, p=document) => p.querySelector(s);
  const msg = $('#msg');
  const form = $('#form');
  const statusEl = $('#status');

  function setMsg(t, ok=false){ if(!msg) return; msg.className = ok?'ok':'err'; msg.textContent = t||''; }
  function setStatus(t, ok=false){ if(!statusEl) return; statusEl.className = ok?'ok':'err'; statusEl.textContent = t||''; }

  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  if (!token) { setMsg('Token não encontrado. Verifique o link.', false); form?.remove(); return; }

  // Pré-carregar dados
  fetch('/api/alunos/complete?token='+encodeURIComponent(token))
    .then(r => r.json())
    .then(data => {
      if (!data.ok) { setMsg('Token inválido.', false); return; }
      const a = data.aluno || {};
      // Preenche de forma segura (se existir o campo no form)
      for (const [k,v] of Object.entries(a)) {
        const el = form.querySelector(`[name="${k}"]`);
        if (!el || v==null) continue;
        if (el.type === 'checkbox') el.checked = !!v;
        else el.value = v;
      }
      setMsg('Dados carregados. Complete o que faltar e envie.', true);
    })
    .catch(()=> setMsg('Não foi possível carregar seus dados.', false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Enviando...', true);

    const fd = new FormData(form);
    const payload = { token };
    fd.forEach((val, key) => {
      if (['peso_kg','altura_m','imc','idade'].includes(key) && val !== '') {
        payload[key] = Number(val);
      } else if (key.startsWith('parq_') || key.endsWith('_aceitos') || key.endsWith('_aceite')) {
        payload[key] = form.querySelector(`[name="${key}"]`).checked;
      } else {
        payload[key] = String(val || '');
      }
    });

    // IMC automático se não veio
    if (!payload.imc && payload.peso_kg && payload.altura_m) {
      const h = Number(payload.altura_m);
      const p = Number(payload.peso_kg);
      if (h > 0) payload.imc = +(p/(h*h)).toFixed(2);
    }

    try {
      const r = await fetch('/api/alunos/complete', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(()=>({}));
      if (r.ok && data.ok) {
        setStatus('Cadastro concluído com sucesso!', true);
      } else {
        setStatus(data.message || 'Falha ao concluir o cadastro.', false);
      }
    } catch(_){
      setStatus('Erro de conexão. Tente novamente.', false);
    }
  });
})();
