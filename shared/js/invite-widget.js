(function(){
  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));

  const sel = {
    modal: '#kkrInviteModal',
    backdrop: '#kkrInviteBackdrop',
    nome: '#invNome',
    email: '#invEmail',
    fone: '#invFone',
    app: '#invApp',
    obs: '#invObs',
    send: '#invSend',
    cancel: '#invCancel',
    openBtn: '#btnInvite,[data-action="invite-open"]'
  };

  function show(el){ el && el.removeAttribute('hidden'); }
  function hide(el){ el && el.setAttribute('hidden',''); }

  function openModal(){
    const m = qs(sel.modal), b = qs(sel.backdrop);
    if(!m) return;
    show(m); if(b){ b.removeAttribute('aria-hidden'); b.style.display='block'; }
    // foco no primeiro campo
    const nome = qs(sel.nome); if(nome) setTimeout(()=>nome.focus(), 50);
  }

  function closeModal(){
    const m = qs(sel.modal), b = qs(sel.backdrop);
    if(!m) return;
    hide(m); if(b){ b.setAttribute('aria-hidden','true'); b.style.display='none'; }
  }

  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
  }

  async function criarConvite(payload){
    const resp = await fetch('/api/convites/criar', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(()=> ({}));
    if(!resp.ok || !data.ok) throw new Error(data.error || 'Falha ao criar convite');
    return data; // { ok:true, id, token, link }
  }

  function renderSucesso({link, token}){
    const m = qs(sel.modal);
    if(!m) return;
    const html = `
      <div class="kkr-card">
        <h3>Convite gerado</h3>
        <p class="sub" style="margin-top:4px">Envie o link para o aluno completar o cadastro.</p>

        <div class="kkr-field">
          <label>Link</label>
          <div style="display:flex; gap:8px; align-items:center">
            <input id="invLinkOut" value="${link}" readonly style="flex:1; padding:.6rem; border-radius:8px;">
            <button class="kkr-btn secondary" id="btnCopy">Copiar</button>
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px">
          <a class="kkr-btn primary" id="btnWhats" href="#" target="_blank" rel="noopener">WhatsApp</a>
          <a class="kkr-btn secondary" id="btnTg" href="#" target="_blank" rel="noopener">Telegram</a>
          <a class="kkr-btn secondary" id="btnMail" href="#" target="_blank" rel="noopener">E-mail</a>
          <button class="kkr-btn" id="btnFechar">Fechar</button>
        </div>

        <p class="sub" style="margin-top:8px; opacity:.8">Token: <code>${token}</code></p>
      </div>
    `;
    m.innerHTML = html;

    // ligar botões
    const linkEl = qs('#invLinkOut');
    const btnCopy = qs('#btnCopy');
    const btnFechar = qs('#btnFechar');
    const btnWhats = qs('#btnWhats');
    const btnTg = qs('#btnTg');
    const btnMail = qs('#btnMail');

    btnCopy?.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(link); btnCopy.textContent='Copiado!'; setTimeout(()=>btnCopy.textContent='Copiar',1200);}catch(_){}
    });

    btnFechar?.addEventListener('click', closeModal);

    // montar mensagens
    const msg = encodeURIComponent('Olá! Use este link para completar seu cadastro: ' + link);
    btnWhats?.setAttribute('href', 'https://wa.me/?text=' + msg);
    btnTg?.setAttribute('href', 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + msg);
    btnMail?.setAttribute('href', 'mailto:?subject=' + encodeURIComponent('Convite para cadastro') + '&body=' + msg);
  }

  function setup(){
    // Abrir modal (botão)
    qsa(sel.openBtn).forEach(btn=>{
      btn.addEventListener('click', (ev)=>{ ev.preventDefault(); openModal(); });
    });

    // Fechar no Cancelar
    const btnCancel = qs(sel.cancel);
    btnCancel && btnCancel.addEventListener('click', (ev)=>{ ev.preventDefault(); closeModal(); });

    // Habilitar/Desabilitar enviar
    const nome = qs(sel.nome), email = qs(sel.email), send = qs(sel.send);
    function reevaluate(){
      const ok = (nome?.value?.trim()?.length>0) && validEmail(email?.value);
      if(send){ send.disabled = !ok; }
    }
    [nome,email].forEach(el => el && el.addEventListener('input', reevaluate));
    reevaluate();

    // Enviar
    send && send.addEventListener('click', async (ev)=>{
      ev.preventDefault();
      if(send.disabled) return;

      const payload = {
        nome: qs(sel.nome)?.value?.trim() || '',
        email: qs(sel.email)?.value?.trim() || '',
        telefone: qs(sel.fone)?.value?.trim() || '',
        whatsapp: qs(sel.app)?.value?.trim() || '',
        observacoes: qs(sel.obs)?.value?.trim() || ''
      };

      send.disabled = true; const old = send.textContent; send.textContent = 'Enviando...';
      try{
        const data = await criarConvite(payload); // { ok, token, link }
        renderSucesso(data);
      }catch(e){
        alert('Falha ao criar convite: ' + e.message);
        send.disabled = false; send.textContent = old;
      }
    });

    // Abrir via evento customizado (se algum script disparar)
    document.addEventListener('kkr:invite:open', openModal);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
