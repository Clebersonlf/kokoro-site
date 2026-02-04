/**
 * Guardião do Admin (sessão e logout)
 * - Usa sessionStorage (sessão por aba).
 * - Exige ADMIN_AUTH=1 para acessar páginas /admin.
 * - Expõe funções window.adminLogin(secret) e window.adminLogout().
 * - Centraliza leitura/gravação do Admin Secret (chave: kokoro_admin_secret).
 */
(function(){
  const KEY_AUTH   = "ADMIN_AUTH";
  const KEY_SECRET = "kokoro_admin_secret";

  function isAdminPath() {
    return location.pathname.startsWith("/admin/");
  }

  function isAuthed() {
    return sessionStorage.getItem(KEY_AUTH) === "1";
  }

  function setSecret(secret) {
    // guarda apenas em sessionStorage (não persiste após fechar a aba)
    if (secret) sessionStorage.setItem(KEY_SECRET, secret);
  }

  function getSecret() {
    // retrocompat: se alguém preencheu em localStorage, migra pra sessionStorage e apaga
    const ses = sessionStorage.getItem(KEY_SECRET);
    if (ses) return ses;
    const legacy = localStorage.getItem(KEY_SECRET) || localStorage.getItem("kkr_admin_secret");
    if (legacy) {
      sessionStorage.setItem(KEY_SECRET, legacy);
      localStorage.removeItem(KEY_SECRET);
      localStorage.removeItem("kkr_admin_secret");
      return legacy;
    }
    return "";
  }

  function adminLogin(secret){
    if (!secret) return false;
    setSecret(secret);
    sessionStorage.setItem(KEY_AUTH, "1");
    return true;
  }

  function adminLogout(){
    try {
      sessionStorage.removeItem(KEY_AUTH);
      sessionStorage.removeItem(KEY_SECRET);
      // por garantia, limpa qualquer resquício legado
      localStorage.removeItem(KEY_SECRET);
      localStorage.removeItem("kkr_admin_secret");
    } catch(_) {}
    // volta para a home pública
    location.href = "/";
  }

  // Expor no window
  window.adminLogin  = adminLogin;
  window.adminLogout = adminLogout;
  window.getAdminSecret = getSecret;

  // Proteção das páginas admin: se não estiver autenticado, manda para /admin/login.html
  if (isAdminPath() && !isAuthed() && !location.pathname.endsWith("/admin/login.html")) {
    location.replace("/admin/login.html");
  }

  // Bônus de segurança: se cair numa página PÚBLICA, limpamos qualquer sessão admin ativa
  if (!isAdminPath()) {
    sessionStorage.removeItem(KEY_AUTH);
    sessionStorage.removeItem(KEY_SECRET);
  }
})();
