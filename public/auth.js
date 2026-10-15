// KOKORO-SITE: autenticacao legada desativada.
// Login administrativo utiliza API segura no servidor.

function fazerLogin() {
  window.location.replace('/admin/login.html');
  return { sucesso: true };
}

function verificarSessao() {
  return null;
}

function fazerLogout() {
  window.location.replace('/admin/login.html');
}

function protegerPagina() {
  window.location.replace('/admin/login.html');
  return false;
}

if (window.location.pathname === '/login.html') {
  window.location.replace('/admin/login.html');
}
