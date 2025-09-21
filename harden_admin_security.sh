#!/usr/bin/env bash
set -euo pipefail

ROOT="."
ADMIN_DIR="$ROOT/admin"
AUTH_JS="$ADMIN_DIR/_auth.js"
LOGIN_HTML="$ADMIN_DIR/login.html"
UNDO="UNDO_harden_admin_$(date +%Y%m%d_%H%M%S).sh"

echo ">> Criando UNDO..."
cat > "$UNDO" <<'UNDO'
#!/usr/bin/env bash
set -euo pipefail
echo ">> Restaurando alterações de segurança do admin..."
# Remover arquivos criados
rm -f ./admin/_auth.js
rm -f ./admin/login.html
# Tentar reverter alterações de botões/links nos HTML conhecidos
for f in ./admin/index.html ./admin/financeiro/financeiro.html ./admin/financeiro/repasses.html; do
  [ -f "$f.bak_pre_harden" ] && mv -f "$f.bak_pre_harden" "$f" && echo " - restaurado: $f"
done
echo "OK."
UNDO
chmod +x "$UNDO"

echo ">> 1) Criando guardião de sessão: $AUTH_JS"
mkdir -p "$ADMIN_DIR"
cat > "$AUTH_JS" <<'JS'
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
JS

echo ">> 2) Criando tela de login: $LOGIN_HTML"
cat > "$LOGIN_HTML" <<'HTML'
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Login • Admin</title>
  <style>
    :root{
      --bg:#0f1115; --card:#141821; --bord:#233043; --txt:#e6edf3; --mut:#9fb3c8; --pri:#f77f00;
    }
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--txt);font-family:Inter,system-ui,Segoe UI,Roboto,Arial}
    .card{width:100%;max-width:380px;background:linear-gradient(180deg,var(--card),#121725);
      border:1px solid var(--bord);border-radius:16px;padding:22px;box-shadow:0 10px 24px rgba(0,0,0,.25)}
    h1{margin:0 0 12px;font-size:20px}
    label{font-size:12px;color:var(--mut)}
    input{width:100%;margin-top:6px;margin-bottom:14px;padding:10px 12px;border:1px solid #2a3a55;border-radius:10px;background:#0f172a;color:#e6edf3}
    button{width:100%;padding:12px;border:0;border-radius:10px;background:var(--pri);color:#190a00;font-weight:700;cursor:pointer}
    .mut{color:var(--mut);font-size:12px;margin-top:8px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Login do Admin</h1>
    <label>Admin Secret</label>
    <input id="secret" type="password" placeholder="cole seu x-admin-secret"/>
    <button id="btn">Entrar</button>
    <div class="mut">A sessão encerra ao fechar a aba ou ao sair do painel.</div>
  </div>
  <script src="/admin/_auth.js"></script>
  <script>
    document.getElementById('btn').addEventListener('click', ()=>{
      const s = document.getElementById('secret').value.trim();
      if(!s){ alert('Informe o Admin Secret.'); return; }
      if(window.adminLogin(s)){ location.href = "/admin/index.html"; }
    });
  </script>
</body>
</html>
HTML

# Helper: função para salvar backup e aplicar substituições específicas em um arquivo
patch_html() {
  local file="$1"
  local desc="$2"
  [ -f "$file" ] || { echo "   (ignorado) $file não existe"; return; }
  cp -n "$file" "$file.bak_pre_harden"
  echo ">> Patch: $desc — $file"

  # 2.1 – Incluir o guardião <script src="/admin/_auth.js">
  if ! grep -q '/admin/_auth.js' "$file"; then
    sed -i '0,/<\/head>/s//  <script src="\/admin\/_auth.js"><\/script>\n<\/head>/' "$file"
  fi

  # 2.2 – Remover "Voltar ao site" (se existir) e colocar botão Sair
  # Troca qualquer <a ...>Voltar ao site</a> por botões Sair + (opcional) Ver site em nova aba
  sed -i \
    -e 's#<a class="btn-nav" href="/"><span>←</span> Voltar ao site</a>##g' \
    -e 's#</header>#<nav style="display:flex;gap:10px"><button class="btn-nav" id="btn-logout">Sair<\/button><a class="btn-nav" href="\/" target="_blank" rel="noopener">Ver site ↗<\/a><\/nav>\n<\/header>#' \
    "$file"

  # 2.3 – Incluir script do botão Sair (se não existir)
  if ! grep -q 'btn-logout' "$file"; then
    sed -i 's#</body>#<script>document.addEventListener("DOMContentLoaded",function(){var b=document.getElementById("btn-logout");if(b){b.addEventListener("click",function(){window.adminLogout();});}});</script>\n</body>#' "$file"
  fi

  # 2.4 – Migrar leituras do secret: usar getAdminSecret() em vez de localStorage
  sed -i \
    -e 's/localStorage\.getItem(\x27kokoro_admin_secret\x27)/getAdminSecret()/g' \
    -e 's/localStorage\.getItem(\x27kkr_admin_secret\x27)/getAdminSecret()/g' \
    -e 's/const secret = document\.getElementById(\x27admin-secret\x27)\.value\.trim();/const secret = (window.getAdminSecret && window.getAdminSecret()) || document.getElementById(\x27admin-secret\x27)?.value?.trim() || "";/' \
    "$file"
}

echo ">> 3) Aplicando patches nas páginas do admin"
patch_html "$ADMIN_DIR/index.html"           "Dashboard Admin"
patch_html "$ADMIN_DIR/financeiro/financeiro.html" "Financeiro"
patch_html "$ADMIN_DIR/financeiro/repasses.html"   "Repasses"

echo "✔ Segurança aplicada.
- Guardião: /admin/_auth.js
- Login:    /admin/login.html
- Botão Sair incluído e 'Voltar ao site' removido no admin.
- Sessão agora usa sessionStorage e é limpa ao sair para páginas públicas.

Para desfazer: ./$UNDO
Agora faça o deploy normalmente (ex.: vercel)."
