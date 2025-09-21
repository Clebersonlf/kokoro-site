export const config = { runtime: 'nodejs' }; // força Node, não Edge

export default function handler(req, res) {
  const val = process.env.ADMIN_SECRET || null;
  const present = Boolean(val);
  // NÃO expomos o valor; só metadados seguros
  const info = {
    ok: true,
    present,
    length: present ? String(val).length : 0,
    sample: Object.keys(process.env || {}).slice(0, 10), // só pra ver se tem envs
    node_version: process.version,
  };
  res.json(info);
}
