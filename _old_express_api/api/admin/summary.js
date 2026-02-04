export default function handler(req, res) {
  return res.status(200).json({
    ok: true,
    message: "Endpoint /api/admin/summary funcionando!",
    time: new Date().toISOString()
  });
}
