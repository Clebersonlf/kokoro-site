// Rebuild do botão "Enviar convite" — cria do zero e religa o modal
(function(){
  // CSS: botão verde com folga da lateral e responsivo
  var css = document.getElementById('kkrInviteRebuildCSS');
  if(!css){
    css = document.createElement('style');
    css.id = 'kkrInviteRebuildCSS';
    css.textContent = `
      .kkr-invite-wrap{display:flex;align-items:center;gap:12px;margin:12px 24px;}
      .kkr-invite-btn{padding:.5rem 1rem;border:none;border-radius:.5rem;cursor:pointer;font-weight:600;}
      .kkr-invite-btn.btn-success{background:#16a34a;color:#fff;}
      .kkr-invite-btn.btn-success:disabled{opacity:.6;cursor:not-allowed;}
      @media (max-width:768px){.kkr-invite-wrap{margin:12px}}
      .kkr-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:saturate(120%) blur(1px);display:none;z-index:1000;}
      .kkr-modal-backdrop[aria-hidden="false"]{display:block}
      .kkr-modal{position:fixed;inset:auto 0 0 0;margin:auto;top:15vh;max-width:520px;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);padding:16px;display:none;z-index:1001}
      .kkr-modal[aria-modal="true"]{display:block}
      .kkr-modal header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
      .kkr-modal .close{background:none;border:none;font-size:20px;line-height:1;cursor:pointer}
      .kkr-field{display:flex;flex-direction:column;gap:6px;margin:8px 0}
      .kkr-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
      .kkr-secondary{background:#e5e7eb;border:1px solid #d1d5db}
    `;
    document.head.appendChild(css);
  }

  // Tenta detectar content area
  var mount =
    document.querySelector('#toolbar') ||
    document.querySelector('main') ||
    document.querySelector('#content') ||
    document.body;

  // Remove botão antigo, se existir
  var old = document.querySelector('#btnInvite,[data-action="invite-open"]');
  if (old && old.parentElement) old.parentElement.removeChild(old);

  // Cria um container para posicionar com folga
  var wrap = document.querySelector('.kkr-invite-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className = 'kkr-invite-wrap';
    // insere no topo do container detectado
    mount.insertBefore(wrap, mount.firstChild);
  }

  // Cria o botão novo (verde)
  var btn = document.createElement('button');
  btn.id = 'btnInvite';
  btn.type = 'button';
  btn.className = 'kkr-invite-btn btn-success';
  btn.textContent = 'Enviar convite';
  wrap.appendChild(btn);

  // Usa o modal existente se já tiver no HTML; se não, cria um básico
  var backdrop = document.getElementById('kkrInviteBackdrop');
  var modal    = document.getElementById('kkrInviteModal');

  function buildBasicModal(){
    // Backdrop
    var bd = document.createElement('div');
    bd.id = 'kkrInviteBackdrop';
    bd.className = 'kkr-modal-backdrop';
    bd.setAttribute('aria-hidden','true');
    document.body.appendChild(bd);

    // Modal
    var m = document.createElement('div');
    m.id = 'kkrInviteModal';
    m.className = 'kkr-modal';
    m.setAttribute('role','dialog');
    m.setAttribute('aria-modal','true');
    m.innerHTML = `
      <header>
        <h3 id="kkrInviteTitle" style="margin:0;font-size:18px">Enviar convite</h3>
        <button class="close" type="button" aria-label="Fechar">&times;</button>
      </header>
      <div class="kkr-field">
        <label for="inviteEmail">E-mail</label>
        <input id="inviteEmail" type="email" placeholder="ex: pessoa@email.com" style="padding:.5rem;border:1px solid #d1d5db;border-radius:.375rem">
      </div>
      <div class="kkr-field">
        <label for="invitePhone">WhatsApp/Telegram (opcional)</label>
        <input id="invitePhone" type="tel" placeholder="ex: 11999999999" style="padding:.5rem;border:1px solid #d1d5db;border-radius:.375rem">
      </div>
      <div class="kkr-actions">
        <button type="button" class="kkr-secondary" id="inviteCancel">Cancelar</button>
        <button type="button" class="kkr-invite-btn btn-success" id="inviteSend">Gerar link + enviar</button>
      </div>
      <div id="inviteMsg" style="min-height:1.2em;margin-top:6px;color:#6b7280"></div>
    `;
    document.body.appendChild(m);
    return {bd: bd, m: m};
  }

  if(!backdrop || !modal){
    var built = buildBasicModal();
    backdrop = built.bd;
    modal    = built.m;
  }else{
    // Garante elementos essenciais dentro do modal existente
    if(!modal.querySelector('#inviteEmail')){
      var field = document.createElement('div');
      field.className = 'kkr-field';
      field.innerHTML = '<label for="inviteEmail">E-mail</label><input id="inviteEmail" type="email" placeholder="ex: pessoa@email.com" style="padding:.5rem;border:1px solid #d1d5db;border-radius:.375rem">';
      modal.appendChild(field);
    }
    if(!modal.querySelector('#invitePhone')){
      var fieldP = document.createElement('div');
      fieldP.className = 'kkr-field';
      fieldP.innerHTML = '<label for="invitePhone">WhatsApp/Telegram (opcional)</label><input id="invitePhone" type="tel" placeholder="ex: 11999999999" style="padding:.5rem;border:1px solid #d1d5db;border-radius:.375rem">';
      modal.appendChild(fieldP);
    }
    if(!modal.querySelector('#inviteSend')){
      var acts = document.createElement('div');
      acts.className = 'kkr-actions';
      acts.innerHTML = '<button type="button" class="kkr-secondary" id="inviteCancel">Cancelar</button><button type="button" class="kkr-invite-btn btn-success" id="inviteSend">Gerar link + enviar</button>';
      modal.appendChild(acts);
    }
    if(!modal.querySelector('#inviteMsg')){
      var msg = document.createElement('div');
      msg.id = 'inviteMsg';
      msg.style.minHeight = '1.2em';
      msg.style.marginTop = '6px';
      msg.style.color = '#6b7280';
      modal.appendChild(msg);
    }
    if(!modal.querySelector('.close')){
      var header = modal.querySelector('header') || modal;
      var x = document.createElement('button');
      x.className='close';
      x.type='button';
      x.setAttribute('aria-label','Fechar');
      x.textContent='×';
      if(header===modal){
        var h = document.createElement('header');
        h.style.display='flex';h.style.justifyContent='space-between';h.style.alignItems='center';h.style.marginBottom='8px';
        var t = document.createElement('h3'); t.id='kkrInviteTitle'; t.textContent='Enviar convite'; t.style.margin='0'; t.style.fontSize='18px';
        h.appendChild(t); h.appendChild(x);
        modal.insertBefore(h, modal.firstChild);
      }else{
        header.appendChild(x);
      }
    }
  }

  // Helpers abrir/fechar
  function openModal(){
    if(backdrop){ backdrop.setAttribute('aria-hidden','false'); }
    if(modal){ modal.setAttribute('aria-modal','true'); }
  }
  function closeModal(){
    if(backdrop){ backdrop.setAttribute('aria-hidden','true'); }
    if(modal){ modal.removeAttribute('aria-modal'); }
  }

  // Liga eventos
  btn.addEventListener('click', openModal);
  var btnX = modal.querySelector('.close');
  var btnCancel = modal.querySelector('#inviteCancel');
  if(btnX) btnX.addEventListener('click', closeModal);
  if(btnCancel) btnCancel.addEventListener('click', closeModal);
  if(backdrop) backdrop.addEventListener('click', function(ev){ if(ev.target===backdrop) closeModal(); });
  document.addEventListener('keydown', function(ev){ if(ev.key==='Escape') closeModal(); });

  // Envio (somente gera o link local e mostra mensagem por enquanto)
  var btnSend = modal.querySelector('#inviteSend');
  var emailEl = modal.querySelector('#inviteEmail');
  var phoneEl = modal.querySelector('#invitePhone');
  var msgEl   = modal.querySelector('#inviteMsg');

  function setMsg(t, ok){
    msgEl.textContent = t||'';
    msgEl.style.color = ok ? '#16a34a' : '#ef4444';
  }

  if(btnSend){
    btnSend.addEventListener('click', function(){
      var email = (emailEl && emailEl.value || '').trim();
      var phone = (phoneEl && phoneEl.value || '').trim();
      if(!email){
        setMsg('Informe um e-mail válido.', false);
        return;
      }
      var token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      var link = location.origin + '/cadastro.html?token=' + encodeURIComponent(token) + '&email=' + encodeURIComponent(email);
      setMsg('Link gerado: ' + link, true);
      // (próximo passo: disparar e-mail/WhatsApp de verdade pelo /api/convites/send)
    });
  }
})();
