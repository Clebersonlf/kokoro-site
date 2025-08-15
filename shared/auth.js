> Cleberson:
// ===== Auth simples (localStorage) =====
    (function () {
        const USERS_KEY   = 'kokoro_users';
        const SESSION_KEY = 'kokoro_session';

        function loadUsers() {
            try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
            catch { return []; }
        }
        function saveUsers(arr) {
            localStorage.setItem(USERS_KEY, JSON.stringify(arr));
        }
        function setSession(obj) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(obj));
        }
        function getSession() {
            try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
            catch { return null; }
        }
        function clearSession() { localStorage.removeItem(SESSION_KEY); }

        function applySessionUI() {
            const sess = getSession();
            const isLogged = !!sess;

            const loginBtn      = document.getElementById('loginBtn');
            const registerBtn   = document.getElementById('registerBtn');
            const logoutBtn     = document.getElementById('btnLogout');
            const sessionNameEl = document.getElementById('sessionName');

            if (sessionNameEl) {
                sessionNameEl.textContent = isLogged ? Olá, ${sess.nome || sess.email || ''} : '';
            }
            if (loginBtn)    loginBtn.style.display    = isLogged ? 'none' : '';
            if (registerBtn) registerBtn.style.display = isLogged ? 'none' : '';
            if (logoutBtn) {
                logoutBtn.style.display = isLogged ? '' : 'none';
                logoutBtn.onclick = () => {
                    clearSession();
                    applySessionUI();
                    alert('Você saiu.');
                };
            }
        }

        function bindRegister() {
            const form = document.getElementById('registerForm');
            if (!form) return;

            const pw  = document.getElementById('newPassword');
            const pw2 = document.getElementById('newPassword2');

            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const nome   = (document.getElementById('newName')?.value  || '').trim();
                const email  = (document.getElementById('newEmail')?.value || '').trim().toLowerCase();
                const senha  = pw?.value  || '';
                const senha2 = pw2?.value || '';

                if (!email || !senha)  { alert('Preencha email e senha.'); return; }
                if (senha !== senha2)  { alert('As senhas não conferem.'); return; }

                const users = loadUsers();
                if (users.some(u => u.email === email)) {
                    alert('Já existe uma conta com este e-mail.');
                    return;
                }

                const novo = { id: Date.now(), nome, email, senha, createdAt: new Date().toISOString() };
                users.push(novo);
                saveUsers(users);

                setSession({ id: novo.id, email: novo.email, nome: novo.nome || novo.email.split('@')[0] });
                alert('Cadastro concluído!');
                window.location.href = '/user/index.html';
            });
        }

        function bindLogin() {
            const form = document.getElementById('loginForm');
            if (!form) return;

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = (document.getElementById('email')?.value    || '').trim().toLowerCase();
                const senha = (document.getElementById('password')?.value || '');

                const users = loadUsers();
                const found = users.find(u => u.email === email && u.senha === senha);
                if (!found) { alert('E-mail ou senha inválidos.'); return; }

                setSession({ id: found.id, email: found.email, nome: found.nome || found.email.split('@')[0] });
                alert('Login OK!');
                window.location.href = '/user/index.html';
            });
        }

        function requireLogin(redirectTo = '/user/login.html') {
            if (!getSession()) window.location.href = redirectTo;
        }

        window.Auth = {
            loadUsers, saveUsers,
            getSession, setSession, clearSession,
            applySessionUI, requireLogin
        };

        document.addEventListener('DOMContentLoaded', () => {
            applySessionUI();
            bindRegister();
            bindLogin();
        });
    })();
