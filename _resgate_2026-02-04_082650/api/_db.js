import { sql } from '@vercel/postgres';

// Retorna client 'sql' do @vercel/postgres (usa POSTGRES_URL/DATABASE_URL do ambiente da Vercel)
export { sql };
