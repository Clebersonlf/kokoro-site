import { sql } from '../../api/_lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { conversa_id, limit = 50 } = req.query;

        if (!conversa_id) {
            return res.status(400).json({ error: 'conversa_id obrigatório' });
        }

        // Buscar mensagens da conversa
        const mensagens = await sql`
            SELECT 
                m.id,
                m.mensagem,
                m.created_at,
                m.lida,
                u.nome as usuario_nome,
                u.foto_url as usuario_foto
            FROM chat_mensagens m
            JOIN chat_usuarios u ON m.usuario_id = u.id
            WHERE m.conversa_id = ${conversa_id}
            ORDER BY m.created_at DESC
            LIMIT ${limit}
        `;

        return res.status(200).json({ success: true, mensagens: mensagens.reverse() });
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
}
