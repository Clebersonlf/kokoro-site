// Widget "Enviar convite" para admin/cadastro/lista.html (não-invasivo)
(() => {
  function el(tag, attrs={}, children=[]) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k in e) e[k] = v; else e.setAttribute(k, v);
    });
    children.forEach(c => e.appendChild(typeof c==='string' ? document.createTextNode(c) : c));
    return e;
  }

  function showMsg(target, text, ok=false) {
    target.textContent = text || '';
    target.style.color = ok ? '#0a0' : '#c00';
  }

  // injeta um botão discreto no topo da página
  function injectButton() {
    const host = document.querySelector('h1, h2, .page-title, body');
    if (!host || document.getElementById('btnInvite')) return;

    const wrap = el('div', {style:{margin:'8px 0', display:'flex', gap:'8px', alignItems:'center'}});
    const btn  = el('button', {id:'btnInvite', textContent:'📨 Enviar convite', style:{padding:'6px 10px', cursor:'pointer'}});
    const msg  = el('span', {id:'inviteMsg', style:{marginLeft:'8px', fontSize:'0.95em'}});

    btn.addEventListener('click', async () => {
      showMsg(msg, 'Preparando...', true);

      // Coleta dados via prompt para não depender do HTML atual
      const email = (prompt('E-mail do aluno (obrigatório):') || '').trim();
      if (!email) { showMsg(msg, 'Informe um e-mail válido.', false); return; }
      const telefone = (prompt('Telefone com DDI+DDD (opcional, só números):') || '').replace(/\D/g,'') || null;
      const nome = (prompt('Nome (opcional):') || '').trim() || null;

      showMsg(msg, 'Gerando convite...', true);

      try {
        const r = await fetch('/api/send-welcome', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, telefone, nome, via:'email' })
        });
        const data = await r.json().catch(()=> ({}));

        if (!r.ok || !data.ok || !data.link) {
          showMsg(msg, data?.message || 'Falha ao gerar convite.', false);
          return;
        }

        // Mostra links
        const { suggestions = {} } = data.delivery || {};
        const lines = [
          `Link de completar cadastro:\n${data.link}`,
          suggestions.whatsapp ? `\nWhatsApp:\n${suggestions.whatsapp}` : '',
          suggestions.telegram ? `\nTelegram:\n${suggestions.telegram}` : '',
          suggestions.sms ? `\nSMS:\n${suggestions.sms}` : '',
          suggestions.mailto ? `\nE-mail:\n${suggestions.mailto}` : '',
        ].filter(Boolean).join('\n');

        // caixa amigável
        alert(lines);
        showMsg(msg, 'Convite gerado com sucesso.', true);
      } catch (e) {
        showMsg(msg, 'Erro de conexão.', false);
      }
    });

    wrap.appendChild(btn);
    wrap.appendChild(msg);

    // insere logo após o primeiro título, ou no body como fallback
    if (host.parentElement) {
      host.parentElement.insertBefore(wrap, host.nextSibling);
    } else {
      document.body.insertBefore(wrap, document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
