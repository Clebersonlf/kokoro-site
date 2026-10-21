import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false });
  }

  const usuario = await exigirUsuario(req, res);

  if (!usuario) return;

  return res.status(200).json({
    ok: true,
    perfil: usuario.perfil,
    id: usuario.alunoId || usuario.professorId,
    nome: usuario.nome
  });
}
