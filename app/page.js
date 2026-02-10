'use client';

import Link from 'next/link';

export default function HomePage() {
  // 🔗 CONFIGURE SEUS LINKS AQUI:
  const socialLinks = {
    instagram: "https://instagram.com/suaacademia",
    facebook: "https://facebook.com/suaacademia",
    youtube: "https://youtube.com/@suaacademia",
    whatsapp: "https://wa.me/5531999999999"
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div className="logo-center">
            <div className="logo-text">KOKORO</div>
            <div className="kokoro-symbol">心</div>
          </div>
          <div className="auth-buttons">
            <a href="/login.html" className="btn btn-outline">Login</a>
            <a href="/completar-cadastro.html" className="btn btn-filled">Cadastre-se</a>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="quote-box">
          <div className="japanese-text">七転び八起き</div>
          <div className="translation">"Caia sete vezes, levante-se oito"</div>
        </div>

        <div className="cards-container">
          <div className="card">
            <h3>Treine com os Melhores</h3>
            <p>Instrutores certificados e metodologia exclusiva</p>
          </div>

          <div className="card">
            <h3>Conteúdo Exclusivo</h3>
            <p>Acesso a vídeos, apostilas e material didático</p>
          </div>

          <div className="card">
            <h3>Mentoria</h3>
            <p>Mentorias presenciais ou virtuais com profissionais experientes.</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="social-icons">
          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="white"/>
            </svg>
          </a>

          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
            </svg>
          </a>

          <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
            </svg>
          </a>

          <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="white"/>
            </svg>
          </a>
        </div>
      </footer>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          background-color: #000000 !important;
          overflow-x: hidden;
        }

        body {
          background-color: #000000 !important;
          overflow-x: hidden;
        }
      `}</style>

      <style jsx>{`
        .container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: #000000;
          color: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          padding: 18px 36px;
          background-color: #000000;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-center {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #ffffff;
        }

        .kokoro-symbol {
          font-size: 34px;
          font-weight: 300;
          color: #ffffff;
        }

        .auth-buttons {
          display: flex;
          gap: 10px;
          position: absolute;
          right: 36px;
        }

        .btn {
          padding: 7px 18px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 5px;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
          display: inline-block;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
          background-color: transparent;
          color: #ffffff !important;
        }

        .btn:link, .btn:visited {
          color: #ffffff !important;
          text-decoration: none !important;
        }

        .btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.8);
        }

        .btn-outline {
          border-color: rgba(255, 255, 255, 0.5);
        }

        .btn-filled {
          border-color: rgba(255, 255, 255, 0.7);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .btn-filled:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 35px 25px;
          gap: 35px;
        }

        .quote-box {
          background-color: rgba(26, 26, 26, 0.5);
          border-radius: 8px;
          padding: 20px 35px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.04);
          max-width: 450px;
        }

        .japanese-text {
          font-size: 20px;
          margin-bottom: 7px;
          font-weight: 400;
          letter-spacing: 1.5px;
          color: #ffffff;
        }

        .translation {
          font-size: 12px;
          font-style: italic;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.2px;
        }

        .cards-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 850px;
          width: 100%;
        }

        .card {
          background-color: #1a1a1a;
          border-radius: 7px;
          padding: 22px 18px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.3s ease;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .card h3 {
          font-size: 15px;
          margin-bottom: 8px;
          font-weight: 600;
          letter-spacing: 0.1px;
          color: #ffffff;
        }

        .card p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.4;
          letter-spacing: 0.05px;
        }

        .footer {
          padding: 26px;
          text-align: center;
          background-color: #000000;
        }

        .social-icons {
          display: flex;
          gap: 22px;
          justify-content: center;
          align-items: center;
        }

        .social-icons a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .social-icons a:hover {
          transform: scale(1.1);
          opacity: 1;
        }

        .social-icons svg {
          display: block;
        }

        @media (max-width: 1024px) {
          .cards-container {
            grid-template-columns: 1fr;
            max-width: 350px;
          }

          .auth-buttons {
            position: static;
            margin-top: 12px;
          }

          .header-content {
            flex-direction: column;
          }

          .logo-center {
            margin-bottom: 12px;
          }
        }

        @media (max-width: 768px) {
          .logo-text {
            font-size: 22px;
          }

          .kokoro-symbol {
            font-size: 30px;
          }

          .quote-box {
            padding: 18px 28px;
          }

          .japanese-text {
            font-size: 18px;
          }

          .social-icons svg {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
}
