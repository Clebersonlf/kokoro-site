// Sistema de autenticação básico
const auth = {
    isLoggedIn: false,

    login: (username, password) => {
        // Implementar lógica de login aqui
        return new Promise((resolve, reject) => {
            // Simulação de login
            if (username && password) {
                auth.isLoggedIn = true;
                resolve('Login realizado com sucesso');
            } else {
                reject('Credenciais inválidas');
            }
        });
    },

    logout: () => {
        auth.isLoggedIn = false;
    }
};