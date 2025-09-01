// Admin Login – usa sessionStorage + expira o login + sem "piscar" erro
(() => {
  const API = 'https://www.planckkokoro.com/api/admin/login';

  // tenta localizar elementos do formulário (flexível)
  const form    = document.getElementById('adminLoginForm') || document.querySelector('form[data-form="admin-login"], form#adminLoginForm, form.admin-login, form');
  const emailEl = document.getElementById('email')          || document.querySelector('input[name="email"], input[type="email"]');
  const passEl  = document.getElementById('password')       || document.querySelector('input[name="password"], input[type="password"]');
  let msgEl     = document.getElementById('msg')            || document.querySelector('.login-msg');

  if (!form || !emailEl || !passEl) return;

  // cria área de mensagem se não existir
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.className = 'login-msg';
    msgEl.style.marginTop = '8px';
    msgEl.style.minHeight = '1.2em';
    form.appendChild(msgEl);
  }

  function setMsg(text, ok = false) {
    msgEl.textContent = text || '';
    msgEl.style.color = ok ? '#86efac' : '#fca5a5';
  }

  // limpa erros ao digitar
  [emailEl, passEl].forEach(el => el.addEventListener('input', () => setMsg('')));

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    sending = true;
    setMsg('Entrando...', true);

    const email = String(emailEl.value || '').trim().toLowerCase();
    const password = String(passEl.value || '').trim();

    try {
      const resp = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data && data.ok && data.token) {
        // ⚠️ Guarda o token na sessionStorage (some ao fechar a aba/janela)
        sessionStorage.setItem('kokoro_admin_token', data.token);
        sessionStorage.setItem('kokoro_admin_login_at', String(Date.now()));
        // Redireciona pro painel
        location.href = '/admin/index.html';
        return;
      }

      // falha (não deixa a tela “piscar”): mostra msg e não redireciona
      setMsg('E-mail ou senha inválidos.');
      sending = false;
    } catch (err) {
      setMsg('Falha na conexão. Tente novamente.');
      sending = false;
    }
  }, { once: true }); // garante um handler único
})();
