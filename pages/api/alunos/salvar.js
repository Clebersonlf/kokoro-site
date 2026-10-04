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
  const anoGraduacao = vazioParaNull(b.anoGraduacao);
  const nomeEquipe = vazioParaNull(b.nomeEquipe);
  const nomeProfessor = vazioParaNull(b.nomeProfessor);
  const graduacaoProfessor = vazioParaNull(b.graduacaoProfessor);

  // Nivel complementar somente se a graduacao for realmente faixa branca
  const nivelFaixaBranca =
    /faixa branca|^branca$/i.test(String(faixa).trim())
      ? vazioParaNull(b.nivelFaixaBranca)
      : null;
  const dadosVerdadeiros = b.dadosVerdadeiros ?? false;
  const autorizoImagem = b.autorizoImagem ?? false;

  const entidades = Array.isArray(b.entidades) ? b.entidades : [];

  const responsavelNome = vazioParaNull(b.responsavelNome);
  const responsavelRg = vazioParaNull(b.responsavelRg);
  const responsavelCpf = vazioParaNull(b.responsavelCpf);
  const responsavelParentesco = vazioParaNull(b.responsavelParentesco);
  const responsavelParentescoOutro = vazioParaNull(b.responsavelParentescoOutro);

  const menorNomeCompleto = vazioParaNull(b.menorNomeCompleto);
  const menorSubstanciasCiente = b.menorSubstanciasCiente ?? null;
  const menorMedicamentosCiente = b.menorMedicamentosCiente ?? null;
  const menorMedicamentoNome = vazioParaNull(b.menorMedicamentoNome);
  const menorMedicamentoMotivo = vazioParaNull(b.menorMedicamentoMotivo);
  const menorMedicamentoContinuo = vazioParaNull(b.menorMedicamentoContinuo);

  const responsavelCidade = vazioParaNull(b.responsavelCidade);
  const responsavelData = vazioParaNull(b.responsavelData);
  const responsavelTelefone = vazioParaNull(b.responsavelTelefone);
  const responsavelEmail = vazioParaNull(b.responsavelEmail);
  const responsavelAssinatura = b.responsavelAssinatura ?? false;

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
          ano_graduacao = ${anoGraduacao},
          nome_equipe = ${nomeEquipe},
          nome_professor = ${nomeProfessor},
          graduacao_professor = ${graduacaoProfessor},
          nivel_faixa_branca = ${nivelFaixaBranca},
          dados_verdadeiros = ${dadosVerdadeiros},
          autorizo_imagem = ${autorizoImagem},
          entidades = ${JSON.stringify(entidades)}::jsonb,
          responsavel_nome = ${responsavelNome},
          responsavel_rg = ${responsavelRg},
          responsavel_cpf = ${responsavelCpf},
          responsavel_parentesco = ${responsavelParentesco},
          responsavel_parentesco_outro = ${responsavelParentescoOutro},
          menor_nome_completo = ${menorNomeCompleto},
          menor_substancias_ciente = ${menorSubstanciasCiente},
          menor_medicamentos_ciente = ${menorMedicamentosCiente},
          menor_medicamento_nome = ${menorMedicamentoNome},
          menor_medicamento_motivo = ${menorMedicamentoMotivo},
          menor_medicamento_continuo = ${menorMedicamentoContinuo},
          responsavel_cidade = ${responsavelCidade},
          responsavel_data = ${responsavelData},
          responsavel_telefone = ${responsavelTelefone},
          responsavel_email = ${responsavelEmail},
          responsavel_assinatura = ${responsavelAssinatura},
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
        ano_graduacao,
        nome_equipe,
        nome_professor,
        graduacao_professor,
        nivel_faixa_branca,
        dados_verdadeiros,
        autorizo_imagem,
        entidades,
        responsavel_nome,
        responsavel_rg,
        responsavel_cpf,
        responsavel_parentesco,
        responsavel_parentesco_outro,
        menor_nome_completo,
        menor_substancias_ciente,
        menor_medicamentos_ciente,
        menor_medicamento_nome,
        menor_medicamento_motivo,
        menor_medicamento_continuo,
        responsavel_cidade,
        responsavel_data,
        responsavel_telefone,
        responsavel_email,
        responsavel_assinatura,
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
        ${anoGraduacao},
        ${nomeEquipe},
        ${nomeProfessor},
        ${graduacaoProfessor},
        ${nivelFaixaBranca},
        ${dadosVerdadeiros},
        ${autorizoImagem},
        ${JSON.stringify(entidades)}::jsonb,
        ${responsavelNome},
        ${responsavelRg},
        ${responsavelCpf},
        ${responsavelParentesco},
        ${responsavelParentescoOutro},
        ${menorNomeCompleto},
        ${menorSubstanciasCiente},
        ${menorMedicamentosCiente},
        ${menorMedicamentoNome},
        ${menorMedicamentoMotivo},
        ${menorMedicamentoContinuo},
        ${responsavelCidade},
        ${responsavelData},
        ${responsavelTelefone},
        ${responsavelEmail},
        ${responsavelAssinatura},
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
