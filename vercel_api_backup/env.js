module.exports = async function handler(req, res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.status(200).json({
    ok:true,
    node: process.version,
    region: process.env.VERCEL_REGION || null,
    env: {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      DATABASE_URL: !!process.env.DATABASE_URL
    }
  });
}
