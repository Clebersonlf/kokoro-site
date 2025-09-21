#!/usr/bin/env bash
set -euo pipefail

FILE="admin/index.html"
[[ -f "$FILE" ]] || { echo "ERRO: $FILE não encontrado"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
BKP="${FILE}.bak.${TS}"
cp -v "$FILE" "$BKP"

UNDO="UNDO_fix_admin_header_logout_${TS}.sh"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ -f "$BKP" ]]; then
  cp -v "$BKP" "$FILE"
  echo "Restaurei: $FILE ← $BKP"
else
  echo "Backup não encontrado: $BKP"
fi
EOF
chmod +x "$UNDO"

# 1) Substitui TODO o <header> por um único header com [Sair] e [Ver site]
perl -0777 -pe 's|<header>.*?</header>|<header>
  <h1>Admin • Kokoro</h1>
  <nav style="display:flex;gap:10px">
    <button class="btn-nav" id="btn-logout">Sair</button>
    <a class="btn-nav" id="btn-home" href="/" target="_blank" rel="noopener">Ver site ↗️</a>
  </nav>
</header>|s' "$FILE" > "$FILE.tmp1"

# 2) Remove scripts antigos que mexem em btn-logout/btn-home (evita duplicidade)
perl -0777 -pe 's|<script>[^<]*(btn-logout|btn-home)[\s\S]*?</script>||g' "$FILE.tmp1" > "$FILE.tmp2"

# 3) Injeta nosso script de logout seguro antes de </body>
perl -0777 -pe 's|</body>|<script>
document.addEventListener("DOMContentLoaded", () => {
  function hardLogout(nextHref){
    try { localStorage.removeItem("adminSecret"); } catch(_) {}
    try { sessionStorage.clear(); } catch(_) {}
    try {
      document.cookie = "kokoro_admin=; Max-Age=0; path=/";
      document.cookie = "admin_session=; Max-Age=0; path=/";
    } catch(_) {}
    window.location.href = nextHref || "/admin/login.html";
  }

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) btnLogout.addEventListener("click", (e)=>{
    e.preventDefault(); hardLogout("/admin/login.html");
  });

  const btnHome = document.getElementById("btn-home");
  if (btnHome) btnHome.addEventListener("click", (e)=>{
    e.preventDefault(); hardLogout("/"); // troque por: window.location.href="/" para NÃO deslogar no "Ver site"
  });
});
</script>
</body>|' "$FILE.tmp2" > "$FILE.tmp3"

mv -v "$FILE.tmp3" "$FILE"
rm -f "$FILE.tmp1" "$FILE.tmp2"

echo "OK! Backup em: $BKP"
echo "Para desfazer: ./$UNDO"
