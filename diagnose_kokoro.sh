#!/usr/bin/env bash
set -euo pipefail

# ============================
# Kokoro - Diagnóstico rápido
# ============================

PROJECT_ROOT="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUTDIR="_audit_kokoro/scan_${STAMP}"
mkdir -p "${OUTDIR}"

_summary () { printf "%s\n" "$*" >> "${OUTDIR}/SUMMARY.md"; }

# 0) Cabeçalho
echo "# Kokoro — Diagnóstico do Projeto (${STAMP})" > "${OUTDIR}/SUMMARY.md"
echo "_Raio-X automático do repositório (infra, forms, APIs, financeiro, graduação, timer)_" >> "${OUTDIR}/SUMMARY.md"
echo >> "${OUTDIR}/SUMMARY.md"

# 1) Ambiente
_summary "## Ambiente"
_summary "- PWD: ${PROJECT_ROOT}"
_summary "- OS: $(uname -a)"
_summary "- Node: $(command -v node >/dev/null 2>&1 && node -v || echo 'node NÃO encontrado')"
_summary "- NPM:  $(command -v npm  >/dev/null 2>&1 && npm -v  || echo 'npm NÃO encontrado')"
_summary "- Vercel CLI: $(command -v vercel >/dev/null 2>&1 && vercel --version || echo 'vercel NÃO encontrado')"
_summary ""
# 2) Git & remoto
_summary "## Git"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  _summary "- Branch atual: $(git branch --show-current)"
  _summary "- Remotos:"
  git remote -v >> "${OUTDIR}/SUMMARY.md" || true
else
  _summary "- (Repositório Git não detectado nesta pasta)"
fi
_summary ""

# 3) Timer (deve existir e só rodar no /admin)
_summary "## Timer de sessão"
if [ -f "admin/_session_timer.js" ]; then
  _summary "- Arquivo encontrado: admin/_session_timer.js"
  head -n 30 admin/_session_timer.js > "${OUTDIR}/timer_head.txt" || true
  _summary "- Primeiras linhas salvas em: ${OUTDIR}/timer_head.txt"
else
  _summary "- ❌ NÃO encontrado: admin/_session_timer.js"
fi

# onde o script está incluído
grep -R --line-number "_session_timer.js" admin 2>/dev/null | tee "${OUTDIR}/timer_includes.txt" >/dev/null || true
_summary "- Inclusões do timer em /admin salvas em: ${OUTDIR}/timer_includes.txt"
# 2) Git & remoto
_summary "## Git"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  _summary "- Branch atual: $(git branch --show-current)"
  _summary "- Remotos:"
  git remote -v >> "${OUTDIR}/SUMMARY.md" || true
else
  _summary "- (Repositório Git não detectado nesta pasta)"
fi
_summary ""

# 3) Timer (deve existir e só rodar no /admin)
_summary "## Timer de sessão"
if [ -f "admin/_session_timer.js" ]; then
  _summary "- Arquivo encontrado: admin/_session_timer.js"
  head -n 30 admin/_session_timer.js > "${OUTDIR}/timer_head.txt" || true
  _summary "- Primeiras linhas salvas em: ${OUTDIR}/timer_head.txt"
else
  _summary "- ❌ NÃO encontrado: admin/_session_timer.js"
fi

# onde o script está incluído
grep -R --line-number "_session_timer.js" admin 2>/dev/null | tee "${OUTDIR}/timer_includes.txt" >/dev/null || true
_summary "- Inclusões do timer em /admin salvas em: ${OUTDIR}/timer_includes.txt"
# confirmar que não aparece fora do /admin
grep -R --line-number "_session_timer.js" . 2>/dev/null | grep -v '^./admin/' | tee "${OUTDIR}/timer_outside_admin.txt" >/dev/null || true
if [ -s "${OUTDIR}/timer_outside_admin.txt" ]; then
  _summary "- ⚠️ Encontrado timer fora de /admin (veja ${OUTDIR}/timer_outside_admin.txt)"
else
  _summary "- OK: não há inclusões do timer fora de /admin"
fi
_summary ""

# 4) Autenticação básica (botão Sair / _auth.js)
_summary "## Autenticação"
if [ -f "admin/_auth.js" ]; then
  _summary "- admin/_auth.js existe."
else
  _summary "- ❌ admin/_auth.js NÃO encontrado."
fi
# confere se páginas internas têm o botão Sair
grep -R --line-number 'id="btn-logout"' admin 2>/dev/null | tee "${OUTDIR}/logout_buttons.txt" >/dev/null || true
_summary "- Páginas com btn-logout listadas em: ${OUTDIR}/logout_buttons.txt"
_summary ""
# 5) Cadastro (formulário público)
_summary "## Cadastro (formulário público)"
if [ -f "user/cadastro/cadastro.html" ]; then
  _summary "- user/cadastro/cadastro.html existe."
  grep -nE "<form|fetch|axios|localStorage|sessionStorage" user/cadastro/cadastro.html 2>/dev/null | tee "${OUTDIR}/cadastro_signals.txt" >/dev/null || true
  _summary "- Sinais de envio/armazenamento listados em: ${OUTDIR}/cadastro_signals.txt"
else
  _summary "- ❌ user/cadastro/cadastro.html NÃO encontrado."
fi
_summary ""

# 6) Alunos • Lista (onde você quer consultar)
_summary "## Alunos • Lista"
if [ -f "admin/cadastro/lista.html" ]; then
  _summary "- admin/cadastro/lista.html existe."
  grep -nE "fetch|axios|localStorage|sessionStorage|table|tbody" admin/cadastro/lista.html 2>/dev/null | tee "${OUTDIR}/alunos_lista_signals.txt" >/dev/null || true
  _summary "- Sinais de leitura/listagem em: ${OUTDIR}/alunos_lista_signals.txt"
else
  _summary "- ❌ admin/cadastro/lista.html NÃO encontrado."
fi
_summary ""
# 7) Financeiro
_summary "## Financeiro"
for f in admin/financeiro/financeiro.html admin/financeiro/repasses.html admin/financeiro/relatorios.html; do
  if [ -f "$f" ]; then
    _summary "- Existe: $f"
    grep -nE "Salvar|fetch|axios|localStorage|sessionStorage|table|tbody|CSV|PDF" "$f" 2>/dev/null | head -n 100 > "${OUTDIR}/$(basename "$f").signals.txt" || true
    _summary "  • Sinais: ${OUTDIR}/$(basename "$f").signals.txt"
  fi
done
_summary ""

# 8) Graduação (numeração)
_summary "## Graduação (numeração)"
for f in admin/graduacao/lista.html admin/graduacao/nova.html admin/graduacao/editar.html; do
  if [ -f "$f" ]; then
    _summary "- Existe: $f"
    grep -nE "Salvar|fetch|axios|localStorage|sessionStorage|numero|gradua" "$f" 2>/dev/null | head -n 80 > "${OUTDIR}/$(basename "$f").signals.txt" || true
    _summary "  • Sinais: ${OUTDIR}/$(basename "$f").signals.txt"
  fi
done
_summary ""

# 9) APIs (se existirem pastas /api)
_summary "## APIs no projeto"
if [ -d "api" ]; then
  (command -v tree >/dev/null 2>&1 && tree -a -I "node_modules" api || find api -maxdepth 3 -type f) > "${OUTDIR}/api_tree.txt" 2>/dev/null
  _summary "- Árvore de arquivos em: ${OUTDIR}/api_tree.txt"
  grep -R --line-number -E "export default|module\.exports|req|res|fetch" api 2>/dev/null | head -n 300 > "${OUTDIR}/api_signals.txt" || true
  _summary "- Sinais de handlers em: ${OUTDIR}/api_signals.txt"
else
  _summary "- (Sem pasta /api detectada)"
fi
_summary ""

# 10) Resumo final curto na tela e tarball
echo "========================================="
echo "Diagnóstico gerado em: ${OUTDIR}/SUMMARY.md"
echo "Arquivos auxiliares dentro de: ${OUTDIR}"
echo "Gerando pacote .tar.gz do relatório…"

TARBALL="_audit_kokoro/scan_${STAMP}.tar.gz"
tar -czf "${TARBALL}" -C "_audit_kokoro" "scan_${STAMP}"
ln -sf "scan_${STAMP}.tar.gz" "_audit_kokoro/last_scan.tar.gz"

echo "OK: ${TARBALL}"
echo "Atalho: _audit_kokoro/last_scan.tar.gz"

# Dica de criptografia opcional (não executa nada sozinho)
echo
echo "Se quiser criptografar o relatório agora:"
echo "  gpg --symmetric --cipher-algo AES256 \"${TARBALL}\""
echo "(vai pedir uma senha sua para abrir depois)"
