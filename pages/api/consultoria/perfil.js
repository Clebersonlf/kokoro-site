import { sql } from '../../api/_lib/db.js';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const {
                id, nome, email, telefone, foto_url, area_atuacao,
                especializacoes, numero_registro, resumo, valor_consulta, duracao_consulta
            } = req.body;

            if (!nome || !email || !area_atuacao) {
                return res.status(400).json({ error: 'Dados obrigatórios faltando' });
            }

            if (id) {
                const result = await sql`
                    UPDATE consultores
                    SET nome = ${nome}, telefone = ${telefone}, foto_url = ${foto_url},
                        area_atuacao = ${area_atuacao}, especializacoes = ${especializacoes},
                        numero_registro = ${numero_registro}, resumo = ${resumo},
                        valor_consulta = ${valor_consulta}, duracao_consulta = ${duracao_consulta}
                    WHERE id = ${id}
                    RETURNING *
                `;
                return res.status(200).json({ success: true, consultor: result[0] });
            } else {
                const result = await sql`
                    INSERT INTO consultores (
                        nome, email, telefone, foto_url, area_atuacao, especializacoes,
                        numero_registro, resumo, valor_consulta, duracao_consulta, status
                    )
                    VALUES (
                        ${nome}, ${email}, ${telefone}, ${foto_url}, ${area_atuacao},
                        ${especializacoes}, ${numero_registro}, ${resumo},
                        ${valor_consulta}, ${duracao_consulta}, 'pendente'
                    )
                    RETURNING *
                `;
                return res.status(201).json({ success: true, consultor: result[0] });
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            return res.status(500).json({ error: 'Erro ao salvar perfil' });
        }
    } else if (req.method === 'GET') {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ error: 'Email obrigatório' });
            }
            const result = await sql`SELECT * FROM consultores WHERE email = ${email}`;
            return res.status(200).json({ success: true, consultor: result[0] || null });
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
