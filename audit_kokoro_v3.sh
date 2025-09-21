#!/usr/bin/env bash
set -euo pipefail

ROOT="."
OUTDIR="$ROOT/_audit_kokoro"
TS="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$OUTDIR"

# ==== cria botão de desfazer (só limpa os artefatos do auditor) ====
UNDO="UNDO_audit_${TS}.sh"
cat > "$UNDO" <<EOF
#!/usr/bin/env bash
set -euo pipefail
echo ">> Removendo artefatos do auditor (_audit_kokoro/)..."
rm -rf "$OUTDIR"
echo "OK: limpo."
EOF
chmod +x "$UNDO"

echo ">> UNDO criado: ./$UNDO (remove _audit_kokoro/)"

green(){ printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }
section(){ echo -e "\n=== $1 ===" | tee -a "$OUTDIR/summary.md"; }

# ===== 0) Ambiente =====
section "Ambiente (package.json)"
PKG="$ROOT/package.json"
if [ -f "$PKG" ]; then
  node -e '
    try {
      const fs = require("fs");
      const p = require(process.argv[1]);
      const deps = {...(p.dependencies||{}), ...(p.devDependencies||{})};
      const pick = k=>deps[k]||"—";
      const info = {
        name: p.name||"—", version: p.version||"—",
        next: pick("next"), react: pick("react"), "react-dom": pick("react-dom"),
        typescript: pick("typescript"), tailwind: pick("tailwindcss")
      };
      fs.writeFileSync(process.argv[2], JSON.stringify(info,null,2));
      console.log(JSON.stringify(info,null,2));
    } catch(e){ console.log("! erro lendo package.json:", String(e)); }
  ' "$PKG" "$OUTDIR/package_info.json" >/dev/null
else
  echo "(sem package.json)" | tee -a "$OUTDIR/summary.md"
fi

# ===== 1) Rotas =====
section "Rotas (pages/ e app/)"
EXCL='-path "./node_modules" -prune -o -path "./.next" -prune -o -path "./_audit_kokoro" -prune'
{
  if [ -d ./pages ]; then
    eval "find ./pages $EXCL -type f \\( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \\)" \
      | sed -E 's|^\./||; s|/index\.(t|j)sx?$|/|; s|\.(t|j)sx?$||' \
      | sed 's|^pages||' | sort
  else echo "(sem pasta pages/)"; fi

  if [ -d ./app ]; then
    eval "find ./app $EXCL -type f \\( -name 'page.*' -o -name 'route.*' -o -name 'layout.*' \\)" \
      | sed 's|^\./||' | sort
  else echo "(sem pasta app/)"; fi
} | tee "$OUTDIR/routes.txt" >/dev/null

# ===== 2) Endpoints API =====
section "Endpoints de API (foco: api/financeiro)"
if [ -d ./api/financeiro ]; then
  eval "find ./api/financeiro $EXCL -maxdepth 1 -type f -name '*.js'" | sort \
    | tee "$OUTDIR/api_financeiro_files.txt" >/dev/null
else
  echo "(sem pasta api/financeiro/)" | tee -a "$OUTDIR/summary.md"
fi

# ===== 3) Snippets dos recibos =====
section "Recibos (primeiras 200 linhas)"
for f in ./api/financeiro/recibo*.js; do
  [ -f "$f" ] || continue
  echo "----- $f -----" | tee -a "$OUTDIR/summary.md"
  nl -ba "$f" | sed -n '1,200p' | tee -a "$OUTDIR/summary.md" >/dev/null
  echo >> "$OUTDIR/summary.md"
done

echo
green "✔ Relatório pronto em: $OUTDIR/"
echo "   - Rotas:           $OUTDIR/routes.txt"
echo "   - API financeiro:  $OUTDIR/api_financeiro_files.txt"
echo "   - Snippets:        $OUTDIR/summary.md"
echo
yellow "Para desfazer (limpar artefatos do auditor): ./$UNDO"
