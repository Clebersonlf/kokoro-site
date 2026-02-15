import { sql } from '../../api/_lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { area } = req.query;
        let consultores;
        
        if (area) {
            consultores = await sql`
                SELECT id, nome, foto_url, area_atuacao, especializacoes,
                       numero_registro, resumo, valor_consulta, duracao_consulta
                FROM consultores
                WHERE area_atuacao = ${area} AND status = 'aprovado'
                ORDER BY nome
            `;
        } else {
            consultores = await sql`
                SELECT id, nome, foto_url, area_atuacao, especializacoes,
                       numero_registro, resumo, valor_consulta, duracao_consulta
                FROM consultores
                WHERE status = 'aprovado'
                ORDER BY area_atuacao, nome
            `;
        }

        return res.status(200).json({ success: true, consultores });
    } catch (error) {
        console.error('Erro ao listar consultores:', error);
        return res.status(500).json({ error: 'Erro ao listar consultores' });
    }
}
