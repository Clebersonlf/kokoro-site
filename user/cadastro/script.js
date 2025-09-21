document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('registerForm');
    const body = document.body;
    if (!form) return;

    const graduacoes = {
        'jiu-jitsu': ['Faixa Branca', 'Faixa Cinza e Branca', 'Faixa Cinza', 'Faixa Cinza e Preta', 'Faixa Amarela e Branca', 'Faixa Amarela', 'Faixa Amarela e Preta', 'Faixa Laranja e Branca', 'Faixa Laranja', 'Faixa Laranja e Preta', 'Faixa Verde e Branca', 'Faixa Verde', 'Faixa Verde e Preta', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta', 'Faixa Vermelha e Preta – 7º Grau', 'Faixa Vermelha e Branca – 8º Grau', 'Faixa Vermelha – 9º Grau', 'Faixa Vermelha – 10º Grau'],
        'judo': ['Faixa Branca – 6º kyū', 'Faixa Cinza ou Azul-Clara – 5º kyū', 'Faixa Laranja – 4º kyū', 'Faixa Verde – 3º kyū', 'Faixa Azul – 2º kyū', 'Faixa Marrom – 1º kyū', 'Faixa Preta – 1º dan', 'Faixa Preta – 2º dan', 'Faixa Preta – 3º dan', 'Faixa Preta – 4º dan', 'Faixa Preta – 5º dan', 'Faixa Vermelha e Preta – 6º dan', 'Faixa Vermelha e Preta – 7º dan', 'Faixa Vermelha – 8º dan', 'Faixa Vermelha – 9º dan', 'Faixa Vermelha – 10º dan'],
        'karate': ['Faixa Branca – 9º kyū', 'Faixa Amarela – 8º kyū', 'Faixa Laranja – 7º kyū', 'Faixa Verde – 6º kyū', 'Faixa Azul – 5º kyū', 'Faixa Azul (escuro) – 4º kyū', 'Faixa Marrom (1º nível) – 3º kyū', 'Faixa Marrom (2º nível) – 2º kyū', 'Faixa Marrom (3º nível) – 1º kyū', 'Faixa Preta – 1º dan', 'Faixa Preta – 2º dan', 'Faixa Preta – 3º dan', 'Faixa Preta – 4º dan', 'Faixa Preta – 5º dan', 'Faixa Coral – 6º dan', 'Faixa Coral – 7º dan', 'Faixa Vermelha e Branca – 8º dan', 'Faixa Vermelha – 9º dan', 'Faixa Vermelha – 10º dan']
    };
    const grausJiuJitsuBasico = ['Lisa', '1º Grau', '2º Grau', '3º Grau', '4º Grau'];
    const grausJiuJitsuPreta = ['Lisa', '1º Grau', '2º Grau', '3º Grau', '4º Grau', '5º Grau', '6º Grau'];

> Cleberson:
// ====== CÂMERA: abrir / capturar / arquivo / enviar ======
        function logUI() {
            console.log('[UI]', {
                cam: cameraPreview?.style.display,
                img: previewImage?.style.display,
                cap: captureButton?.style.display,
                okBtn: photoSubmitButton?.style.display
            });
        }

    async function abrirCameraSeguro() {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('Navegador sem getUserMedia. Use HTTPS (Vercel) ou http://localhost.');
            console.error('[CAMERA] mediaDevices/getUserMedia indisponível');
            return null;
        }
        try {
            // fecha stream antigo
            if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

            // tenta frontal, senão genérica
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            } catch (e1) {
                console.warn('[CAMERA] facingMode:user falhou, tentando genérico:', e1);
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';
            previewImage.style.display  = 'none';
            captureButton.style.display = 'inline-block';
            if (photoSubmitButton) photoSubmitButton.style.display = 'none';
            if (cameraButton) cameraButton.textContent = 'Trocar Câmera';

            await cameraPreview.play(); // iOS/Safari precisa
            console.log('[CAMERA] OK stream:', stream);
            logUI();
            return stream;
        } catch (err) {
            console.error('[CAMERA] Erro ao abrir:', err.name, err.message, err);
            alert('Não foi possível acessar a câmera: ' + err.name + '\n' + err.message +
                '\n• Permissões (cadeado)\n• Feche apps que usam a câmera\n• Use HTTPS/Vercel ou localhost');
            return null;
        }
    }

// Abrir Câmera
    cameraButton?.addEventListener('click', async () => {
        await abrirCameraSeguro();
    });

// Tirar Foto (captura do <video> para <img>)
    captureButton?.addEventListener('click', () => {
        if (!cameraPreview?.srcObject) {
            console.warn('[CAMERA] Sem stream. Abrindo...');
            abrirCameraSeguro();
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width  = cameraPreview.videoWidth  || 800;
        canvas.height = cameraPreview.videoHeight || 600;
        canvas.getContext('2d').drawImage(cameraPreview, 0, 0);
        currentPhoto = canvas.toDataURL('image/png');

        previewImage.src = currentPhoto;
        previewImage.style.display  = 'block';
        cameraPreview.style.display = 'none';
        captureButton.style.display = 'none';
        if (photoSubmitButton) photoSubmitButton.style.display = 'inline-block';

        // libera a câmera
        cameraPreview.srcObject?.getTracks().forEach(t => t.stop());
        stream = null;
        if (cameraButton) cameraButton.textContent = 'Abrir Câmera';
        logUI();
    });

// Selecionar arquivo do computador
    fileInput?.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                currentPhoto = e.target.result;
                previewImage.src = currentPhoto;
                previewImage.style.display  = 'block';
                cameraPreview.style.display = 'none';
                captureButton.style.display = 'none';
                if (photoSubmitButton) photoSubmitButton.style.display = 'inline-block';
                // garante liberação da câmera
                if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
                if (cameraButton) cameraButton.textContent = 'Abrir Câmera';
                logUI();
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // ================== REGISTRO VITALÍCIO ==================
    const ALUNOS_KEY   = 'kokoro_alunos_v1';
    const REG_STATE_KEY = 'kokoro_reg_state_v1';

// cria estado inicial de numeração se não existir
    (function initRegState(){
        const s = JSON.parse(localStorage.getItem(REG_STATE_KEY) || 'null');
        if (!s) {
            localStorage.setItem(
                REG_STATE_KEY,
                JSON.stringify({
                    // 0001–0020 e 0021–0073 reservados/manual; automático começa em 0074
                    nextAuto: 74,
                    blocked: [[1,20],[21,73]]
                })
            );
        }
    })();

// helpers de número
    function _fmt(n){ return String(n).padStart(4,'0'); }
    function _parse(numStr){ return parseInt(String(numStr).replace(/\D/g,''), 10) || 0; }

    function _isBlocked(n){
        const st = JSON.parse(localStorage.getItem(REG_STATE_KEY));
        return (st.blocked || []).some(([a,b]) => n>=a && n<=b);
    }

    function _isTaken(n){
        const alunos = JSON.parse(localStorage.getItem(ALUNOS_KEY) || '[]');
        const s = _fmt(n);
        return alunos.some(a => a?.registro?.numero === s);
    }

// Próximo número automático (pula bloqueados e já usados)
    function getNextAutoReg(){
        const st = JSON.parse(localStorage.getItem(REG_STATE_KEY));
        let n = st.nextAuto || 74;

        while (_isBlocked(n) || _isTaken(n)) n++;

        st.nextAuto = n + 1;
        localStorage.setItem(REG_STATE_KEY, JSON.stringify(st));
        return _fmt(n);
    }

// Atribuição manual pelo admin (pode ser em QUALQUER faixa, desde que não esteja em uso)
    function assignManualRegById(alunoId, numeroStr){
        const n = _parse(numeroStr);
        if (n <= 0) throw new Error('Número inválido');
        if (_isTaken(n)) throw new Error('Este número já está em uso');

        const alunos = JSON.parse(localStorage.getItem(ALUNOS_KEY) || '[]');
        const idx = alunos.findIndex(a => a.id == alunoId);
        if (idx < 0) throw new Error('Aluno não encontrado');

        alunos[idx].registro = alunos[idx].registro || { numero: null, historico: [] };
        alunos[idx].registro.numero = _fmt(n);
        localStorage.setItem(ALUNOS_KEY, JSON.stringify(alunos));
        return alunos[idx];
    }

// (Opcional) remover/editar número
    function clearRegById(alunoId){
        const alunos = JSON.parse(localStorage.getItem(ALUNOS_KEY) || '[]');
        const idx = alunos.findIndex(a => a.id == alunoId);
        if (idx < 0) throw new Error('Aluno não encontrado');
        if (alunos[idx].registro) alunos[idx].registro.numero = null;
        localStorage.setItem(ALUNOS_KEY, JSON.stringify(alunos));
        return alunos[idx];
    }

// Expor utilitários no console para testes (futuro painel vai chamar essas funcs)
    window.KokoroReg = {
        getNextAutoReg,
        assignManualRegById,
        clearRegById,
        _isBlocked,
        _isTaken
    };

    // retorna próximo número automático já pulando faixas bloqueadas
    // (não usamos no cadastro ainda; usaremos na 1ª graduação)
    function getNextAutoReg(){
        const st = JSON.parse(localStorage.getItem(REG_STATE_KEY));
        const blocked = st.blocked || [];
        const inBlocked = (x) => blocked.some(([a,b]) => x>=a && x<=b);

        let n = st.nextAuto;
        while (inBlocked(n)) n++;
        st.nextAuto = n + 1;
        localStorage.setItem(REG_STATE_KEY, JSON.stringify(st));
        return String(n).padStart(4,'0');
    }

    // ===================================================================
    // FUNÇÕES GENÉRICAS / INICIALIZAÇÃO
    // ===================================================================
    function setupModal(modalEl, openTrigger, closeTrigger) {
        if (!modalEl) return;
        const openModal = () => { modalEl.classList.remove('hidden-field'); body.style.overflow = 'hidden'; const focusable = modalEl.querySelector('button, input, select, textarea'); if (focusable) focusable.focus(); };
        const closeModal = () => { modalEl.classList.add('hidden-field'); body.style.overflow = ''; if (openTrigger) openTrigger.focus(); };
        if (openTrigger) openTrigger.addEventListener('click', openModal);
        if (closeTrigger) closeTrigger.addEventListener('click', closeModal);
        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalEl.classList.contains('hidden-field')) { closeModal(); } });
    }

    function popularEstados() {
        if (!estadoSelect) return;
        const estados = [
            { sigla: '', nome: 'Selecione...' }, { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' },
            { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' },
            { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' },
            { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' },
            { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' },
            { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' },
            { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' },
            { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' },
            { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
        ];
        estadoSelect.innerHTML = '';
        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.sigla ? `${estado.sigla} - ${estado.nome}` : estado.nome;
            estadoSelect.appendChild(option);
        });
    }
    popularEstados();

    // ===================================================================
    // LÓGICA DO MODO ADMIN
    // ===================================================================
    if (adminToggle) {
        const closeAdminModal = () => {
            adminPasswordModalEl.classList.add('hidden-field');
            adminPasswordInput.value = '';
            adminPasswordError.textContent = '';
            if (!body.classList.contains('admin-mode-active')) { adminToggle.checked = false; }
        };
        adminToggle.addEventListener('change', function() {
            if (this.checked) {
                adminPasswordModalEl.classList.remove('hidden-field');
                adminPasswordInput.focus();
            } else {
                adminNotice.classList.add('hidden-field');
                body.classList.remove('admin-mode-active');
                allRequiredFields.forEach(field => field.setAttribute('required', 'required'));
            }
        });
        adminPasswordConfirmBtn.addEventListener('click', function() {
            if (adminPasswordInput.value === 'kokoroadmin') {
                adminNotice.classList.remove('hidden-field');
                body.classList.add('admin-mode-active');
                allRequiredFields.forEach(field => field.removeAttribute('required'));
                closeAdminModal();
            } else {
                adminPasswordError.textContent = 'Senha incorreta.';
                adminPasswordInput.focus();
            }
        });
        adminPasswordCancelBtn.addEventListener('click', closeAdminModal);
        adminPasswordModalEl.addEventListener('click', (e) => { if (e.target === adminPasswordModalEl) closeAdminModal(); });
        adminPasswordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); adminPasswordConfirmBtn.click(); }
        });
    }

    // === Integra o botão "photoSubmitButton" ao Vercel Blob ===

// transforma a imagem que já está no preview em Blob (JPEG)
    async function previewImageToBlob(imgEl, quality = 0.9) {
        return new Promise((resolve, reject) => {
            if (!imgEl || !imgEl.src) return reject(new Error('Prévia indisponível'));
            const img = new Image();
            img.onload = () => {
                const w = img.naturalWidth || imgEl.naturalWidth || 800;
                const h = img.naturalHeight || imgEl.naturalHeight || 600;
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar blob'))), 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = imgEl.src;
        });
    }

// envia o Blob para sua rota serverless que usa @vercel/blob
    async function enviarFotoParaVercelBlob(fotoBlob, userId) {
        const fd = new FormData();
        fd.append('userId', userId || 'anon'); // troque pelo ID real depois
        fd.append('file', new File([fotoBlob], 'selfie.jpg', { type: 'image/jpeg' }));

        const resp = await fetch('/api/upload-selfie', { method: 'POST', body: fd });
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || 'Falha no upload');
        return data; // { ok:true, url, path }
    }

// clique no botão "Confirmar Foto" -> envia para o Blob
    photoSubmitButton?.addEventListener('click', async () => {
        try {
            if (!previewImage?.src) {
                alert('Tire ou selecione a foto antes de enviar.');
                return;
            }
            photoSubmitButton.disabled = true;
            const originalTxt = photoSubmitButton.textContent;
            photoSubmitButton.textContent = 'Enviando...';

            // gera o blob a partir do preview atual
            const blob = await previewImageToBlob(previewImage, 0.9);

            // envia para o Vercel Blob via sua API
            const userId = 'admin-test'; // TODO: trocar pelo ID real do aluno
            const up = await enviarFotoParaVercelBlob(blob, userId);

            // se existir um input hidden #selfiePath, preenche com o caminho salvo
            const hidden = document.getElementById('selfiePath');
            if (hidden) hidden.value = up.path;

            photoSubmitButton.textContent = 'Enviado ✔';
            alert('Selfie enviada com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Não foi possível enviar a selfie. Tente novamente.');
            photoSubmitButton.textContent = 'Confirmar Foto';
        } finally {
            photoSubmitButton.disabled = false;
        }
    });

    // ===================================================================
    // MÁSCARAS DE INPUT
    // ===================================================================
    const applyMask = (element, maskFunction) => { if(element) element.addEventListener('input', (e) => { e.target.value = maskFunction(e.target.value); }); };
    const maskCPF  = (value) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').substring(0, 14);
    const maskCEP  = (value) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
    const maskPhone= (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})/, '$1-$2').substring(0, 15);
    applyMask(document.getElementById('cpf'), maskCPF);
    applyMask(cepInput, maskCEP);
    applyMask(document.getElementById('telefone'), maskPhone);
    applyMask(document.getElementById('whatsapp'), maskPhone);
    applyMask(contato1_telefone, maskPhone);
    applyMask(contato2_telefone, maskPhone);

    // ===================================================================
    // LÓGICA DE BUSCA DE ENDEREÇO POR CEP
    // ===================================================================
    const buscaCEP = async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        enderecoInput.value = "Buscando...";
        bairroInput.value = "Buscando...";
        cidadeInput.value = "Buscando...";
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) {
                alert("CEP não encontrado.");
                enderecoInput.value = ""; bairroInput.value = ""; cidadeInput.value = "";
                return;
            }
            enderecoInput.value = data.logradouro;
            bairroInput.value = data.bairro;
            cidadeInput.value = data.localidade;
            estadoSelect.value = data.uf;
            document.getElementById('endereco').focus();
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            alert("Ocorreu um erro ao buscar o CEP.");
            enderecoInput.value = ""; bairroInput.value = ""; cidadeInput.value = "";
        }
    };
    if (cepInput) { cepInput.addEventListener('blur', buscaCEP); }
    // também dispara a busca quando completar 8 dígitos
    let _cepTimer = null;
    if (cepInput) {
        cepInput.addEventListener('input', () => {
            const v = cepInput.value.replace(/\D/g, '');
            if (v.length === 8) {
                clearTimeout(_cepTimer);
                _cepTimer = setTimeout(() => buscaCEP(), 150); // leve debounce
            }
        });
    }

    // ===================================================================
    // LÓGICA DE CÁLCULO DE IDADE
    // ===================================================================
    function calcularIdade() {
        if (!dataNascimentoInput.value) { idadeInput.value = ""; return; }
        const birthDate = new Date(dataNascimentoInput.value);
        const today = new Date();
        if (birthDate > today) {
            idadeInput.value = "";
            alert("A data de nascimento não pode ser no futuro.");
            dataNascimentoInput.value = "";
            return;
        }
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) { age--; }
        idadeInput.value = age >= 0 ? age : "";
    }
    if (dataNascimentoInput) { dataNascimentoInput.addEventListener('change', calcularIdade); dataNascimentoInput.addEventListener('blur', calcularIdade); }

    // ===================================================================
// LÓGICA DE SUBMISSÃO E VALIDAÇÃO + SALVAMENTO
// ===================================================================
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // validação visual
        let firstInvalidField = null;
        allRequiredFields.forEach((field) => {
            const isVisible = field.offsetParent !== null;
            if (isVisible && !field.checkValidity()) {
                if (!firstInvalidField) firstInvalidField = field;
                field.style.borderColor = 'var(--color-alerta)';
            } else {
                field.style.borderColor = '';
            }
        });
        if (firstInvalidField) {
            firstInvalidField.focus();
            alert('Por favor, preencha todos os campos obrigatórios visíveis.');
            return;
        }

        // helpers
        const getVal = (id) => (document.getElementById(id)?.value || '').trim();
        const getRadio = (name) => (form.querySelector(`input[name="${name}"]:checked`)?.value || '');

        const entidades = [...document.querySelectorAll('#registrosContainer .entidade-registro-block')]
            .map((block) => ({
                nome: block.querySelector('[name="entidadeNome[]"]')?.value || '',
                sigla: block.querySelector('[name="entidadeSigla[]"]')?.value || '',
                registro: block.querySelector('[name="entidadeRegistro[]"]')?.value || '',
                telefone: block.querySelector('[name="entidadeTelefone[]"]')?.value || '',
                email: block.querySelector('[name="entidadeEmail[]"]')?.value || ''
            }))
            .filter((x) => x.nome || x.sigla || x.registro);

        const aluno = {
            id: Date.now(),

            nome: getVal('nomeCompleto'),
            sexo: getRadio('sexo'),
            nomeMae: getVal('nomeMae'),
            nomePai: getVal('nomePai'),
            rg: getVal('rg'),
            cpf: getVal('cpf'),
            dataNascimento: getVal('dataNascimento'),
            idade: getVal('idade'),

            endereco: getVal('endereco'),
            complemento: getVal('complemento'),
            bairro: getVal('bairro'),
            cidade: getVal('cidade'),
            estado: getVal('estado'),
            cep: getVal('cep'),

            telefone: getVal('telefone'),
            whatsapp: getVal('whatsapp'),
            email: getVal('email'),

            fotoData: document.getElementById('photoData')?.value || null,

            esporte: getVal('arteMarcial'),
            corFaixa: getVal('corFaixa'),
            nivelFaixaBranca: getVal('nivelFaixaBranca') || null,
            anoGraduacao: getVal('anoGraduacao') || null,
            grau: getVal('grau') || null,
            nomeEquipe: getVal('nomeEquipe') || null,
            nomeProfessor: getVal('nomeProfessor') || null,
            graduacaoProfessor: getVal('graduacaoProfessor') || null,
            entidades,

            biometria: {
                peso: getVal('peso'),
                altura: getVal('altura'),
                imc: getVal('imc'),
                classificacao: document.getElementById('imcClassification')?.textContent || '',
                risco: document.getElementById('imcRisk')?.textContent || ''
            },

            contatos: [
                { nome: getVal('contato1_nome'), parentesco: getVal('contato1_parentesco'), telefone: getVal('contato1_telefone') },
                { nome: getVal('contato2_nome'), parentesco: getVal('contato2_parentesco'), telefone: getVal('contato2_telefone') }
            ].filter((c) => c.nome || c.telefone),

            parq: {
                p1: getRadio('parq1'), p2: getRadio('parq2'), p3: getRadio('parq3'), p4: getRadio('parq4'),
                p5: getRadio('parq5'), p6: getRadio('parq6'), p7: getRadio('parq7'),
                medicamento: getRadio('medicamento'),
                medicamentoDescricao: document.getElementById('medicamentoDescricao')?.value || ''
            },

            // — registro vitalício (número vem na 1ª graduação ou manualmente no admin)
            registro: { numero: null, historico: [] },

            // — status inicial
            status: 'Ativo',

            createdAt: new Date().toISOString()
        };

        // salva
        const alunos = JSON.parse(localStorage.getItem(ALUNOS_KEY) || '[]');
        alunos.push(aluno);
        localStorage.setItem(ALUNOS_KEY, JSON.stringify(alunos));

        successModalEl?.classList.remove('hidden-field');
    });

// fecha modal de sucesso
    if (successModalClose) {
        successModalClose.addEventListener('click', () => {
            successModalEl.classList.add('hidden-field');
            form.reset();
            arteMarcialSelect?.dispatchEvent(new Event('change'));
            popularEstados();
        });
    }

// 👉 FECHA O DOMContentLoaded (ADICIONE ESTA LINHA UMA ÚNICA VEZ)
});
// ===== CPF: máscara + validação + bloqueio no envio =====
(function(){
    // Pega o input CPF
    const cpfEl = document.getElementById('cpf');
    if (!cpfEl) return; // se não tiver o campo, sai sem quebrar nada

    // Cria/usa elemento de mensagem logo abaixo do input
    let msgEl = document.getElementById('cpfErro');
    if (!msgEl) {
        msgEl = document.createElement('small');
        msgEl.id = 'cpfErro';
        msgEl.className = 'erro-campo';
        msgEl.style.display = 'none';
        cpfEl.insertAdjacentElement('afterend', msgEl);
    }

    // Função de validação de CPF (sem API externa)
    function validarCPF(cpf){
        if(!cpf) return false;
        const num = String(cpf).replace(/\D/g,'');
        if (num.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(num)) return false; // todos iguais
        const calc = (b)=>{ let s=0; for (let i=0;i<b;i++) s += parseInt(num[i],10)*(b+1-i);
            const r = (s*10)%11; return r===10?0:r; };
        const d1 = calc(9), d2 = calc(10);
        return d1===parseInt(num[9],10) && d2===parseInt(num[10],10);
    }

    // Máscara enquanto digita (000.000.000-00) + feedback
    cpfEl.addEventListener('input', () => {
        const pos = cpfEl.selectionStart || 0;
        cpfEl.value = String(cpfEl.value)
            .replace(/\D/g,'')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0,14);
        cpfEl.setSelectionRange(pos, pos);

        const puro = cpfEl.value.replace(/\D/g,'');
        if (puro.length < 11) {
            // menos de 11 dígitos: some a mensagem
            msgEl.textContent = '';
            msgEl.style.display = 'none';
            cpfEl.style.borderColor = '';
            return;
        }
        const ok = validarCPF(cpfEl.value);
        if (ok) {
            msgEl.classList.remove('erro-campo');
            msgEl.classList.add('ok-campo');
            msgEl.textContent = 'CPF válido.';
            msgEl.style.display = 'block';
            cpfEl.style.borderColor = '';
        } else {
            msgEl.classList.remove('ok-campo');
            msgEl.classList.add('erro-campo');
            msgEl.textContent = 'CPF inválido. Verifique e tente novamente.';
            msgEl.style.display = 'block';
            cpfEl.style.borderColor = '#ff4d4f';
        }
    });

    // Descobrir um botão de envio (mesmo sem <form>)
    const btnEnviar = document.querySelector(
        '#btnCadastrar, button#btnCadastrar, button[name="cadastrar"], button[type="submit"], .form-actions button, .buttons-area button, .salvar, .enviar'
    );

    // Bloqueia envio no clique se CPF for inválido
    if (btnEnviar) {
        btnEnviar.addEventListener('click', function(e){
            const ok = validarCPF(cpfEl.value);
            if (!ok) {
                e.preventDefault();
                e.stopPropagation();
                msgEl.classList.remove('ok-campo');
                msgEl.classList.add('erro-campo');
                msgEl.textContent = 'CPF inválido. Verifique e tente novamente.';
                msgEl.style.display = 'block';
                cpfEl.style.borderColor = '#ff4d4f';
                cpfEl.focus();
            } else {
                // opcional: mostrar OK em verde
                msgEl.classList.remove('erro-campo');
                msgEl.classList.add('ok-campo');
                msgEl.textContent = 'CPF válido.';
                msgEl.style.display = 'block';
                cpfEl.style.borderColor = '';
            }
        }, true);
    }

    // Se existir um <form>, também intercepta o submit (cobre ambos os casos)
    const form = document.querySelector('form#formCadastro') || document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e){
            const ok = validarCPF(cpfEl.value);
            if (!ok) {
                e.preventDefault();
                e.stopPropagation();
                msgEl.classList.remove('ok-campo');
                msgEl.classList.add('erro-campo');
                msgEl.textContent = 'CPF inválido. Verifique e tente novamente.';
                msgEl.style.display = 'block';
                cpfEl.style.borderColor = '#ff4d4f';
                cpfEl.focus();
            } else {
                msgEl.classList.remove('erro-campo');
                msgEl.classList.add('ok-campo');
                msgEl.textContent = 'CPF válido.';
                msgEl.style.display = 'block';
                cpfEl.style.borderColor = '';
            }
        }, true);
    }
})();

// ====== SALVAR VIA API (substitui o localStorage) ======
async function salvarAlunoAPI(payload){
  const res = await fetch('/api/alunos', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  if(!res.ok){ const t = await res.text(); throw new Error('Falha ao salvar: ' + t); }
  return await res.json();
}

// Exemplo de uso (chame onde antes empilhava no localStorage):
// await salvarAlunoAPI({ nome, email, cpf, data_nasc });
