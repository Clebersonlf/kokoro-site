import { sql } from '../_lib/db.js';

const vazioParaNull = (v) =>
  v === undefined || v === null || String(v).trim() === '' ? null : v;

const numeroParaNull = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export default async function handler(req, res) {
  if (!['POST', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const b = req.body || {};

  const id = b.id;
  const nome = String(b.nome || '').trim();

  if (!nome) {
    return res.status(400).json({ error: 'Nome obrigatorio' });
  }

  const email = vazioParaNull(b.email);
  const telefone = vazioParaNull(b.telefone);
  const sexo = vazioParaNull(b.sexo);
  const nomeMae = vazioParaNull(b.nomeMae);
  const nomePai = vazioParaNull(b.nomePai);
  const rg = vazioParaNull(b.rg);
  const cpf = vazioParaNull(b.cpf);
  const dataNascimento = vazioParaNull(b.dataNascimento);
  const idade = numeroParaNull(b.idade);

  const endereco = vazioParaNull(b.endereco);
  const complemento = vazioParaNull(b.complemento);
  const bairro = vazioParaNull(b.bairro);
  const cep = vazioParaNull(b.cep);
  const referencia = vazioParaNull(b.referencia);
  const whatsapp = vazioParaNull(b.whatsapp);

  const esporte = vazioParaNull(b.esporte);
  const faixa = vazioParaNull(b.faixa) || 'branca';
  const grau = vazioParaNull(b.grau) || '0º Grau';

  const pesoKg = numeroParaNull(b.pesoKg);
  const alturaM = numeroParaNull(b.alturaM);
  const imc = numeroParaNull(b.imc);

  const contatoEmergNome = vazioParaNull(b.contatoEmergNome);
  const contatoEmergParentesco = vazioParaNull(b.contatoEmergParentesco);
  const contatoEmergEndereco = vazioParaNull(b.contatoEmergEndereco);
  const contatoEmergTelefone = vazioParaNull(b.contatoEmergTelefone);

  const parq1 = b.parq1 ?? null;
  const parq2 = b.parq2 ?? null;
  const parq3 = b.parq3 ?? null;
  const parq4 = b.parq4 ?? null;
  const parq5 = b.parq5 ?? null;
  const parq6 = b.parq6 ?? null;
  const parq7 = b.parq7 ?? null;
  const parq8 = b.parq8 ?? null;
  const medicamentos = vazioParaNull(b.medicamentos);

  const termosAceitos = b.termosAceitos ?? false;

  const numeroCertificado = b.numeroCertificado || '';
  const status = b.status || 'ativo';
  const foto = b.foto || null;

  try {
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({
          error: 'ID obrigatorio para atualizacao'
        });
      }

      const r = await sql`
        UPDATE alunos
        SET
          nome = ${nome},
          email = ${email},
          telefone = ${telefone},
          sexo = ${sexo},
          nome_mae = ${nomeMae},
          nome_pai = ${nomePai},
          rg = ${rg},
          cpf = ${cpf},
          data_nascimento = ${dataNascimento},
          idade = ${idade},
          endereco = ${endereco},
          complemento = ${complemento},
          bairro = ${bairro},
          cep = ${cep},
          referencia = ${referencia},
          whatsapp = ${whatsapp},
          esporte = ${esporte},
          faixa = ${faixa},
          grau = ${grau},
          peso_kg = ${pesoKg},
          altura_m = ${alturaM},
          imc = ${imc},
          contato_emerg_nome = ${contatoEmergNome},
          contato_emerg_parentesco = ${contatoEmergParentesco},
          contato_emerg_endereco = ${contatoEmergEndereco},
          contato_emerg_telefone = ${contatoEmergTelefone},
          parq_q1 = ${parq1},
          parq_q2 = ${parq2},
          parq_q3 = ${parq3},
          parq_q4 = ${parq4},
          parq_q5 = ${parq5},
          parq_q6 = ${parq6},
          parq_q7 = ${parq7},
          parq_q8 = ${parq8},
          medicamentos = ${medicamentos},
          termos_aceitos = ${termosAceitos},
          numero_certificado = ${numeroCertificado},
          status = ${status},
          foto = ${foto},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!r.length) {
        return res.status(404).json({ error: 'Aluno nao encontrado' });
      }

      return res.status(200).json(r[0]);
    }

    const r = await sql`
      INSERT INTO alunos (
        nome,
        email,
        telefone,
        sexo,
        nome_mae,
        nome_pai,
        rg,
        cpf,
        data_nascimento,
        idade,
        endereco,
        complemento,
        bairro,
        cep,
        referencia,
        whatsapp,
        esporte,
        faixa,
        grau,
        peso_kg,
        altura_m,
        imc,
        contato_emerg_nome,
        contato_emerg_parentesco,
        contato_emerg_endereco,
        contato_emerg_telefone,
        parq_q1,
        parq_q2,
        parq_q3,
        parq_q4,
        parq_q5,
        parq_q6,
        parq_q7,
        parq_q8,
        medicamentos,
        termos_aceitos,
        numero_certificado,
        status,
        foto
      )
      VALUES (
        ${nome},
        ${email},
        ${telefone},
        ${sexo},
        ${nomeMae},
        ${nomePai},
        ${rg},
        ${cpf},
        ${dataNascimento},
        ${idade},
        ${endereco},
        ${complemento},
        ${bairro},
        ${cep},
        ${referencia},
        ${whatsapp},
        ${esporte},
        ${faixa},
        ${grau},
        ${pesoKg},
        ${alturaM},
        ${imc},
        ${contatoEmergNome},
        ${contatoEmergParentesco},
        ${contatoEmergEndereco},
        ${contatoEmergTelefone},
        ${parq1},
        ${parq2},
        ${parq3},
        ${parq4},
        ${parq5},
        ${parq6},
        ${parq7},
        ${parq8},
        ${medicamentos},
        ${termosAceitos},
        ${numeroCertificado},
        ${status},
        ${foto}
      )
      RETURNING *
    `;

    return res.status(201).json(r[0]);

  } catch (e) {
    console.error('[alunos/salvar]', e);
    return res.status(500).json({ error: e.message });
  }
}
