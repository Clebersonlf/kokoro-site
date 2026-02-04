import { neon } from '@neondatabase/serverless';

function pickConn() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

const conn = pickConn();
if (!conn) {
  throw new Error('Falta string de conexão: defina POSTGRES_URL ou DATABASE_URL (ou POSTGRES_URL_NON_POOLING).');
}

// neon() retorna uma função sql que aceita template literals
const sql = neon(conn);

export { sql };

// Função auxiliar para conexão direta (se necessário)
export function getDirectClient() {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!direct) throw new Error('Falta string para conexão direta.');
  return neon(direct);
}
