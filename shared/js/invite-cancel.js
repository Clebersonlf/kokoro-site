/**
 * Ativa o botão "Cancelar convite" quando houver token/URL na caixinha,
 * e chama /api/convites/cancelar. Não depende do seu código atual.
 */
(function(){
  function $(id){ return document.getElementById(id); }

  function getTokenFromInput(){
    const inp = $('inviteShortLink');
    if(!inp) return '';
    const v = String(inp.value || '');
    // tenta ler token da URL: ?token=...
    const m = v.match(/[?&]token=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function refreshCancelVisibility(){
    const btn = $('invCancelInvite');
    if(!btn) return;
    const t = window.currentInviteToken || getTokenFromInput();
    if(t){ btn.style.display = 'inline-block'; }
    else { btn.style.display = 'none'; }
  }

  function wireObservers(){
    const box = $('inviteLinkBox');
    const inp = $('inviteShortLink');
    if(!box || !inp) return;

    // sempre que o valor mudar (mesmo manualmente), tenta ativar o botão
    inp.addEventListener('input', refreshCancelVisibility);

    // observa mudanças na caixinha (quando seu código preenche programaticamente)
    const mo = new MutationObserver(refreshCancelVisibility);
    mo.observe(box, { attributes:true, subtree:true, childList:true, characterData:true });

    // também checa quando clicam para gerar o link
    document.addEventListener('click', (ev)=>{
      if (ev.target && ev.target.closest && ev.target.closest('#invSend')) {
        setTimeout(refreshCancelVisibility, 120);
      }
    }, true);
  }

  async function doCancel(){
    const err = $('inviteError');
    const btn = $('invCancelInvite');
    const inp = $('inviteShortLink');
    const box = $('inviteLinkBox');

    const token = window.currentInviteToken || getTokenFromInput();
    if(!token){
      if(err){ err.textContent = 'Não há token para cancelar.'; err.style.display = 'block'; }
      return;
    }

    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = 'Cancelando...';

    try{
      const r = await fetch('/api/convites/cancelar', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ token })
      });
      const j = await r.json().catch(()=> ({}));
      if(!j.ok) throw new Error(j.error || 'Falha ao cancelar convite');

      if(inp) inp.value = '';
      if(box) box.style.display = 'none';
      btn.style.display = 'none';
      window.currentInviteToken = '';
      alert('Convite cancelado com sucesso.');
    }catch(e){
      if(err){ err.textContent = String(e.message || e); err.style.display = 'block'; }
    }finally{
      btn.disabled = false;
      btn.textContent = old;
    }
  }

  // liga quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', ()=>{
    // botão pode ter sido inserido por nós via sed/awk
    const btn = $('invCancelInvite');
    if(btn && !btn._wired){
      btn.addEventListener('click', doCancel);
      btn._wired = true;
    }
    wireObservers();
    // checa inicial (caso a página reapareça com valor)
    setTimeout(refreshCancelVisibility, 150);
  });
})();
