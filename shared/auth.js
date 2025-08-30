// ===== Auth simples (localStorage) =====
(function () {
    'use strict';

    // --- Constantes de rota (ajuste se quiser ir direto p/ cadastro) ---
    const ROUTE_AFTER_LOGIN = '/user/index.html';
    const ROUTE_AFTER_REGISTER = '/user/index.html';
    const ROUTE_REQUIRE_LOGIN_REDIRECT = '/user/login.html';

    // --- Chaves ---
    const USERS_KEY   = 'kokoro_users';
    const SESSION_KEY = 'kokoro_session';

    // --- Storage helpers ---
    function loadUsers() {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
        catch { return []; }
    }
    function saveUsers(arr) {
        localStorage.setItem(USERS_KEY, JSON.stringify(arr || []));
    }
    function setSession(obj) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(obj || null));
    }
    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
        catch { return null; }
    }
    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    // --- UI por sessão no topo ---
    function applySessionUI() {
        const sess = getSession();
        const isLogged = !!sess;

        const loginBtn      = document.getElementById('loginBtn');
        const registerBtn   = document.getElementById('registerBtn');
        const logoutBtn     = document.getElementById('btnLogout');
        const sessionNameEl = document.getElementById('sessionName');

        if (sessionNameEl) {
            sessionNameEl.textContent = isLogged ? `Olá, ${sess.nome || sess.email || ''}` : '';
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

    // --- Cadastro ---
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
            if (users.some(u => (u.email || '').toLowerCase() === email)) {
                alert('Já existe uma conta com este e-mail.');
                return;
            }

            const novo = { id: Date.now(), nome, email, senha, createdAt: new Date().toISOString() };
            users.push(novo);
            saveUsers(users);

            setSession({ id: novo.id, email: novo.email, nome: novo.nome || novo.email.split('@')[0] });
            alert('Cadastro concluído!');
            window.location.href = ROUTE_AFTER_REGISTER;
        });
    }

    // --- Login ---
    function bindLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (document.getElementById('email')?.value    || '').trim().toLowerCase();
            const senha = (document.getElementById('password')?.value || '');

            const users = loadUsers();
            const found = users.find(u => (u.email || '').toLowerCase() === email && u.senha === senha);
            if (!found) { alert('E-mail ou senha inválidos.'); return; }

            setSession({ id: found.id, email: found.email, nome: found.nome || found.email.split('@')[0] });
            alert('Login OK!');
            window.location.href = ROUTE_AFTER_LOGIN;
        });
    }

    // --- Proteção de páginas do /user ---
    function requireLogin(redirectTo = ROUTE_REQUIRE_LOGIN_REDIRECT) {
        if (!getSession()) window.location.href = redirectTo;
    }

    // Exponho utilidades que você já usava em outros arquivos
    window.Auth = {
        loadUsers, saveUsers,
        getSession, setSession, clearSession,
        applySessionUI, requireLogin
    };

    // Boot
    document.addEventListener('DOMContentLoaded', () => {
        applySessionUI();
        bindRegister();
        bindLogin();
    });
})();
