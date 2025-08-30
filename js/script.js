// js/components/header.js
class HeaderComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <header>
                <nav class="main-nav">
                    <div class="logo">
                        <a href="/">
                            <span class="kanji">心</span>
                            <span>Kokoro</span>
                        </a>
                    </div>
                    <div class="nav-links">
                        <a href="/user/pages/jiujitsu.html">Jiu-Jitsu</a>
                        <a href="/user/pages/judo.html">Judô</a>
                        <a href="/user/pages/karate.html">Karatê</a>
                    </div>
                    <div class="auth-container">
                        <button id="loginBtn" class="auth-btn">
                            <i class="fas fa-user"></i> Entrar
                        </button>
                    </div>
                </nav>
            </header>
        `;
    }
}

customElements.define('header-component', HeaderComponent);