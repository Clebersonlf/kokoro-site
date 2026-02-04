export default async function handler(req, res) {
  const started = Date.now();
  try {
    // Aceita apenas POST
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok:false, step:'method', message:'Use POST' });
    }

    // Lê JSON do corpo de forma compatível com Node (sem framework)
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

    const email = (body.email || '').trim().toLowerCase();
    const senha = body.senha || '';

    if (!email || !senha) {
      return res.status(400).json({ ok:false, step:'input', message:'Informe email e senha' });
    }

    // URL do banco (já configurada na Vercel como DATABASE_URL)
    const url =
      process.env.DATABASE_URL ||
      process.env.NEON_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING || '';

    if (!url) {
      return res.status(500).json({ ok:false, step:'env', message:'DATABASE_URL ausente' });
    }

    // Neon + fetch com timeout p/ evitar travas
    const mod = await import('@neondatabase/serverless');
    const neon = mod.neon || mod.default?.neon || mod.default;
    const neonConfig = mod.neonConfig || mod.default?.neonConfig || {};
    const fetchWithTimeout = async (u, opts = {}) => {
      const ac = new AbortController();
      const id = setTimeout(() => ac.abort('timeout'), 10_000);
      try { return await fetch(u, { ...opts, signal: ac.signal }); }
      finally { clearTimeout(id); }
    };
    if (neonConfig) {
      neonConfig.fetchFunction = fetchWithTimeout;
      neonConfig.poolQueryViaFetch = true;
    }

    const sql = neon(url);

    // Busca usuário pelo email (tentamos trazer possíveis nomes de coluna de hash)
    const rows = await sql`
      select id, nome, email, role,
             senha_hash, password_hash, senha, hash
      from public.usuarios
      where lower(email) = ${email}
      limit 1
    `;

    const user = rows?.[0];
    if (!user) {
      // não revela se email existe
      return res.status(401).json({ ok:false, step:'auth', message:'Credenciais inválidas' });
    }

    // Descobre qual campo contém o hash
    const hashField =
      user.senha_hash || user.password_hash || user.hash || user.senha || null;

    if (!hashField || typeof hashField !== 'string') {
      return res.status(500).json({ ok:false, step:'hash', message:'Usuário sem hash de senha configurado' });
    }

    // Compara com bcrypt
    const { compare } = await import('bcryptjs');
    const ok = await compare(senha, hashField);
    if (!ok) {
      return res.status(401).json({ ok:false, step:'auth', message:'Credenciais inválidas' });
    }

    // Sucesso — devolve dados essenciais (sem o hash!)
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({
      ok: true,
      step: 'login-ok',
      elapsed_ms: Date.now() - started,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
      }
    });

  } catch (e) {
    return res.status(500).json({
      ok:false, step:'catch',
      elapsed_ms: Date.now() - started,
      message: e?.message ?? String(e)
    });
  }
}
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok:false, message:'Use POST' });
    }

    // Lê JSON do corpo (Node puro)
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

    const email = (body.email || '').trim().toLowerCase();
    const senha = body.senha || '';

    if (!email || !senha) {
      return res.status(400).json({ ok:false, message:'Informe email e senha' });
    }

    // ADMIN fixo (para destravar agora)
    if (email === 'planckkokoro@gmail.com' && senha === 'Semprekokoro@#$') {
      return res.status(200).json({
        ok: true,
        user: { id:'admin', email, nome:'Administrador', role:'admin' }
      });
    }

    return res.status(401).json({ ok:false, message:'Credenciais inválidas' });
  } catch (e) {
    return res.status(500).json({ ok:false, message:'Erro interno', detail: String(e?.message || e) });
  }
}
