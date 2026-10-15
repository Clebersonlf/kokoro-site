export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  return res.status(404).json({
    ok: false,
    error: 'Rota desativada'
  });
}
