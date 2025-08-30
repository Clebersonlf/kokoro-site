/**
 * kokoro_diag.mjs — Varredura e diagnóstico de projeto Vercel/Node
 * Uso:
 *    node kokoro_diag.mjs > diag-out.txt
 *
 * O que faz:
 *  - Lista e checa JSONs (package.json, vercel.json, etc.)
 *  - Checa .vercelignore (não pode ignorar "api/")
 *  - Varre api/** e detecta:
 *      • ESM x CJS x extensão (.js/.mjs)
 *      • "sqlselect" (erro comum por falta de crase)
 *      • uso de @neondatabase/serverless sem sql`...`
 *  - (Opcional) Testa DB com @neondatabase/serverless se tiver DATABASE_URL
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".git", ".vercel", ".next", "dist", "build", ".idea", ".vscode"]);

const out = [];
function log(section, obj){ out.push({ section, ...obj }); }

// util
function* walk(dir){
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory()) {
      if (IGNORE_DIRS.has(name.name)) continue;
      yield* walk(path.join(dir, name.name));
    } else {
      yield path.join(dir, name.name);
    }
  }
}
function readSafe(p){
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

// 0) Cabeçalho
log("env", {
  cwd: ROOT,
  node: process.version,
  platform: `${os.type()} ${os.release()} (${os.arch()})`,
  time: new Date().toISOString()
});

// 1) JSONs da raiz
const rootFiles = fs.readdirSync(ROOT).filter(f => f.endsWith(".json"));
const jsonFindings = [];
for (const jf of rootFiles) {
  const p = path.join(ROOT, jf);
  const txt = readSafe(p);
  if (txt == null){ jsonFindings.push({ file: jf, ok:false, reason:"unreadable" }); continue; }
  try {
    JSON.parse(txt);
    jsonFindings.push({ file: jf, ok:true });
  } catch(e){
    jsonFindings.push({ file: jf, ok:false, reason:"json-parse-error", message: e.message });
  }
}
log("json", { files: jsonFindings });

// 2) .vercelignore não pode bloquear api/
let vercelIgnore = readSafe(path.join(ROOT, ".vercelignore"));
let ignoreWarn = null;
if (vercelIgnore){
  const lines = vercelIgnore.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const matches = lines.filter(l =>
    /^api\/?$/.test(l) ||
    l.includes("api/") ||
    l.includes("/api") ||
    l === "api" ||
    l === "**/api/**"
  );
  if (matches.length){
    ignoreWarn = { problem: ".vercelignore contém entradas que podem bloquear /api", lines: matches };
  }
}
log("vercelignore", { found: !!vercelIgnore, warning: ignoreWarn });

// 3) Lê package.json pra detectar "type" e deps
let pkg = {};
let pkgWarns = [];
try { pkg = JSON.parse(readSafe(path.join(ROOT,"package.json")) || "{}"); } catch {}
const type = pkg.type || "cjs(default)";
const deps = { ...(pkg.dependencies||{}), ...(pkg.devDependencies||{}) };
log("package", { type, deps });

// 4) Varre API
const apiDir = path.join(ROOT, "api");
const apiFindings = [];
if (!fs.existsSync(apiDir)){
  apiFindings.push({ file:"(sem api/)", error:"pasta api/ não existe" });
} else {
  for (const f of walk(apiDir)){
    if (!/\.(js|mjs|ts)$/.test(f)) continue;
    const code = readSafe(f) || "";
    const ext  = path.extname(f).toLowerCase();

    const usesExportDefault = /\bexport\s+default\b/.test(code);
    const usesModuleExports = /\bmodule\.exports\b/.test(code) || /\bexports\s*=/.test(code);
    const usesRequire       = /\brequire\s*\(/.test(code);
    const usesImport        = /\bimport\s+.*from\b/.test(code);

    // erros clássicos com Neon
    const hasSqlSelectTypo  = /\bsqlselect\b/.test(code);
    const importsNeon       = /['"]@neondatabase\/serverless['"]/.test(code);
    const hasSqlTemplate    = /sql`[^`]*`/s.test(code);

    const style = usesExportDefault || usesImport ? "esm" :
                  usesModuleExports || usesRequire ? "cjs" : "unknown";

    const styleIssues = [];

    // Mismatch: projeto ESM mas arquivo CJS .js
    if (type === "module" && ext === ".js" && style === "cjs"){
      styleIssues.push("Arquivo .js CJS em projeto ESM (type=module). Troque para export default OU renomeie para .cjs.");
    }
    // Mismatch: projeto CJS mas arquivo ESM .js
    if (type !== "module" && ext === ".js" && style === "esm"){
      styleIssues.push("Arquivo .js com 'export default' em projeto CJS. Troque para module.exports OU renomeie para .mjs.");
    }
    // Mistura suspeita
    if (usesExportDefault && usesModuleExports){
      styleIssues.push("Mistura ESM e CJS no mesmo arquivo.");
    }

    const neonIssues = [];
    if (importsNeon && !hasSqlTemplate){
      neonIssues.push("Importa @neondatabase/serverless mas não encontrei uso de sql`...` (pode estar chamando errado).");
    }
    if (hasSqlSelectTypo){
      neonIssues.push("Possível erro: encontrado 'sqlselect' (faltam crases: use sql`SELECT ...`).");
    }

    apiFindings.push({
      file: path.relative(ROOT, f),
      ext, style,
      flags: { usesExportDefault, usesModuleExports, usesRequire, usesImport, importsNeon, hasSqlTemplate, hasSqlSelectTypo },
      issues: [...styleIssues, ...neonIssues]
    });
  }
}
log("api", { findings: apiFindings });

// 5) (Opcional) Teste local de DB se houver DATABASE_URL
function getLocalEnvDB(){
  const envs = ["DATABASE_URL","NEON_DATABASE_URL","POSTGRES_URL","POSTGRES_PRISMA_URL","POSTGRES_URL_NON_POOLING"];
  for (const k of envs) if (process.env[k]) return { key:k, url:process.env[k] };

  // tenta ler .env/.env.local
  const candidates = [".env.local",".env"];
  for (const fn of candidates){
    const p = path.join(ROOT, fn);
    if (!fs.existsSync(p)) continue;
    try {
      const txt = fs.readFileSync(p,"utf8");
      for (const k of envs){
        const m = txt.match(new RegExp(`^\\s*${k}\\s*=\\s*(.+)\\s*$`, "mi"));
        if (m) return { key:k, url: m[1].trim().replace(/^['"]|['"]$/g,""), file: fn };
      }
    } catch {}
  }
  return null;
}

const dbInfo = getLocalEnvDB();
let dbTest = { attempted:false };
if (dbInfo && dbInfo.url) {
  dbTest.attempted = true;
  dbTest.source = dbInfo.file ? `${dbInfo.key} (from ${dbInfo.file})` : `${dbInfo.key} (process.env)`;

  try {
    const neonMod = await import("@neondatabase/serverless");
    const neon = neonMod.neon || neonMod.default?.neon || neonMod.default;
    const neonConfig = neonMod.neonConfig || neonMod.default?.neonConfig || {};

    // wrapper fetch com timeout de 10s
    const fetchWithTimeout = async (url, opts={})=>{
      const ac = new AbortController();
      const id = setTimeout(()=>ac.abort("timeout"), 10_000);
      try { return await fetch(url, { ...opts, signal: ac.signal }); }
      finally { clearTimeout(id); }
    };
    if (neonConfig) {
      neonConfig.fetchFunction = fetchWithTimeout;
      neonConfig.fetchConnectionCache = true;
      neonConfig.poolQueryViaFetch   = true;
    }

    const sql = neon(dbInfo.url);
    const ping = await sql`select 1 as ok`;
    dbTest.ok = true;
    dbTest.ping = ping?.[0] ?? null;
  } catch(e){
    dbTest.ok = false;
    dbTest.error = {
      name: e?.name || null,
      message: e?.message || String(e),
      stack: (e?.stack||"").split("\n").slice(0,5).join("\n")
    };
  }
} else {
  dbTest.note = "Nenhuma DATABASE_URL encontrada em env/.env/.env.local (pulando teste local).";
}
log("db_local_test", dbTest);

// 6) Tenta listar variáveis do projeto via vercel env ls (se logado)
try {
  const r = spawnSync("vercel", ["env", "ls", "--json"], { encoding:"utf8" });
  if (r.error) throw r.error;
  const txt = (r.stdout||"").trim();
  let js; try { js = JSON.parse(txt); } catch { js = null; }
  if (js) log("vercel_env_ls", { ok:true, count:(js.envs||js.length||0) });
  else log("vercel_env_ls", { ok:false, message: (r.stderr||"").trim() || "sem JSON/sem login" });
} catch(e){
  log("vercel_env_ls", { ok:false, message: e.message });
}

// 7) Saída
const summary = {
  errors: [],
  warnings: []
};

// sumariza problemas
for (const j of jsonFindings) if (!j.ok) summary.errors.push(`JSON inválido: ${j.file} -> ${j.reason}`);
if (ignoreWarn) summary.errors.push(".vercelignore pode estar bloqueando a pasta api/.");
for (const a of apiFindings) {
  for (const i of (a.issues||[])) {
    if (i.includes("sqlselect") || i.includes("CJS") || i.includes("ESM")) summary.errors.push(`${a.file}: ${i}`);
    else summary.warnings.push(`${a.file}: ${i}`);
  }
}
if (dbTest.attempted && dbTest.ok === false) summary.errors.push(`Teste local de DB falhou: ${dbTest.error?.message}`);

console.log("==== KOKORO DIAG REPORT ====");
console.log(JSON.stringify({ summary, details: out }, null, 2));
console.log("\nLegendas:");
console.log("- errors: precisa corrigir");
console.log("- warnings: atenção/sugestão");
console.log("\nEnvie esse arquivo (diag-out.txt) aqui no chat.");
