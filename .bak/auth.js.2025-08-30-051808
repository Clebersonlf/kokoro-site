// Mantém o CAPTCHA “ok” por enquanto
let isCaptchaVerified = true;

document.addEventListener('DOMContentLoaded', () => {
  // ====== Elementos ======
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('btnLogout');
  const sessionNameEl = document.getElementById('sessionName');

  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  const registerSubmit = document.getElementById('registerSubmit');

  const pwInput   = document.getElementById('newPassword');
  const pwConfirm = document.getElementById('newPassword2');
  const pwBar   = document.getElementById('pwBar');
  const pwHint  = document.getElementById('pwHint');
  const reqLen    = document.getElementById('reqLen');
  const reqUpper  = document.getElementById('reqUpper');
  const reqLower  = document.getElementById('reqLower');
  const reqDigit  = document.getElementById('reqDigit');
  const reqSpecial= document.getElementById('reqSpecial');

  const motivacionalBox = document.getElementById('motivacional');
  const motivacionalCloseBtn = document.getElementById('motivacionalClose');

  // ====== Storage helpers ======
  const USERS_KEY = 'kokoro_users';
  const SESSION_KEY = 'kokoro_session';
  const loadUsers   = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const saveUsers   = (arr) => localStorage.setItem(USERS_KEY, JSON.stringify(arr));
  const setSession  = (obj) => localStorage.setItem(SESSION_KEY, JSON.stringify(obj));
  const getSession  = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
  const clearSession= () => localStorage.removeItem(SESSION_KEY);

  // ====== UI por sessão ======
  function updateUIBySession() {
    const sess = getSession();
    const isLogged = !!sess;
    if (sessionNameEl) sessionNameEl.textContent = isLogged ? `Olá, ${sess.nome || sess.email || ''}` : '';
    if (loginBtn)    loginBtn.style.display    = isLogged ? 'none' : 'inline-block';
    if (registerBtn) registerBtn.style.display = isLogged ? 'none' : 'inline-block';
    if (logoutBtn)   logoutBtn.style.display   = isLogged ? 'inline-block' : 'none';
  }

  // ====== Modais ======
  function openModal(m){ if(m){ m.style.display='flex'; } }
  function closeModal(m){ if(m){ m.style.display='none'; } }
  loginBtn?.addEventListener('click', ()=> openModal(loginModal));
  registerBtn?.addEventListener('click', ()=> openModal(registerModal));
  logoutBtn?.addEventListener('click', ()=> { clearSession(); updateUIBySession(); alert('Você saiu.'); });

  // ====== Login via API ======
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.style.display = 'none';
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const senha = document.getElementById('password').value;

    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await resp.json();

      if (!data.ok) {
        if (loginError) {
          loginError.textContent = data.message || 'E-mail ou senha inválidos.';
          loginError.style.display = 'block';
        } else {
          alert(data.message || 'E-mail ou senha inválidos.');
        }
        return;
      }

      setSession({ id: data.user.id, email: data.user.email, nome: data.user.nome, role: data.user.role });
      if (data.user.role === 'admin') window.location.href = '/admin/index.html';
      else window.location.href = '/user/index.html';

    } catch (err) {
      if (loginError) {
        loginError.textContent = 'Falha ao conectar. Tente novamente.';
        loginError.style.display = 'block';
      } else {
        alert('Falha ao conectar. Tente novamente.');
      }
    }
  });

  // ====== Regras da senha (cadastro) ======
  const rules = {
    len: s => s.length >= 8,
    upper: s => /[A-Z]/.test(s),
    lower: s => /[a-z]/.test(s),
    digit: s => /\d/.test(s),
    special: s => /[^A-Za-z0-9]/.test(s)
  };
  function setReq(el, ok){
    if(!el) return;
    const icon = el.querySelector('i');
    if(ok){ icon.classList.remove('fa-circle-xmark','no'); icon.classList.add('fa-circle-check','ok'); }
    else  { icon.classList.remove('fa-circle-check','ok'); icon.classList.add('fa-circle-xmark','no'); }
  }
  function checkIfRegisterReady(){
    if(!pwInput || !pwConfirm || !registerSubmit) return;
    const s = pwInput.value || '';
    let passed = 0;
    if(rules.len(s)) passed++;
    if(rules.upper(s)) passed++;
    if(rules.lower(s)) passed++;
    if(rules.digit(s)) passed++;
    if(rules.special(s)) passed++;

    const pct = [0,20,40,70,90,100][passed];
    if (pwBar)   pwBar.style.width = pct + '%';
    if (pwBar)   pwBar.style.background = passed <= 2 ? '#ff5858' : (passed === 3 ? '#ffaa3b' : '#74ff9f');
    if (pwHint)  pwHint.textContent = passed <= 2 ? 'Senha fraca' : (passed === 3 ? 'Senha média' : 'Senha forte');

    setReq(reqLen, rules.len(s));
    setReq(reqUpper, rules.upper(s));
    setReq(reqLower, rules.lower(s));
    setReq(reqDigit, rules.digit(s));
    setReq(reqSpecial, rules.special(s));

    const allOk = passed >= 4 && pwInput.value.length >= 8 && pwInput.value === pwConfirm.value && isCaptchaVerified;
    registerSubmit.disabled = !allOk;
  }
  pwInput?.addEventListener('input', checkIfRegisterReady);
  pwConfirm?.addEventListener('input', checkIfRegisterReady);
  document.addEventListener('captchaStateChange', checkIfRegisterReady);

  // ====== Olhinho ======
  function togglePasswordVisibility(btn){
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if(!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    btn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  }
  document.querySelectorAll('.password-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=> togglePasswordVisibility(btn));
  });

  // ====== Caixa motivacional ======
  function handleMotivacionalBox(){
    if(!motivacionalBox || !motivacionalCloseBtn) return;
    const KEY = 'kokoro_motivacional_last_close';
    const today = new Date().toDateString();
    const last = localStorage.getItem(KEY);
    motivacionalBox.style.display = (last === today) ? 'none' : 'inline-block';
    motivacionalCloseBtn.addEventListener('click', ()=>{
      motivacionalBox.style.display = 'none';
      localStorage.setItem(KEY, today);
    });
  }

  // ====== Init ======
  updateUIBySession();
  checkIfRegisterReady();
  handleMotivacionalBox();
});
