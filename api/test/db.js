import { getClient, ensureSchema } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  const client = getClient();
  await client.connect();
  try {
    await ensureSchema(client);
    const { rows } = await client.sql`SELECT now() AS agora;`;
    return res.status(200).send(JSON.stringify({ ok: true, agora: rows[0].agora }));
  } catch (e) {
    return res.status(500).send(JSON.stringify({ ok:false, error: String(e) }));
  } finally {
    await client.end();
  }
}
