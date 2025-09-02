// Rebuild do botão "Enviar convite": fechado por padrão, abre só ao clicar
(function(){
  // CSS
  let css = document.getElementById('kkrInviteRebuildCSS');
  if(!css){
    css = document.createElement('style'); css.id='kkrInviteRebuildCSS';
    css.textContent = `
      body.kkr-modal-open{overflow:hidden}
      .kkr-invite-wrap{display:flex;align-items:center;gap:12px;margin:12px 24px}
      @media (max-width:768px){.kkr-invite-wrap{margin:12px}}
      .kkr-invite-btn{padding:.55rem 1rem;border:none;border-radius:.65rem;font-weight:700;cursor:pointer}
      .kkr-invite-btn.btn-success{background:#16a34a;color:#fff}
      .kkr-invite-btn.btn-success:disabled{opacity:.6;cursor:not-allowed}
      .kkr-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:1000}
      .kkr-modal-backdrop[aria-hidden="false"]{display:block}
      .kkr-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                 width:min(90vw,560px);background:#0f172a;color:#e5e7eb;border-radius:14px;
                 box-shadow:0 20px 60px rgba(0,0,0,.45);display:none;z-index:1001}
      .kkr-modal[aria-modal="true"]{display:block}
      .kkr-modal header{display:flex;justify-content:space-between;align-items:center;
                        padding:14px 16px 6px;border-bottom:1px solid rgba(255,255,255,.06)}
      .kkr-modal h3{margin:0;font-size:18px}
      .kkr-modal .close{background:none;border:none;color:#e5e7eb;font-size:22px;cursor:pointer}
      .kkr-modal .body{padding:12px 16px}
      .kkr-field{display:flex;flex-direction:column;gap:6px;margin:10px 0}
      .kkr-field input{padding:.6rem .7rem;border:1px solid #334155;background:#0b1223;color:#e5e7eb;border-radius:.5rem}
      .kkr-actions{display:flex;gap:8px;justify-content:flex-end;padding:0 16px 16px}
      .kkr-secondary{background:#e5e7eb;color:#111827;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .9rem;cursor:pointer}
      #inviteMsg{min-height:1.2em;margin:6px 16px 12px;color:#94a3b8}
    `;
    document.head.appendChild(css);
  }

  // Container para o botão, com folga da lateral
  const mount = document.querySelector('#toolbar') ||
                document.querySelector('main') ||
                document.querySelector('#content') || document.body;

  // Remove botões antigos
  document.querySelectorAll('#btnInvite,[data-action="invite-open"]').forEach(b => b.remove());

  // Cria wrap e botão verde
  let wrap = document.querySelector('.kkr-invite-wrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.className='kkr-invite-wrap'; mount.prepend(wrap); }
  const btn = document.createElement('button');
  btn.id='btnInvite'; btn.type='button';
  btn.className='kkr-invite-btn btn-success';
  btn.textContent='Enviar convite';
  wrap.appendChild(btn);

  // Pega/Cria modal/backdrop
  let backdrop = document.getElementById('kkrInviteBackdrop');
  let modal    = document.getElementById('kkrInviteModal');

  function buildModal(){
    const bd = document.createElement('div');
    bd.id='kkrInviteBackdrop'; bd.className='kkr-modal-backdrop'; bd.setAttribute('aria-hidden','true');
    const m  = document.createElement('div');
    m.id='kkrInviteModal'; m.className='kkr-modal'; m.setAttribute('role','dialog');
    m.innerHTML = `
      <header><h3 id="kkrInviteTitle">Enviar convite</h3>
        <button class="close" type="button" aria-label="Fechar">×</button></header>
      <div class="body">
        <p style="margin:.2rem 0 .6rem;color:#9ca3af">Preencha os dados básicos; o aluno recebe o link para completar o cadastro.</p>
        <div class="kkr-field"><label for="inviteName">Nome*</label>
          <input id="inviteName" type="text" placeholder="Nome do aluno"></div>
        <div class="kkr-field"><label for="inviteEmail">E-mail*</label>
          <input id="inviteEmail" type="email" placeholder="email@exemplo.com"></div>
        <div class="kkr-field"><label for="invitePhone">Telefone</label>
          <input id="invitePhone" type="tel" placeholder="(DDD) 99999-9999"></div>
        <div class="kkr-field"><label for="inviteWa">WhatsApp/Telegram (opcional)</label>
          <input id="inviteWa" type="text" placeholder="WhatsApp/Telegram (opcional)"></div>
        <div class="kkr-field"><label for="inviteObs">Observações</label>
          <input id="inviteObs" type="text" placeholder="Observações (opcional)"></div>
      </div>
      <div id="inviteMsg"></div>
      <div class="kkr-actions">
        <button type="button" class="kkr-secondary" id="inviteCancel">Cancelar</button>
        <button type="button" class="kkr-invite-btn btn-success" id="inviteSend">Gerar link + enviar</button>
      </div>`;
    document.body.appendChild(bd); document.body.appendChild(m);
    return {bd, m};
  }

  if(!backdrop || !modal){
    const built = buildModal();
    backdrop = built.bd; modal=built.m;
  }

  // ===== Controle explícito de abrir/fechar (garante FECHADO no load) =====
  function openModal(){
    backdrop.setAttribute('aria-hidden','false');
    modal.setAttribute('aria-modal','true');
    document.body.classList.add('kkr-modal-open');
  }
  function closeModal(){
    backdrop.setAttribute('aria-hidden','true');
    modal.removeAttribute('aria-modal');
    document.body.classList.remove('kkr-modal-open');
  }

  // FECHA no carregamento (mesmo se algum script antigo tiver marcado aberto)
  closeModal();

  // Só abre ao clicar no botão
  btn.addEventListener('click', openModal);

  // Fechamentos
  const btnX = modal.querySelector('.close');
  const btnCancel = modal.querySelector('#inviteCancel');
  if(btnX) btnX.addEventListener('click', closeModal);
  if(btnCancel) btnCancel.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (ev)=>{ if(ev.target===backdrop) closeModal(); });
  document.addEventListener('keydown', (ev)=>{ if(ev.key==='Escape') closeModal(); });

  // Envio (gera link localmente por enquanto)
  const btnSend = modal.querySelector('#inviteSend');
  const nameEl  = modal.querySelector('#inviteName');
  const emailEl = modal.querySelector('#inviteEmail');
  const phoneEl = modal.querySelector('#invitePhone');
  const waEl    = modal.querySelector('#inviteWa');
  const obsEl   = modal.querySelector('#inviteObs');
  const msgEl   = modal.querySelector('#inviteMsg');
  function setMsg(t, ok){ msgEl.textContent=t||''; msgEl.style.color = ok ? '#16a34a' : '#fca5a5'; }

  btnSend.addEventListener('click', ()=>{
    const email = (emailEl.value||'').trim();
    const nome  = (nameEl.value||'').trim();
    if(!nome){ setMsg('Informe o nome.', false); return; }
    if(!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)){ setMsg('Informe um e-mail válido.', false); return; }

    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const qs = new URLSearchParams({
      token,
      email,
      nome,
      phone: (phoneEl.value||'').trim(),
      wa: (waEl.value||'').trim(),
      obs: (obsEl.value||'').trim()
    });
    const link = location.origin + '/cadastro.html?' + qs.toString();
    setMsg('Link gerado: ' + link, true);
  });

  // NÃO autoabrir. Só se a URL contiver ?openInvite=1 (opção para testes)
  const params = new URLSearchParams(location.search);
  if (params.get('openInvite') === '1') openModal(); else closeModal();
})();
