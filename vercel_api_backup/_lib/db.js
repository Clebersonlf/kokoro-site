import { neon } from '@neondatabase/serverless';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('A variável de ambiente POSTGRES_URL não foi encontrada.');
}

export const sql = neon(connectionString);
