export default function handler(req, res) {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  res.status(200).json({
    ok: true,
    hasPostgresUrl: Boolean(url),
    sample: url ? url.slice(0, 45) + '...' : null
  });
}
