import { sql } from '../../api/_lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({ error: 'usuario_id obrigatório' });
        }

        // Buscar conversas do usuário
        const conversas = await sql`
            SELECT 
                c.id,
                c.tipo,
                c.nome_grupo,
                c.created_at,
                (
                    SELECT COUNT(*)
                    FROM chat_mensagens m
                    WHERE m.conversa_id = c.id 
                    AND m.lida = false 
                    AND m.usuario_id != ${usuario_id}
                ) as nao_lidas,
                (
                    SELECT m.mensagem
                    FROM chat_mensagens m
                    WHERE m.conversa_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) as ultima_mensagem
            FROM chat_conversas c
            JOIN chat_participantes p ON p.conversa_id = c.id
            WHERE p.usuario_id = ${usuario_id}
            ORDER BY c.created_at DESC
        `;

        return res.status(200).json({ success: true, conversas });
    } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        return res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
}
