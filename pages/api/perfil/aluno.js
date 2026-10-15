import { sql } from '../_lib/db.js';
import { exigirUsuario } from '../_lib/kokoro-usuario.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false });
  }

  const usuario = await exigirUsuario(req, res, 'aluno');

  if (!usuario) return;

  try {
    const linhas = await sql`
      SELECT to_jsonb(a) AS dados
      FROM alunos a
      WHERE a.id = ${usuario.alunoId}
      LIMIT 1
    `;

    if (!linhas.length) {
      return res.status(404).json({ ok: false });
    }

    const dados = linhas[0].dados;

    const campos = [
      'id', 'nome', 'nome_completo', 'email',
      'faixa', 'graduacao', 'grau', 'foto',
      'codigo_interno', 'matricula',
      'numero_certificado', 'certificado',
      'whatsapp', 'telefone',
      'contato_emerg_nome',
      'contato_emerg_parentesco',
      'contato_emerg_telefone',
      'contato_emerg_endereco',
      'complemento', 'bairro', 'cep',
      'status', 'esporte', 'modalidade'
    ];

    const aluno = {};

    for (const campo of campos) {
      if (Object.hasOwn(dados, campo)) {
        aluno[campo] = dados[campo];
      }
    }

    aluno.nome = dados.nome_completo || dados.nome || '';

    return res.status(200).json({
      ok: true,
      aluno
    });

  } catch {
    console.error('[perfil/aluno] Falha na consulta');

    return res.status(503).json({
      ok: false,
      error: 'Consulta indisponivel'
    });
  }
}
