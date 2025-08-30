// debug-login.mjs  (ESM)
// Diagnóstico completo do login (env → conexão → SELECT → bcrypt.compare)

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// --- argumentos CLI ---------------------------------------------------------
// Ex.: node debug-login.mjs --email planckkokoro@gmail.com --pass "Semprekokoro@#$"
const args = Object.fromEntries(
    process.argv.slice(2).map(p => {
        const [k, ...rest] = p.replace(/^--/, '').split('=');
        return [k, rest.join('=') || true];
    })
);

const EMAIL = args.email || 'planckkokoro@gmail.com';
const PASS  = args.pass  || 'Semprekokoro@#$';

// --- descobre qual URL de banco está disponível -----------------------------
function pickDbUrl() {
    const chosen =
        process.env.DATABASE_URL_2 ||
        process.env.DATABASE_URL ||
        process.env.NEON_DATABASE_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_URL_NON_POOLING;

    const origin =
        chosen === process.env.DATABASE_URL_2       ? 'DATABASE_URL_2' :
            chosen === process.env.DATABASE_URL         ? 'DATABASE_URL' :
                chosen === process.env.NEON_DATABASE_URL    ? 'NEON_DATABASE_URL' :
                    chosen === process.env.POSTGRES_PRISMA_URL  ? 'POSTGRES_PRISMA_URL' :
                        chosen === process.env.POSTGRES_URL         ? 'POSTGRES_URL' :
                            chosen === process.env.POSTGRES_URL_NON_POOLING ? 'POSTGRES_URL_NON_POOLING' :
                                'NENHUMA';

    return { chosen, origin };
}

function banner(title) {
    const bar = '─'.repeat(title.length + 2);
    console.log(`\n┌${bar}┐\n│ ${title} │\n└${bar}┘`);
}

function fatal(msg) {
    console.error(`\n❌ ${msg}`);
    process.exit(1);
}

(async () => {
    banner('1) Variáveis de ambiente');
    const { chosen: DB_URL, origin } = pickDbUrl();
    if (!DB_URL) {
        fatal(
            'Nenhuma URL de banco encontrada. Defina uma das variáveis: ' +
            'DATABASE_URL_2 / DATABASE_URL / NEON_DATABASE_URL / POSTGRES_* no Vercel (e redeploy).'
        );
    }
    console.log(`✅ Usando ${origin}`);
    console.log(`   Host: ${DB_URL.split('@')[1]?.split('/')[0] || '(não parseado)'}`);

    banner('2) Conexão Neon');
    try {
        const sql = neon(DB_URL);
        const meta = await sql/*sql*/`
      SELECT
        current_database() as db,
        current_user       as usuario,
        inet_server_addr() as host,
        version()          as versao
    `;
        console.log('✅ Conectado');
        console.table(meta);
    } catch (e) {
        fatal(`Falha ao conectar no Neon: ${e.message || e}`);
    }

    banner('3) Buscar usuário');
    let row;
    try {
        const sql = neon(DB_URL);
        const rows = await sql/*sql*/`
      SELECT id, email, senha_hash, role,
             LEFT(senha_hash, 4) as prefixo,
             LENGTH(senha_hash)  as tamanho
      FROM public.usuarios
      WHERE LOWER(email) = LOWER(${EMAIL})
      LIMIT 1
    `;
        if (!rows.length) fatal(`Usuário não encontrado: ${EMAIL}`);
        row = rows[0];
        console.log('✅ Usuario encontrado:');
        console.table([{
            email: row.email,
            role: row.role,
            prefixo_hash: row.prefixo,
            tam_hash: row.tamanho
        }]);

        if (!row.senha_hash || !row.senha_hash.startsWith('$2')) {
            console.warn('⚠️  O campo senha_hash NÃO parece bcrypt ($2a/$2b).');
            console.warn('    Atualize com um hash válido (veja etapa 5 abaixo).');
        } else {
            console.log('✅ Hash parece bcrypt:', row.senha_hash.slice(0, 7) + '...');
        }
    } catch (e) {
        fatal(`Erro ao buscar o usuário: ${e.message || e}`);
    }

    banner('4) Comparar senha com bcrypt');
    try {
        const ok = await bcrypt.compare(PASS, row.senha_hash || '');
        if (ok) {
            console.log('✅ SENHA CORRETA → login deve passar');
            process.exit(0);
        } else {
            console.error('❌ SENHA INCORRETA → compare falhou');
        }
    } catch (e) {
        console.error('❌ Erro no compare:', e.message || e);
    }

    banner('5) Corrigir rapidamente (colando no Neon)');
    try {
        const novoHash = await bcrypt.hash(PASS, 12); // gera um hash válido agora
        console.log('Use este SQL no Neon (SQL Editor) na MESMA BRANCH do seu DATABASE_URL:');
        const sqlUpdate = `
UPDATE public.usuarios
SET senha_hash = '${novoHash}',
    role       = 'admin'
WHERE LOWER(email) = LOWER('${EMAIL}');
    `.trim();
        console.log('\n' + sqlUpdate + '\n');
        console.log('Depois rode este SELECT para conferir:');
        console.log(`
SELECT email, LEFT(senha_hash,4) AS prefixo, LENGTH(senha_hash) AS tam, role
FROM public.usuarios
WHERE LOWER(email)=LOWER('${EMAIL}');
    `.trim());
        console.log('\n💡 Observação: $2a ou $2b são ambos aceitos pelo bcryptjs.');
    } catch (e) {
        console.error('Falhou ao gerar hash local:', e.message || e);
    }
})();
