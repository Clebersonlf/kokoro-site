// Listener de login: tenta admin na API e, se não for, usa localStorage
(function(){
  const loginForm  = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.style.display = 'none';

    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const senha = document.getElementById('password').value;

    try {
      // 1) tenta login admin (banco)
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.ok) {
          localStorage.setItem('kokoro_session', JSON.stringify({
            id: data.user.id, email: data.user.email, nome: data.user.nome, role: data.user.role
          }));
          window.location.href = '/admin/index.html';
          return;
        }
      }

      // 2) fallback: login local (usuário comum)
      const users = JSON.parse(localStorage.getItem('kokoro_users') || '[]');
      const found = users.find(u => (u.email||'').toLowerCase() === email && u.senha === senha);
      if (found) {
        localStorage.setItem('kokoro_session', JSON.stringify({
          id: found.id, email: found.email, nome: found.nome || found.email.split('@')[0], role: 'user'
        }));
        location.reload();
        return;
      }

      // 3) erro
      if (loginError) {
        loginError.textContent = 'E-mail ou senha inválidos.';
        loginError.style.display = 'block';
      } else {
        alert('E-mail ou senha inválidos.');
      }
    } catch (err) {
      if (loginError) {
        loginError.textContent = 'Falha ao conectar. Tente novamente.';
        loginError.style.display = 'block';
      } else {
        alert('Falha ao conectar. Tente novamente.');
      }
    }
  });
})();
