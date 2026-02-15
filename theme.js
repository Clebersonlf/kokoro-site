// Sistema de Temas - Kokoro Admin
const TEMAS_DISPONIVEIS = {
  tactical: {
    '--bg-color': '#0A0E27',
    '--grid-color': 'rgba(255,255,255,.02)',
    '--grid-size': '50px',
    '--glass-bg': 'rgba(15,25,50,.70)',
    '--glass-border': 'rgba(255,255,255,.08)',
    '--glass-shadow': '0 8px 32px rgba(0,0,0,.3)',
    '--text-main': '#F8FAFC',
    '--text-sec': '#94A3B8',
    '--accent-green': '#4ADE80',
    '--accent-blue': '#3B82F6',
    '--accent-red': '#EF4444'
  },
  cyberpunk: {
    '--bg-color': '#000000',
    '--grid-color': 'rgba(57,255,20,.08)',
    '--grid-size': '50px',
    '--glass-bg': 'rgba(20,20,20,.80)',
    '--glass-border': 'rgba(57,255,20,.30)',
    '--glass-shadow': '0 8px 32px rgba(57,255,20,.2)',
    '--text-main': '#F8FAFC',
    '--text-sec': '#39FF14',
    '--accent-green': '#39FF14',
    '--accent-blue': '#00FFFF',
    '--accent-red': '#FF00FF'
  },
  ocean: {
    '--bg-color': '#001220',
    '--grid-color': 'rgba(96,165,250,.08)',
    '--grid-size': '50px',
    '--glass-bg': 'rgba(0,50,80,.65)',
    '--glass-border': 'rgba(96,165,250,.25)',
    '--glass-shadow': '0 8px 32px rgba(96,165,250,.2)',
    '--text-main': '#F8FAFC',
    '--text-sec': '#93C5FD',
    '--accent-green': '#4ADE80',
    '--accent-blue': '#60A5FA',
    '--accent-red': '#F43F5E'
  },
  glass: {
    '--bg-color': '#050510',
    '--grid-color': 'rgba(139,92,246,.08)',
    '--grid-size': '50px',
    '--glass-bg': 'rgba(30,20,60,.60)',
    '--glass-border': 'rgba(139,92,246,.30)',
    '--glass-shadow': '0 8px 32px rgba(139,92,246,.25)',
    '--text-main': '#FAF5FF',
    '--text-sec': '#E9D5FF',
    '--accent-green': '#A78BFA',
    '--accent-blue': '#8B5CF6',
    '--accent-red': '#EC4899'
  },
  industrial: {
    '--bg-color': '#222222',
    '--grid-color': 'rgba(255,255,255,.03)',
    '--grid-size': '10px',
    '--glass-bg': 'rgba(58,58,58,.85)',
    '--glass-border': 'rgba(26,26,26,1)',
    '--glass-shadow': 'inset 1px 1px 0 rgba(255,255,255,0.15), inset -1px -1px 0 rgba(0,0,0,0.6), 5px 5px 15px rgba(0,0,0,0.5)',
    '--text-main': '#DCDCDC',
    '--text-sec': '#888888',
    '--accent-green': '#00ff41',
    '--accent-blue': '#00eaff',
    '--accent-red': '#ff3333'
  },
  claro: {
    '--bg-color': '#F8FAFC',
    '--grid-color': 'rgba(15,23,42,.03)',
    '--grid-size': '50px',
    '--glass-bg': 'rgba(255,255,255,.85)',
    '--glass-border': 'rgba(15,23,42,.12)',
    '--glass-shadow': '0 4px 30px rgba(0,0,0,.08)',
    '--text-main': '#0F172A',
    '--text-sec': '#475569',
    '--accent-green': '#10B981',
    '--accent-blue': '#3B82F6',
    '--accent-red': '#EF4444'
  }
};

function aplicarTema(nome) {
  const tema = TEMAS_DISPONIVEIS[nome];
  if (!tema) {
    console.error('❌ Tema não encontrado:', nome);
    return;
  }

  const root = document.documentElement;
  
  // Aplicar todas as variáveis CSS
  for (const [variavel, valor] of Object.entries(tema)) {
    root.style.setProperty(variavel, valor);
  }

  // Marcar tema ativo na UI
  document.querySelectorAll('.theme-option').forEach(el => {
    el.classList.remove('active');
  });
  
  const selecionado = document.querySelector(`.theme-option[data-theme="${nome}"]`);
  if (selecionado) {
    selecionado.classList.add('active');
  }

  // Salvar preferência
  try {
    localStorage.setItem('admin_theme', nome);
    console.log('✅ Tema aplicado:', nome);
  } catch (e) {
    console.error('Erro ao salvar tema:', e);
  }
}

// Configurar botão settings
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnSettings');
  const panel = document.getElementById('settingsPanel');
  
  if (btn && panel) {
    // Remover onclick inline se existir
    btn.removeAttribute('onclick');
    
    // Adicionar event listener
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.classList.toggle('active');
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('active');
      }
    });
  }
  
  // Carregar tema salvo
  try {
    const temaSalvo = localStorage.getItem('admin_theme') || 'tactical';
    aplicarTema(temaSalvo);
  } catch (e) {
    aplicarTema('tactical');
  }
});
