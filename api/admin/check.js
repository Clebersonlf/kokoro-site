export default function handler(req, res) {
  const hdr = req.headers['x-admin-secret'];
  const hasEnv = !!process.env.ADMIN_SECRET;
  const hasHdr = !!hdr;
  const match  = hasEnv && hasHdr && (hdr === process.env.ADMIN_SECRET);
  return res.json({ ok:true, hasEnv, hasHdr, match });
}
