#!/usr/bin/env bash
set -euo pipefail

# ============ Config ============
ROOT="${1:-.}"
OUTDIR="$ROOT/_audit_kokoro"
mkdir -p "$OUTDIR"

green(){ printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }
section(){ echo -e "\n=== $1 ===" | tee -a "$OUTDIR/summary.md"; }

# ============ 0) Ambiente / dependências ============
section "Ambiente (package.json)"
PKG="$ROOT/package.json"
if [ -f "$PKG" ]; then
  node -e '
    try {
      const p = require(process.argv[1]);
      const deps = {...(p.dependencies||{}), ...(p.devDependencies||{})};
      const pick = k=>deps[k]||"—";
      const info = {
        name: p.name||"—", version: p.version||"—",
        next: pick("next"), react: pick("react"), "react-dom": pick("react-dom"),
        typescript: pick("typescript"), tailwind: pick("tailwindcss")
      };
      console.log(JSON.stringify(info,null,2));
    } catch(e){ console.log("! erro lendo package.json:", String(e)); }
  ' "$PKG" | tee "$OUTDIR/package_info.json" >/dev/null
else
  echo "! package.json NÃO encontrado" | tee -a "$OUTDIR/summary.md"
fi

# ============ 1) Mapa de rotas (páginas + app) ============
section "Rotas (páginas e app router)"
{
  echo "# Páginas (/pages) -> rotas"
  if [ -d "$ROOT/pages" ]; then
    find "$ROOT/pages" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
    | sed "s|$ROOT||" \
    | sed -E 's|/index\.(t|j)sx?$|/|; s|\.(t|j)sx?$||' \
    | sed 's|^/pages||' | sort
  else
    echo "(sem pasta /pages)"
  fi
  echo
  echo "# App Router (/app) -> rotas e handlers"
  if [ -d "$ROOT/app" ]; then
    find "$ROOT/app" -type f \( -name "page.*" -o -name "route.*" -o -name "layout.*" \) \
    | sed "s|$ROOT||" | sort
  else
    echo "(sem pasta /app)"
  fi
} | tee "$OUTDIR/routes.txt" >/dev/null

# ============ 2) Endpoints de API ============
section "Endpoints de API"
{
  echo "# Todos"
  find "$ROOT/api" -type f \( -name "*.js" -o -name "*.ts" \) 2>/dev/null | sed "s|$ROOT||" | sort || true
  echo
  echo "# Foco em /api/financeiro"
  if [ -d "$ROOT/api/financeiro" ]; then
    nl -ba "$ROOT/api/financeiro"/*.js 2>/dev/null | sed -n '1,200p' >/dev/null
    find "$ROOT/api/financeiro" -maxdepth 1 -type f -name "*.js" | while read -r f; do
      rel="${f#$ROOT/}"
      echo "— $rel"
      # extrai métodos suportados e palavras-chave importantes
      grep -nE "export default|function handler|method|req\.method|recibo|payout|email|whatsapp|sms" "$f" || true
      echo
    done
  else
    echo "(sem pasta /api/financeiro)"
  fi
} | tee "$OUTDIR/api_endpoints.txt" >/dev/null

# ============ 3) Botões e links (UI) ============
section "Botões e Ações na UI"
{
  echo "# <button>, role='button', e Links com aparência de botão"
  find "$ROOT" -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" -o -name "*.html" \) \
    | grep -Ev "/node_modules/|/_audit_kokoro/" \
    | xargs -I {} sh -c "grep -HnE \"<button|role=['\\\"]button['\\\"]|class(Name)?=['\\\"][^'\\\"]*(btn|button|primary|action)[^'\\\"]*['\\\"]|onClick=|aria-label=\" {} || true" \
    | sed "s|$ROOT||" \
    > "$OUTDIR/buttons_raw.txt"
  # tenta extrair textos visíveis simples de botões
  awk -F: '
    {
      file=$1; line=$2; rest=$0;
      txt=rest;
      gsub(/.*<button[^>]*>/,"",txt); gsub(/<.button>.*/,"",txt);
      gsub(/^[ \t\r\n]+|[ \t\r\n]+$/,"",txt);
      if(length(txt)>0 && length(txt)<80){ print file ":" line " :: " txt; }
    }
  ' "$OUTDIR/buttons_raw.txt" > "$OUTDIR/buttons_clean.txt" 2>/dev/null || true
  echo "Arquivos inspecionados e possíveis rótulos em: _audit_kokoro/buttons_clean.txt"
} | tee "$OUTDIR/buttons_summary.txt" >/dev/null

# ============ 4) Financeiro (Dashboard atual) ============
section "Dashboard Financeiro (snippets)"
{
  # pega arquivos que mencionam títulos usuais
  CANDS=$(grep -RIl --line-number -E "Sistema de Controle Financeiro|Adicionar Receita|Adicionar Despesa|Histórico de Lançamentos" "$ROOT" 2>/dev/null | grep -v "_audit_kokoro" || true)
  if [ -n "$CANDS" ]; then
    for f in $CANDS; do
      echo "----- $f -----"
      nl -ba "$f" | sed -n '1,240p'
      echo
    done
  else
    echo "(nenhum arquivo menciona esses títulos padrão — talvez o dashboard esteja renderizado a partir de componentes internos)"
  fi
} | tee "$OUTDIR/finance_dashboard.txt" >/dev/null

# ============ 5) Recibos (snippets atuais) ============
section "Recibos (snippets)"
{
  for f in $(find "$ROOT/api/financeiro" -maxdepth 1 -type f -name "recibo*.js" 2>/dev/null); do
    echo "----- $f -----"
    nl -ba "$f" | sed -n '1,220p'
    echo
  done
} | tee "$OUTDIR/receipts_snippets.txt" >/dev/null

# ============ 6) Relatório final ============
section "Relatório final"
{
  echo "# Kokoro – Auditoria de Rotas, APIs e UI"
  echo
  echo "Gerado em: $(date)"
  echo
  echo "## 1. Framework e libs"
  if [ -f "$OUTDIR/package_info.json" ]; then
    jq -r 'to_entries|map("* \(.key): \(.value)")|.[]' "$OUTDIR/package_info.json" 2>/dev/null || cat "$OUTDIR/package_info.json"
  else
    echo "* (sem package_info.json)"
  fi
  echo
  echo "## 2. Rotas"
  echo "\`\`\`"
  cat "$OUTDIR/routes.txt"
  echo "\`\`\`"
  echo
  echo "## 3. Endpoints de API (com foco em financeiro)"
  echo "\`\`\`"
  cat "$OUTDIR/api_endpoints.txt"
  echo "\`\`\`"
  echo
  echo "## 4. Botões e ações detectados"
  echo "\`\`\`"
  sed -n '1,200p' "$OUTDIR/buttons_clean.txt" 2>/dev/null || echo "(sem captação de botões)"
  echo "\`\`\`"
  echo
  echo "## 5. Dashboard Financeiro – trechos"
  echo "\`\`\`"
  sed -n '1,240p' "$OUTDIR/finance_dashboard.txt"
  echo "\`\`\`"
  echo
  echo "## 6. Recibos – trechos"
  echo "\`\`\`"
  sed -n '1,240p' "$OUTDIR/receipts_snippets.txt"
  echo "\`\`\`"
} > "$OUTDIR/REPORT_FINANCE.md"

green "✔ Relatório pronto em: $OUTDIR/REPORT_FINANCE.md"
yellow "Abra no navegador/VSCode para visualizar com formatação."
