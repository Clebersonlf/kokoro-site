(function(){
  const form  = document.querySelector('#admin-login-form') || document.querySelector('form');
  const emailEl = document.querySelector('#admin-email') || document.querySelector('input[type="email"]');
  const passEl  = document.querySelector('#admin-password') || document.querySelector('input[type="password"]');
  const msgEl   = document.querySelector('#admin-login-msg') || (function(){
    const el = document.createElement('div');
    el.id = 'admin-login-msg';
    el.style.marginTop = '8px';
    el.style.color = '#fca5a5';
    (form || document.body).appendChild(el);
    return el;
  })();

  function setMsg(t, ok=false){
    msgEl.textContent = t||'';
    msgEl.style.color = ok ? '#86efac' : '#fca5a5';
  }

  async function doLogin(e){
    e && e.preventDefault();
    setMsg('Autenticando…', true);

    const email = String((emailEl?.value||'').trim().toLowerCase());
    const password = String((passEl?.value||'').trim());

    if(!email || !password){
      setMsg('Informe e-mail e senha.');
      return;
    }

    try{
      const resp = await fetch('https://www.planckkokoro.com/api/admin/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password }),
        credentials:'omit',
        cache:'no-store'
      });

      let data = {};
      try { data = await resp.json(); } catch { /* ignore */ }

      if (resp.status === 200 && data && data.ok) {
        // Guarda token e usuário
        try {
          localStorage.setItem('kokoro_admin_token', data.token || 'admin-token');
          localStorage.setItem('kokoro_admin_user', JSON.stringify(data.user||{role:'admin',email}));
        } catch(_) {}

        setMsg('Login OK. Redirecionando…', true);

        // Vai pro painel
        const target = '/admin/index.html';
        location.href = target;
        return;
      }

      // Se a API responder 401/404/etc ou {ok:false}
      const mensagem = (data && (data.message||data.msg)) || 'E-mail ou senha inválidos.';
      setMsg(mensagem);
    }catch(err){
      setMsg('Falha de rede. Tente novamente.');
    }
  }

  if (form) form.addEventListener('submit', doLogin);
  // Permite login com Enter mesmo sem form id
  if (!form && passEl) passEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ doLogin(e); }});
})();
