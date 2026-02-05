// Funções utilitárias
const utils = {
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    },

    scrollToTop: () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

    toggleTheme: () => {
        document.body.classList.toggle('dark-theme');
    }
};