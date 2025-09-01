// Auth guard – exige token na sessionStorage, expira por inatividade e bloqueia BFCache
(() => {
  const LOGIN_URL = '/admin/login.html';
  const TOKEN_KEY = 'kokoro_admin_token';
  const TS_KEY    = 'kokoro_admin_login_at';
  const MAX_IDLE  = 30 * 60 * 1000; // 30 minutos de inatividade

  function now(){ return Date.now(); }

  function hasValidSession() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const ts    = parseInt(sessionStorage.getItem(TS_KEY) || '0', 10);
    if (!token || !ts) return false;
    if ((now() - ts) > MAX_IDLE) return false;
    return true;
  }

  function touch() {
    if (sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TS_KEY, String(now()));
    }
  }

  function logoutToLogin() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TS_KEY);
    } catch (_) {}
    if (!location.pathname.endsWith('/admin/login.html')) {
      location.replace(LOGIN_URL);
    }
  }

  // 1) Checa no carregamento da página
  if (!hasValidSession()) {
    logoutToLogin();
    return;
  }

  // 2) Atualiza "atividade" em eventos do usuário
  ['click','keydown','mousemove','touchstart','scroll'].forEach(ev =>
    document.addEventListener(ev, touch, { passive:true })
  );

  // 3) Timer simples pra expirar se ficar parado
  setInterval(() => {
    if (!hasValidSession()) logoutToLogin();
  }, 30 * 1000); // checa a cada 30s

  // 4) Bloqueia reuso via BFCache (back/forward cache)
  window.addEventListener('pageshow', (e) => {
    // se veio do BFCache, revalida
    if (e.persisted && !hasValidSession()) {
      logoutToLogin();
    }
  });

  // 5) (Opcional) logout ao fechar/atualizar – descomente se quiser forçar logout também em refresh:
  // window.addEventListener('beforeunload', () => {
  //   sessionStorage.removeItem(TOKEN_KEY);
  //   sessionStorage.removeItem(TS_KEY);
  // });
})();
