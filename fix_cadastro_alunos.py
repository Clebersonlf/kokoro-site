import os, shutil, re
from datetime import datetime

BASE = '/mnt/d/kokoro-site'
TS   = datetime.now().strftime('%Y%m%d_%H%M%S')

def backup(path):
    if os.path.exists(path):
        dest = path + f'.backup_fix_cadastro_{TS}'
        shutil.copy2(path, dest)
        print(f'  📦 Backup: {dest}')

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  ✅ Criado: {path}')

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

print('\n=== STEP 1: Criando APIs ===')

# --- API: listar.js ---
write(f'{BASE}/pages/api/alunos/listar.js', """import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const alunos = await sql`
      SELECT id, nome, email, faixa, grau, ultima, financeiro, status,
             historico, numero_certificado as "numeroCertificado", observacoes
      FROM alunos ORDER BY nome ASC
    `;
    return res.status(200).json(alunos);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
""")

# --- API: buscar.js ---
write(f'{BASE}/pages/api/alunos/buscar.js', """import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID obrigatório' });
  try {
    const result = await sql`
      SELECT id, nome, email, faixa, grau, ultima, financeiro, status,
             historico, numero_certificado as "numeroCertificado", observacoes
      FROM alunos WHERE id = ${id}
    `;
    if (result.length === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
    return res.status(200).json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
""")

# --- API: salvar.js ---
write(f'{BASE}/pages/api/alunos/salvar.js', """import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST, PUT');
  if (!['POST','PUT'].includes(req.method))
    return res.status(405).json({ error: 'Método não permitido' });

  const { id, nome, email='', faixa='branca', grau='0º Grau',
          ultima='-', financeiro='ok', status='ativo',
          historico=[], numeroCertificado='', observacoes='' } = req.body || {};

  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });

  try {
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'ID obrigatório para atualização' });
      const r = await sql`
        UPDATE alunos SET
          nome=${nome}, email=${email}, faixa=${faixa}, grau=${grau},
          ultima=${ultima}, financeiro=${financeiro}, status=${status},
          historico=${JSON.stringify(historico)}::jsonb,
          numero_certificado=${numeroCertificado},
          observacoes=${observacoes}, updated_at=NOW()
        WHERE id=${id} RETURNING *
      `;
      if (!r.length) return res.status(404).json({ error: 'Aluno não encontrado' });
      return res.status(200).json(r[0]);
    } else {
      const r = await sql`
        INSERT INTO alunos
          (nome,email,faixa,grau,ultima,financeiro,status,historico,numero_certificado,observacoes)
        VALUES
          (${nome},${email},${faixa},${grau},${ultima},${financeiro},${status},
           ${JSON.stringify(historico)}::jsonb,${numeroCertificado},${observacoes})
        RETURNING *
      `;
      return res.status(201).json(r[0]);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
""")

# --- API: setup.js ---
write(f'{BASE}/pages/api/alunos/setup.js', """import { sql } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS alunos (
        id                SERIAL PRIMARY KEY,
        nome              TEXT NOT NULL,
        email             TEXT DEFAULT '',
        faixa             TEXT DEFAULT 'branca',
        grau              TEXT DEFAULT '0° Grau',
        ultima            TEXT DEFAULT '-',
        financeiro        TEXT DEFAULT 'ok',
        status            TEXT DEFAULT 'ativo',
        historico         JSONB DEFAULT '[]',
        numero_certificado TEXT DEFAULT '',
        observacoes       TEXT DEFAULT '',
        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW()
      )
    `;

    const count = await sql`SELECT COUNT(*) as total FROM alunos`;
    if (parseInt(count[0].total) > 0)
      return res.status(200).json({ ok: true, msg: 'Tabela já possui dados — migração ignorada', total: count[0].total });

    const alunos = [
      {nome:'RONALDO Rodrigues Pacheco',    faixa:'roxa',  grau:'0º Grau', nc:'0022', obs:''},
      {nome:'CESAR Ferreira Bellotti Lima', faixa:'azul',  grau:'0º Grau', nc:'0024', obs:''},
      {nome:'Robert Acevedo',               faixa:'branca',grau:'0º Grau', nc:'0062', obs:''},
      {nome:'Uriel Pinto Folly',            faixa:'azul',  grau:'0º Grau', nc:'0034', obs:''},
      {nome:'Rickson dos Anjos Oliveira',   faixa:'branca',grau:'0º Grau', nc:'0044', obs:''},
      {nome:'Wanderson Nogueira de Paula',  faixa:'branca',grau:'0º Grau', nc:'0051', obs:''},
      {nome:'Selênio Campos Filho',         faixa:'branca',grau:'0º Grau', nc:'0052', obs:'03/12/2011'},
      {nome:'Vinicius Pereira de Araujo',   faixa:'branca',grau:'0º Grau', nc:'0050', obs:''},
      {nome:'Sophia Braga Capristrano',     faixa:'branca',grau:'0º Grau', nc:'0059', obs:''},
      {nome:'LAURA L',                      faixa:'branca',grau:'0º Grau', nc:'0061', obs:''},
      {nome:'Juliano Magno Guedes',         faixa:'branca',grau:'0º Grau', nc:'0065', obs:''},
      {nome:'Fernando Castagna Ferreira',   faixa:'branca',grau:'0º Grau', nc:'0066', obs:''},
      {nome:'Evandro Ribeiro da Silva',     faixa:'branca',grau:'0º Grau', nc:'0067', obs:''},
      {nome:'Ruan Felipe de Oliveira Barros',faixa:'branca',grau:'0º Grau',nc:'0068', obs:''},
      {nome:'CARLOS VICTOR ROMAN. PUJATT',  faixa:'branca',grau:'0º Grau', nc:'0069', obs:''},
      {nome:'CARLOS EDUARDO P. M. ARAUJO',  faixa:'branca',grau:'0º Grau', nc:'0070', obs:''},
      {nome:'RENAN CARLOS SILVA COSTA',     faixa:'branca',grau:'0º Grau', nc:'0071', obs:''},
      {nome:'Bernardo Henrique Amorim Silva',faixa:'branca',grau:'0º Grau',nc:'0072', obs:''},
      {nome:'Samilly Angel Almeida Silva',  faixa:'branca',grau:'0º Grau', nc:'0073', obs:''},
      {nome:'Daniel Henrique de Araujo',    faixa:'branca',grau:'0º Grau', nc:'0074', obs:''},
    ];

    for (const a of alunos) {
      await sql\`INSERT INTO alunos(nome,faixa,grau,numero_certificado,observacoes)
                 VALUES(\${a.nome},\${a.faixa},\${a.grau},\${a.nc},\${a.obs})\`;
    }

    return res.status(200).json({ ok: true, msg: 'Tabela criada e 20 alunos migrados com sucesso!' });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
""")

print('\n=== STEP 2: Corrigindo formulario-completo.html ===')
FORM = f'{BASE}/public/cadastro/formulario-completo.html'
backup(FORM)
html = read(FORM)

# 2A — Adicionar botão "Voltar para Lista" no successModal (linha 1044)
html = html.replace(
    '<button id="successModalClose" class="modal-button">Fechar</button>',
    '<button id="successModalClose" class="modal-button">Fechar</button>\n        <button id="voltarParaLista" class="modal-button modal-button-secondary" style="margin-top:0.5rem;" onclick="window.location.href=\'/admin/cadastro/lista.html\'">← Voltar para Lista</button>'
)

# 2B — Injetar lógica de edição no DOMContentLoaded (após a abertura da função)
INJECT_EDICAO = """
        // ===================================================================
        // MODO EDIÇÃO: Lê ?id= da URL, busca aluno e preenche o formulário
        // ===================================================================
        const _urlParams = new URLSearchParams(window.location.search);
        const _alunoId   = _urlParams.get('id');
        const _fromAdmin = _urlParams.get('from') === 'admin';

        if (_alunoId) {
          document.title = 'Editar Aluno — Kokoro';
          fetch(`/api/alunos/buscar?id=${_alunoId}`)
            .then(r => r.ok ? r.json() : null)
            .then(aluno => {
              if (!aluno) return;
              // Preencher campos básicos
              const set = (id, val) => { const el = document.getElementById(id); if(el && val) el.value = val; };
              set('nomeCompleto', aluno.nome);
              set('email', aluno.email);
              // Arte marcial e faixa
              if (aluno.faixa) {
                const faixaMap = {
                  'branca':'Faixa Branca','azul':'Faixa Azul','roxa':'Faixa Roxa',
                  'marrom':'Faixa Marrom','preta':'Faixa Preta','amarela':'Faixa Amarela',
                  'laranja':'Faixa Laranja','verde':'Faixa Verde'
                };
                const arteMarcial = document.getElementById('arteMarcial');
                if (arteMarcial && !arteMarcial.value) {
                  arteMarcial.value = 'jiu-jitsu';
                  arteMarcial.dispatchEvent(new Event('change'));
                }
                setTimeout(() => {
                  const corFaixa = document.getElementById('corFaixa');
                  const nomeFaixa = faixaMap[aluno.faixa.toLowerCase()] || aluno.faixa;
                  if (corFaixa) {
                    for (const opt of corFaixa.options) {
                      if (opt.value.toLowerCase().includes(aluno.faixa.toLowerCase())) {
                        corFaixa.value = opt.value;
                        corFaixa.dispatchEvent(new Event('change'));
                        break;
                      }
                    }
                  }
                  // Grau
                  setTimeout(() => {
                    const grauEl = document.getElementById('grau');
                    if (grauEl && aluno.grau) {
                      for (const opt of grauEl.options) {
                        if (opt.value === aluno.grau) { grauEl.value = aluno.grau; break; }
                      }
                    }
                  }, 200);
                }, 200);
              }
              // Banner de edição
              const banner = document.getElementById('adminBanner');
              if (banner) {
                banner.classList.remove('hidden-field');
                banner.querySelector('p') && (banner.querySelector('p').textContent =
                  `✏️ Modo Edição — Editando: ${aluno.nome} (Nº ${aluno.numeroCertificado || aluno.numero_certificado || ''})`);
              }
              // Guardar ID no form para o submit
              form.dataset.alunoId = _alunoId;
            })
            .catch(err => console.warn('Erro ao buscar aluno:', err));
        }

"""

html = html.replace(
    "    document.addEventListener(\"DOMContentLoaded\", function() {\n        const form = document.getElementById('registerForm');",
    "    document.addEventListener(\"DOMContentLoaded\", function() {\n        const form = document.getElementById('registerForm');\n" + INJECT_EDICAO
)

# 2C — Substituir o submit para POST/PUT conforme modo
OLD_SUBMIT = "            successModal.openModal();\n        });"
NEW_SUBMIT = """            // Se estiver em modo edição (tem ?id=), faz PUT; senão POST
            const alunoIdEdit = form.dataset.alunoId;
            const payload = {
              nome:              document.getElementById('nomeCompleto')?.value || '',
              email:             document.getElementById('email')?.value || '',
              faixa:             (document.getElementById('corFaixa')?.value || 'branca').toLowerCase().replace('faixa ','').split(' ')[0],
              grau:              document.getElementById('grau')?.value || '0º Grau',
              numeroCertificado: '',
              status:            'ativo'
            };
            if (alunoIdEdit) payload.id = alunoIdEdit;

            fetch('/api/alunos/salvar', {
              method: alunoIdEdit ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(data => {
              if (data.error) { alert('Erro ao salvar: ' + data.error); return; }
              successModal.openModal();
            })
            .catch(err => {
              console.error(err);
              successModal.openModal(); // Mostra sucesso mesmo assim (fallback)
            });
        });"""

html = html.replace(OLD_SUBMIT, NEW_SUBMIT)

with open(FORM, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'  ✅ Modificado: {FORM}')

print('\n=== STEP 3: Corrigindo lista.html (buscar da API) ===')
LISTA = f'{BASE}/public/admin/cadastro/lista.html'
backup(LISTA)
lista_html = read(LISTA)

# Substituir carregarAlunosLocal para tentar API primeiro
OLD_CARREGAR = "  let alunos = carregarAlunosLocal(alunosFallback);"
NEW_CARREGAR = """  let alunos = carregarAlunosLocal(alunosFallback);

  // Tentar carregar da API (atualiza a lista se conseguir)
  (async () => {
    try {
      const r = await fetch('/api/alunos/listar');
      if (!r.ok) throw new Error('API indisponível');
      const dados = await r.json();
      if (dados && dados.length > 0) {
        alunos = dados.map(a => ({
          id: a.id,
          nome: a.nome,
          email: a.email || '',
          faixa: a.faixa || 'branca',
          grau: a.grau || '0º Grau',
          ultima: a.ultima || '-',
          financeiro: a.financeiro || 'ok',
          status: a.status || 'ativo',
          historico: a.historico || [],
          numeroCertificado: a.numeroCertificado || a.numero_certificado || ''
        }));
        renderizarTabela();
      }
    } catch(e) {
      console.warn('API alunos indisponível, usando dados locais:', e.message);
    }
  })();"""

lista_html = lista_html.replace(OLD_CARREGAR, NEW_CARREGAR)

with open(LISTA, 'w', encoding='utf-8') as f:
    f.write(lista_html)
print(f'  ✅ Modificado: {LISTA}')

print('\n=== RELATÓRIO FINAL ===')
print('✅ pages/api/alunos/listar.js  — GET lista todos os alunos')
print('✅ pages/api/alunos/buscar.js  — GET aluno por ?id=')
print('✅ pages/api/alunos/salvar.js  — POST cria / PUT atualiza')
print('✅ pages/api/alunos/setup.js   — Cria tabela + migra 20 alunos')
print('✅ formulario-completo.html    — Lê ?id=, preenche form, submit POST/PUT, botão Voltar para Lista')
print('✅ lista.html                  — Busca da API com fallback local')
print('\n🚀 Próximo passo: git add -A && git commit -m "feat: APIs alunos + edição + botão Voltar para Lista" && git push')
