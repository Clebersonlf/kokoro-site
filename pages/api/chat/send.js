import { sql } from '../../api/_lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { conversa_id, usuario_id, mensagem } = req.body;

        if (!conversa_id || !usuario_id || !mensagem) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Inserir mensagem
        const result = await sql`
            INSERT INTO chat_mensagens (conversa_id, usuario_id, mensagem, created_at)
            VALUES (${conversa_id}, ${usuario_id}, ${mensagem}, NOW())
            RETURNING id, conversa_id, usuario_id, mensagem, created_at
        `;

        return res.status(200).json({ success: true, mensagem: result[0] });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        return res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
}
