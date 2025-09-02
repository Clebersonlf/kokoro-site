(function(){
  function $(s){return document.querySelector(s)}
  function ensureOutBox(){
    // cria uma caixinha abaixo do formulário do modal
    let out = document.getElementById('kkrInviteOut');
    if(out) return out;
    const card = document.querySelector('.kkr-card') || document.body;
    out = document.createElement('div');
    out.id = 'kkrInviteOut';
    out.setAttribute('role','status');
    out.style.marginTop = '10px';
    out.style.padding   = '12px';
    out.style.border    = '1px solid rgba(148,163,184,.35)';
    out.style.borderRadius = '10px';
    out.style.background   = 'rgba(15,23,42,.55)';
    out.style.color        = '#cbd5e1';
    out.style.fontSize     = '14px';
    out.style.wordBreak    = 'break-word';
    card.appendChild(out);
    return out;
  }
  function setOut(html){
    const out = ensureOutBox();
    out.innerHTML = html;
  }
  function onReady(fn){
    (document.readyState==='loading')
      ? document.addEventListener('DOMContentLoaded',fn)
      : fn();
  }

  onReady(function(){
    // garante estilos mínimos pros botões dentro da caixa
    const st = document.createElement('style');
    st.textContent = `
      #kkrInviteOut .row{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem}
      #kkrInviteOut .btn{padding:.45rem .75rem;border-radius:.6rem;border:1px solid rgba(148,163,184,.3);background:#0b1220;color:#e5f0ff;cursor:pointer}
      #kkrInviteOut .btn:hover{filter:brightness(1.15)}
      #kkrInviteOut code{display:block;margin-top:.35rem;padding:.4rem .55rem;border-radius:.4rem;background:#0a0f1a;color:#9ae6b4}
    `;
    document.head.appendChild(st);

    // botão "Gerar link + enviar"
    const sendBtn = document.querySelector('#invSend, .kkr-btn.primary');
    if(!sendBtn) return;

    // Intercepta o clique (impede lógica antiga que criava link gigante)
    sendBtn.addEventListener('click', async function(ev){
      ev.preventDefault(); ev.stopPropagation();

      const nome = ($('#invNome')||{}).value?.trim() || '';
      const email= ($('#invEmail')||{}).value?.trim() || '';
      const phone= ($('#invFone')||{}).value?.trim() || '';
      const wa   = ($('#invApp') ||{}).value?.trim() || '';
      const obs  = ($('#invObs') ||{}).value?.trim() || '';

      if(!nome){ setOut('<span style="color:#fca5a5">Informe o nome.</span>'); return; }
      if(!email){ setOut('<span style="color:#fca5a5">Informe o e-mail.</span>'); return; }

      setOut('<span style="color:#93c5fd">Gerando link…</span>');

      try{
        const r = await fetch('/api/convites/criar',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ nome, email, telefone: phone, wa, obs })
        });
        const j = await r.json();
        if(!j.ok) throw new Error(j.error||'Falhou');

        const token = j.token;
        const link  = `https://www.planckkokoro.com/cadastro.html?token=${encodeURIComponent(token)}`;

        setOut(
          `<div><strong style="color:#22c55e">Link gerado</strong> (curto, só token):`+
          `<code>${link}</code>`+
          `<div class="row">`+
            `<button class="btn" id="btnCopy">Copiar link</button>`+
            `<button class="btn" id="btnUndo" data-token="${token}">Desfazer convite</button>`+
          `</div></div>`
        );

        // copiar
        const btnCopy = document.getElementById('btnCopy');
        btnCopy?.addEventListener('click', ()=> navigator.clipboard.writeText(link));

        // desfazer
        const btnUndo = document.getElementById('btnUndo');
        btnUndo?.addEventListener('click', async ()=>{
          btnUndo.disabled = true;
          const r2 = await fetch('/api/convites/cancelar',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ token })
          });
          const j2 = await r2.json();
          setOut(j2.ok ? '<span style="color:#fca5a5">Convite desfeito.</span>'
                       : '<span style="color:#fca5a5">Falha ao desfazer: '+(j2.error||'')+'</span>');
        });
      }catch(e){
        setOut('<span style="color:#fca5a5">Erro: '+e.message+'</span>');
      }
    }, true);
  });
})();
