document.addEventListener('DOMContentLoaded', function() {
    // ===================================================================
    // LÓGICA DE NAVEGAÇÃO PRINCIPAL E PÁGINAS
    // ===================================================================
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');
    const body = document.body;
    const todosOsTemas = ["tema-azul", "tema-verde", "tema-vermelho", "tema-cinza", "tema-laranja", "tema-roxo", "tema-azul-escuro", "tema-marrom", "tema-verde-limao", "tema-dourado", "tema-azul-petroleo", "tema-cinza-claro", "tema-cinza-escuro"];

    const dadosNuvem = {
        doutrina: [ {text: 'Uso Progressivo da Força', size: 90}, {text: 'Verbalização', size: 80}, {text: 'Controle de Contato', size: 70}, {text: 'Técnicas Subletais', size: 75}, {text: 'Força Letal', size: 65}, {text: 'Legislação', size: 85} ],
        legislacao: [ {text: 'Legítima Defesa', size: 90}, {text: 'Código Penal', size: 80}, {text: 'Uso da Força', size: 75}, {text: 'Abuso de Autoridade', size: 65}, {text: 'Direito', size: 60} ],
        regras: [ {text: 'Pontuação', size: 90}, {text: 'Vantagem', size: 80}, {text: 'Kimono', size: 70}, {text: 'Faltas', size: 75}, {text: 'Categorias', size: 60} ],
        livros: [ {text: 'Estratégia', size: 85}, {text: 'Miyamoto Musashi', size: 70}, {text: 'A Arte da Guerra', size: 90}, {text: 'Filosofia', size: 80}, {text: 'Bushido', size: 75} ],
        socorros: [ {text: 'RCP', size: 90}, {text: 'Fraturas', size: 75}, {text: 'Hemorragia', size: 80}, {text: 'Segurança', size: 85}, {text: 'Desmaio', size: 70} ],
        preparacao: [ {text: 'Força', size: 90}, {text: 'Resistência', size: 85}, {text: 'Cardio', size: 80}, {text: 'Flexibilidade', size: 75}, {text: 'Periodização', size: 70} ]
    };

    navItems.forEach(item => {
        if (!item.classList.contains('dropdown')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (item.classList.contains('active')) return;

                const pageId = item.dataset.page;
                const targetPageId = 'page-' + pageId;
                const targetTheme = 'tema-' + item.dataset.theme;
                const pageContent = document.getElementById(targetPageId);

                todosOsTemas.forEach(tema => body.classList.remove(tema));
                body.classList.add(targetTheme);

                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                if (item.closest('.dropdown')) { item.closest('.dropdown').classList.add('active'); }

                pages.forEach(page => page.classList.remove('active'));
                if (pageContent) {
                    pageContent.classList.add('active');
                    if (pageContent.classList.contains('search-page') && !pageContent.innerHTML.trim()) {
                        construirLayoutDeBusca(pageContent, pageId, item.textContent.trim());
                    }
                }
            });
        }
    });
    
    document.querySelector('.nav-item[data-page="tecnicas"]').classList.add('active');
    document.getElementById('page-tecnicas').classList.add('active');

    function construirLayoutDeBusca(pageElement, pageId, pageTitle) {
        pageElement.innerHTML = `<div class="search-page-header"><h1>${pageTitle}</h1><div class="search-bar"><input type="search" id="search-input-${pageId}" placeholder="Busque em ${pageTitle}..."><button id="search-button-${pageId}">Buscar</button></div></div><div class="search-page-content"><div class="word-cloud-container"><h3>Tópicos Populares</h3><div class="word-cloud" id="nuvem-${pageId}"></div></div><div class="results-container"><h3>Documentos</h3><div class="search-results"><p>Busque por um termo ou clique em um tópico para ver os resultados.</p></div></div></div>`;
        const searchInput = pageElement.querySelector(`#search-input-${pageId}`);
        const searchButton = pageElement.querySelector(`#search-button-${pageId}`);
        searchButton.addEventListener('click', () => { alert(`Buscando por: "${searchInput.value}"... (Funcionalidade real a ser implementada)`); });
        criarNuvem(pageId);
    }

    function criarNuvem(pageId) {
        const nuvemContainer = d3.select(`#nuvem-${pageId}`);
        if (nuvemContainer.empty() || !dadosNuvem[pageId]) {
            nuvemContainer.html("<p>Sem tópicos populares para exibir.</p>"); return;
        }
        nuvemContainer.selectAll("*").remove();
        const palavras = dadosNuvem[pageId];
        const layout = d3.layout.cloud().size([350, 300]).words(palavras.map(d => ({text: d.text, size: d.size / 2.5 + 10}))).padding(5).rotate(0).font("sans-serif").fontSize(d => d.size).on("end", draw);
        layout.start();
        function draw(words) {
            nuvemContainer.append("svg").attr("width", layout.size()[0]).attr("height", layout.size()[1]).append("g").attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text").data(words).enter().append("text").style("font-size", d => d.size + "px").style("fill", "#bdc3c7").attr("text-anchor", "middle")
                .attr("transform", d => `translate(${[d.x, d.y]})rotate(${d.rotate})`).text(d => d.text).style("cursor", "pointer")
                .on("click", (event, d) => { alert(`Busca simulada pela palavra: "${d.text}"`); });
        }
    }

    // ===================================================================
    // LÓGICA D3.JS PARA A PÁGINA DE TÉCNICAS
    // ===================================================================
    const modulos = {
        artesMarciais: { arquivo: 'dados.json', niveis: ["branca", "cinza_branca", "cinza", "cinza_preta", "amarela_branca", "amarela", "amarela_preta", "laranja_branca", "laranja", "laranja_preta", "verde_branca", "verde", "verde_preta", "azul", "roxa", "marrom", "preta_lisa", "preta_1", "preta_2", "preta_3", "preta_4", "preta_5", "preta_6", "vermelha_preta", "vermelha_branca", "vermelha_9", "vermelha_10"], chaveNivel: 'faixa' },
        autodefesa: { arquivo: 'dados_autodefesa.json', niveis: ["basico", "intermediario", "avancado"], chaveNivel: 'level' }
    };
    let moduloAtual = 'artesMarciais';
    let dadosCompletos = null;

    const btnArtesMarciais = document.getElementById("btn-artes-marciais");
    const btnAutodefesa = document.getElementById("btn-autodefesa");
    const levelSelect = document.getElementById("level-select");
    const modal = document.getElementById("modal-tecnica");
    const modalTitle = document.getElementById("modal-title");
    const modalDescription = document.getElementById("modal-description");
    const modalImage = document.getElementById("modal-image");
    const modalVideo = document.getElementById("modal-video");
    const btnGerarIA = document.getElementById("btn-gerar-ia");
    const closeButton = document.querySelector(".close-button");

    const mapaContainerEl = document.getElementById('mapa-container');
    const svg = d3.select(mapaContainerEl).append("svg").attr("width", '100%').attr("height", '100%');
    const container = svg.append("g");
    const painel = d3.select("#painel-tecnicas");
    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    svg.call(d3.zoom().on("zoom", (event) => container.attr("transform", event.transform)));

    let simulation = d3.forceSimulation();
    let linkElements, nodeElements;

    function ticked() {
        if (linkElements) {
            linkElements
                .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        }
        if (nodeElements) {
            nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);
        }
    }
    
    function inicializarSimulacao(nodesData) {
        const width = mapaContainerEl.clientWidth;
        const height = mapaContainerEl.clientHeight;
        simulation
            .nodes(nodesData)
            .force("link", d3.forceLink().id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-250))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);
    }

    function renderizarMapa(dadosFiltrados) {
        container.selectAll("*").remove();
        linkElements = container.append("g").attr("class", "links").selectAll("line")
            .data(dadosFiltrados.links).enter().append("line")
            .attr("class", "link").style("stroke", "#999").style("stroke-opacity", 0.6);
        nodeElements = container.append("g").attr("class", "nodes").selectAll("g")
            .data(dadosFiltrados.nodes).enter().append("g").attr("class", "node")
            .on("click", (e, d) => abrirModal(d)).on("mouseover", handleMouseOver).on("mouseout", handleMouseOut);
        nodeElements.append("circle").attr("r", 10).attr("fill", "#3498db");
        nodeElements.append("text").text(d => d.name).attr('x', 15).attr('y', 5)
            .style("cursor", "pointer").style("fill", "#f0f0f0")
            .style("font-size", "12px").style("text-shadow", "1px 1px 2px black");
        nodeElements.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
        simulation.force("link").links(dadosFiltrados.links);
        simulation.alpha(1).restart();
    }

    function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); if (!event.subject.dragged) { d.fx = null; d.fy = null; } }

    function abrirModal(dadosTecnica) {
        modalTitle.textContent = dadosTecnica.name;
        modalDescription.textContent = dadosTecnica.description || "Descrição não disponível.";
        modalImage.style.display = dadosTecnica.imageUrl ? "block" : "none";
        modalImage.src = dadosTecnica.imageUrl || "";
        const videoContainer = document.querySelector('.video-container');
        videoContainer.style.display = dadosTecnica.videoUrl ? "block" : "none";
        modalVideo.src = dadosTecnica.videoUrl || "";
        btnGerarIA.style.display = dadosTecnica.permiteIA ? "block" : "none";
        modal.style.display = "block";
    }

    closeButton.onclick = () => { modal.style.display = "none"; modalVideo.src = ""; }
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; modalVideo.src = ""; } }
    btnGerarIA.onclick = () => { alert("Funcionalidade de IA será implementada no futuro pelo programador."); };

    function handleMouseOver(event, d) { tooltip.transition().style("opacity", .9); tooltip.html(d.description || "Sem descrição.").style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px"); }
    function handleMouseOut() { tooltip.transition().style("opacity", 0); }

    function popularPainel(nodes, niveisPermitidos) {
        painel.html(""); 
        painel.append("h2").text("Currículo do Nível");
        const listaContainer = painel.append("div").attr("id", "lista-container");
        const tecnicasPorNivel = {};
        const chaveNivel = modulos[moduloAtual].chaveNivel;
        nodes.forEach(node => { const nivel = node[chaveNivel]; if (!tecnicasPorNivel[nivel]) tecnicasPorNivel[nivel] = []; tecnicasPorNivel[nivel].push(node); });
        niveisPermitidos.forEach(nivel => {
            if (tecnicasPorNivel[nivel]) {
                listaContainer.append("h3").text(nivel.replace(/_/g, " "));
                tecnicasPorNivel[nivel].forEach(tecnica => {
                    listaContainer.append("p").text(tecnica.name).style("cursor", "pointer")
                        .on("click", () => abrirModal(tecnica))
                        .on("mouseover", (e) => handleMouseOver(e, tecnica))
                        .on("mouseout", handleMouseOut);
                });
            }
        });
    }

    function atualizarVisualizacao() {
        if (!dadosCompletos) return;
        const nivelSelecionado = levelSelect.value;
        const ordemNiveis = modulos[moduloAtual].niveis;
        const chaveNivel = modulos[moduloAtual].chaveNivel;
        const indiceMaximo = ordemNiveis.indexOf(nivelSelecionado);
        const niveisPermitidos = ordemNiveis.slice(0, indiceMaximo + 1);
        const nosFiltrados = dadosCompletos.nodes.filter(n => niveisPermitidos.includes(n[chaveNivel]));
        const idsNosFiltrados = new Set(nosFiltrados.map(n => n.id));
        const linksFiltrados = dadosCompletos.links.filter(l => idsNosFiltrados.has(l.source.id || l.source) && idsNosFiltrados.has(l.target.id || l.target));
        const dadosParaRenderizar = { nodes: JSON.parse(JSON.stringify(nosFiltrados)), links: JSON.parse(JSON.stringify(linksFiltrados)) };
        
        inicializarSimulacao(dadosParaRenderizar.nodes);
        renderizarMapa(dadosParaRenderizar);
        popularPainel(nosFiltrados, niveisPermitidos);
    }

    function carregarModulo(nomeModulo) {
        moduloAtual = nomeModulo;
        const config = modulos[nomeModulo];
        btnArtesMarciais.classList.toggle('active', nomeModulo === 'artesMarciais');
        btnAutodefesa.classList.toggle('active', nomeModulo === 'autodefesa');
        levelSelect.innerHTML = "";
        config.niveis.forEach(nivel => {
            const option = document.createElement('option');
            option.value = nivel;
            option.textContent = nivel.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            levelSelect.appendChild(option);
        });
        d3.json(config.arquivo).then(function(data) {
            dadosCompletos = data;
            atualizarVisualizacao();
        });
    }

    levelSelect.addEventListener('change', atualizarVisualizacao);
    btnArtesMarciais.addEventListener('click', () => carregarModulo('artesMarciais'));
    btnAutodefesa.addEventListener('click', () => carregarModulo('autodefesa'));

    carregarModulo('artesMarciais');
    
});
// === CAIXA MOTIVACIONAL: 1x por dia + fechar no X ===
document.addEventListener('DOMContentLoaded', function () {
  const box = document.getElementById('motivacional');
  if (!box) return; // se a caixa não existir nesta página, sai

  // Oculta por padrão; se for o dia, mostramos de novo
  box.classList.add('hidden');

  const closeBtn = box.querySelector('.close-button');
  const jaEl = box.querySelector('.japanese-text');
  const ptEl = box.querySelector('.quote-translation');

  // Mensagens curtas (pode editar/expandir aqui)
  const mensagens = [
    { ja: '七転び八起き', pt: 'Caia sete, levante oito.' },
    { ja: '継続は力なり', pt: 'Constância é poder.' },
    { ja: '石の上にも三年', pt: 'Perseverança traz resultado.' },
    { ja: '努力は裏切らない', pt: 'Esforço não te trai.' },
    { ja: '初心忘るべからず', pt: 'Não esqueça o espírito iniciante.' },
    { ja: '日進月歩', pt: 'Avanço dia após dia.' },
    { ja: '有言実行', pt: 'Dito e feito.' },
    { ja: '心技体', pt: 'Coração, técnica e corpo.' }
  ];

  function setMensagemAleatoria() {
    const m = mensagens[Math.floor(Math.random() * mensagens.length)];
    if (jaEl) jaEl.textContent = m.ja;
    if (ptEl) ptEl.textContent = `"${m.pt}"`;
  }

  // chave de controle diário
  const STORAGE_KEY = 'kokoro_motiv_lastShown';
  const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const last = localStorage.getItem(STORAGE_KEY);

  if (last !== hoje) {
    // Ainda não mostramos hoje -> mostra e grava
    setMensagemAleatoria();
    box.classList.remove('hidden');
    localStorage.setItem(STORAGE_KEY, hoje);
  } else {
    // Já mostramos hoje -> mantém oculto
    box.classList.add('hidden');
  }

  // Fechar no X (e garante que não reapareça até amanhã)
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      box.classList.add('hidden');
      localStorage.setItem(STORAGE_KEY, hoje);
    });
  }
});
