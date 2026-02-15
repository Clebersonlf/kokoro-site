const USUARIOS = {
  "planckkokoro@gmail.com": {
    senha: "Semprekokoro@#$",
    tipo: "admin",
    nome: "Admin Kokoro",
    dashboard: "/admin_Dashboard.html"
  }
};

function fazerLogin(email, senha) {
  const usuario = USUARIOS[email];
  if (!usuario) return { sucesso: false, mensagem: "Usuário não encontrado" };
  if (usuario.senha !== senha) return { sucesso: false, mensagem: "Senha incorreta" };
  
  localStorage.setItem('kokoro_user', JSON.stringify({
    email: email,
    tipo: usuario.tipo,
    nome: usuario.nome,
    loginTime: new Date().getTime()
  }));
  
  window.location.href = usuario.dashboard;
  return { sucesso: true };
}

function verificarSessao() {
  const userData = localStorage.getItem('kokoro_user');
  if (!userData) return null;
  return JSON.parse(userData);
}

function fazerLogout() {
  localStorage.removeItem('kokoro_user');
  window.location.href = '/';
}

function protegerPagina(tipoRequerido) {
  const usuario = verificarSessao();
  if (!usuario) {
    alert('Você precisa fazer login.');
    window.location.href = '/login.html';
    return false;
  }
  if (tipoRequerido && usuario.tipo !== tipoRequerido) {
    alert('Acesso negado.');
    window.location.href = '/';
    return false;
  }
  return true;
}
