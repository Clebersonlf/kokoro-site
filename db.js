// api/db.js
const { Pool } = require('pg');

const CONN =
    process.env.DATABASE_URL_2 ||   // <- usa a variável que você criou no Vercel
    process.env.DATABASE_URL ||     // (fallbacks, se existirem)
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;

const pool = new Pool({
    connectionString: CONN,
    ssl: { rejectUnauthorized: false },
});

module.exports = pool;