(function(){
  function isLogged(){
    try{
      const t = localStorage.getItem('kokoro_admin_token');
      return !!t;
    }catch(_){ return false; }
  }

  // Se a página exigir auth, verifique e redirecione ao / (ou /admin/index.html conforme seu fluxo)
  // Use data-attr: <body data-admin-guard="1">
  const body = document.body;
  const needsAuth = body && body.getAttribute('data-admin-guard') === '1';

  if(needsAuth && !isLogged()){
    // volta pra home (onde fica o login embutido)
    location.href = '/';
  }
})();
