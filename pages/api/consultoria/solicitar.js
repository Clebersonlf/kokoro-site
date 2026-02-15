import { sql } from '../../api/_lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { aluno_id, consultor_id, mensagem } = req.body;

        if (!aluno_id || !consultor_id) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const result = await sql`
            INSERT INTO solicitacoes_consulta (aluno_id, consultor_id, mensagem, status)
            VALUES (${aluno_id}, ${consultor_id}, ${mensagem}, 'pendente')
            RETURNING *
        `;

        return res.status(201).json({ success: true, solicitacao: result[0] });
    } catch (error) {
        console.error('Erro ao solicitar consulta:', error);
        return res.status(500).json({ error: 'Erro ao solicitar consulta' });
    }
}
