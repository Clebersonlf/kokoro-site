const { sql } = require('../_lib/db.js');

function send(res, code, obj) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(code).json(obj);
}

module.exports = async function handler(req, res) {
  try {
    const { rows } = await sql`
      SELECT
        id,
        nome,
        email,
        telefone,
        COALESCE(cad_numero, numero_vitalicio) AS cad_numero,
        criado_em AS created_at
      FROM alunos
      ORDER BY criado_em DESC
      LIMIT 200;
    `;
    return send(res, 200, rows);
  } catch (e) {
    return send(res, 500, { ok: false, error: String(e) });
  }
};
