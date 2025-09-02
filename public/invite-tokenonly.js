(function(){
  function $(sel){ return document.querySelector(sel); }
  function onReady(fn){ document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',fn) : fn(); }

  onReady(function(){
    const btn = document.querySelector('#invSend, .kkr-btn.primary');
    if(!btn) return;

    const out = document.getElementById('kkrInviteOut') || (function(){
      const p=document.createElement('p'); p.id='kkrInviteOut'; p.style.whiteSpace='pre-wrap'; p.style.wordBreak='break-word';
      const card=document.querySelector('.kkr-card')||document.body; card.appendChild(p); return p;
    })();

    btn.addEventListener('click', async function(ev){
      // impede comportamento antigo
      ev.preventDefault(); ev.stopPropagation();

      const nome = ($('#invNome')||{}).value || '';
      const email= ($('#invEmail')||{}).value || '';
      const phone= ($('#invFone')||{}).value || '';
      const wa   = ($('#invApp') ||{}).value || '';
      const obs  = ($('#invObs') ||{}).value || '';

      if(!nome){ out.textContent='Informe o nome.'; return; }
      if(!email){ out.textContent='Informe o e-mail.'; return; }

      out.textContent='Gerando link...';

      try{
        const r = await fetch('/api/convites/criar',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ nome, email, telefone: phone, wa, obs })
        });
        const j = await r.json();
        if(!j.ok) throw new Error(j.error||'Falhou');

        const token = j.token;
        const link = `https://www.planckkokoro.com/cadastro.html?token=${encodeURIComponent(token)}`;

        out.innerHTML = [
          `<span style="color:#22c55e">Link gerado:</span>`,
          `<code style="display:block;margin-top:.5rem">${link}</code>`,
          `<div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">`,
          `<button id="copyLink" class="kkr-btn secondary">Copiar link</button>`,
          `<button id="undoInvite" class="kkr-btn danger" data-token="${token}">Desfazer</button>`,
          `</div>`
        ].join('\n');

        const copyBtn = document.getElementById('copyLink');
        copyBtn?.addEventListener('click', ()=> navigator.clipboard.writeText(link));

        const undoBtn = document.getElementById('undoInvite');
        undoBtn?.addEventListener('click', async ()=>{
          undoBtn.disabled = true;
          const r2 = await fetch('/api/convites/cancelar',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token}) });
          const j2 = await r2.json();
          out.textContent = j2.ok ? 'Convite desfeito.' : ('Falha ao desfazer: '+(j2.error||''));
        });

      }catch(e){
        out.textContent = 'Erro: '+ e.message;
      }
    }, true);
  });
})();
