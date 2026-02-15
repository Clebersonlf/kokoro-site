// Sistema de Temas - Kokoro Admin
const TEMAS_DISPONIVEIS = {
  tactical: {
    '--bg-color': '#0A0E27',
    '--grid-color': 'rgba(255,255,255,.02)',
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
    '--grid-color': 'rgba(255,255,255,.03)',
    '--glass-bg': 'rgba(20,20,20,.80)',
    '--glass-border': 'rgba(255,255,255,.10)',
    '--glass-shadow': '0 8px 32px rgba(57,255,20,.2)',
    '--text-main': '#F8FAFC',
    '--text-sec': '#94A3B8',
    '--accent-green': '#39FF14',
    '--accent-blue': '#00FFFF',
    '--accent-red': '#FF00FF'
  },
  ocean: {
    '--bg-color': '#001220',
    '--grid-color': 'rgba(255,255,255,.04)',
    '--glass-bg': 'rgba(0,50,80,.55)',
    '--glass-border': 'rgba(255,255,255,.10)',
    '--glass-shadow': '0 8px 32px rgba(96,165,250,.2)',
    '--text-main': '#F8FAFC',
    '--text-sec': '#94A3B8',
    '--accent-green': '#4ADE80',
    '--accent-blue': '#60A5FA',
    '--accent-red': '#F43F5E'
  },
  glass: {
    '--bg-color': '#050510',
    '--grid-color': 'rgba(139,92,246,.06)',
    '--glass-bg': 'rgba(30,20,60,.60)',
    '--glass-border': 'rgba(139,92,246,.30)',
    '--glass-shadow': '0 8px 32px rgba(139,92,246,.25)',
    '--text-main': '#FAF5FF',
    '--text-sec': '#E9D5FF',
    '--accent-green': '#A78BFA',
    '--accent-blue': '#8B5CF6',
    '--accent-red': '#EC4899'
  },
  claro: {
    '--bg-color': '#F8FAFC',
    '--grid-color': 'rgba(15,23,42,.03)',
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
    console.error('Tema não encontrado:', nome);
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

// Configurar botão settings original
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnSettings');
  const panel = document.getElementById('settingsPanel');
  
  if (btn && panel) {
    // Toggle painel ao clicar no botão
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isActive = panel.classList.contains('active');
      panel.classList.toggle('active');
      panel.setAttribute('aria-hidden', isActive ? 'true' : 'false');
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
      }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('active')) {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
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
