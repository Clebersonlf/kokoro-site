import re

arquivo = 'public/consultoria_alunos.html'

print("="*70)
print("CORRIGINDO consultoria_alunos.html")
print("="*70)

with open(arquivo, 'r', encoding='utf-8') as f:
    content = f.read()

# Adicionar seção de consultores
if 'id="consultores-section"' not in content:
    secao = '''
<div id="consultores-section" style="display: none;">
    <div class="container" style="margin-top: 30px;">
        <button onclick="voltarAreas()" class="btn btn-secondary">Voltar</button>
        <h2 id="area-selecionada-titulo">Consultores</h2>
        <div id="consultores-lista" class="row"></div>
    </div>
</div>

<div class="modal fade" id="modalSolicitarConsulta" tabindex="-1">
    <div class="modal-dialog"><div class="modal-content">
        <div class="modal-header">
            <h5>Solicitar Consulta</h5>
            <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
        </div>
        <div class="modal-body">
            <form id="formSolicitarConsulta">
                <input type="hidden" id="consultor_id_hidden">
                <input type="text" class="form-control mb-2" id="solicitante_nome" placeholder="Nome" required>
                <input type="email" class="form-control mb-2" id="solicitante_email" placeholder="Email" required>
                <input type="tel" class="form-control mb-2" id="solicitante_telefone" placeholder="Telefone" required>
                <select class="form-control mb-2" id="metodo_consulta" required onchange="togglePlataformas()">
                    <option value="">Método...</option>
                    <option value="mensagem">Mensagem</option>
                    <option value="videoconferencia">Videoconferência</option>
                </select>
                <select class="form-control mb-2" id="plataforma_video" style="display:none">
                    <option value="">Plataforma...</option>
                    <option value="zoom">Zoom</option>
                    <option value="google-meet">Google Meet</option>
                    <option value="teams">Teams</option>
                </select>
                <textarea class="form-control" id="mensagem" rows="3" required></textarea>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" onclick="enviarSolicitacao()">Enviar</button>
        </div>
    </div></div>
</div>

<script>
let consultorAtualId = null;

function selecionarArea(areaId) {
    document.getElementById('areas-section').style.display = 'none';
    document.getElementById('consultores-section').style.display = 'block';
    carregarConsultores(areaId);
}

function voltarAreas() {
    document.getElementById('areas-section').style.display = 'block';
    document.getElementById('consultores-section').style.display = 'none';
}

async function carregarConsultores(areaId) {
    const lista = document.getElementById('consultores-lista');
    lista.innerHTML = '<p>Carregando...</p>';
    try {
        const res = await fetch('/api/consultoria/listar?area=' + areaId);
        const data = await res.json();
        if (data.success && data.consultores.length > 0) {
            let html = '';
            data.consultores.forEach(c => {
                html += '<div class="col-md-4"><div class="card mb-3"><div class="card-body">';
                html += '<h5>' + c.nome + '</h5>';
                html += '<button class="btn btn-primary" onclick="abrirModal(' + c.id + ')">Solicitar</button>';
                html += '</div></div></div>';
            });
            lista.innerHTML = html;
        } else {
            lista.innerHTML = '<p>Nenhum consultor disponível.</p>';
        }
    } catch (e) {
        lista.innerHTML = '<p>Erro ao carregar.</p>';
    }
}

function abrirModal(id) {
    consultorAtualId = id;
    $('#modalSolicitarConsulta').modal('show');
}

function togglePlataformas() {
    const met = document.getElementById('metodo_consulta').value;
    document.getElementById('plataforma_video').style.display = met === 'videoconferencia' ? 'block' : 'none';
}

async function enviarSolicitacao() {
    const dados = {
        consultor_id: consultorAtualId,
        nome: document.getElementById('solicitante_nome').value,
        email: document.getElementById('solicitante_email').value,
        metodo: document.getElementById('metodo_consulta').value,
        mensagem: document.getElementById('mensagem').value
    };
    try {
        const res = await fetch('/api/consultoria/solicitar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        const result = await res.json();
        if (result.success) {
            alert('Solicitação enviada!');
            $('#modalSolicitarConsulta').modal('hide');
        }
    } catch (e) {
        alert('Erro ao enviar.');
    }
}
</script>
'''
    content = content.replace('</body>', secao + '\n</body>')
    print("Seção adicionada!")

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(content)

print("CONCLUIDO!")
