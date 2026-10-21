import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false, error: 'Metodo nao permitido'
    });
  }

  const usuario = await exigirUsuario(req, res);

  if (!usuario) return;

  return res.status(200).json({
    ok: true,
    perfil: usuario.perfil,
    nome: usuario.nome,
    alunoId: usuario.alunoId,
    professorId: usuario.professorId
  });
}
