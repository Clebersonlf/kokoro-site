let isCaptchaVerified = false;
let captchaId = null;

function onCaptchaSuccess(){ isCaptchaVerified = true; document.dispatchEvent(new Event('captchaStateChange')); }
function onCaptchaExpired(){ isCaptchaVerified = false; document.dispatchEvent(new Event('captchaStateChange')); }
function onCaptchaError(){ isCaptchaVerified = false; document.dispatchEvent(new Event('captchaStateChange')); }

// chamado pelo ?onload=initCaptcha no <script> do hCaptcha
function initCaptcha(){ ensureCaptchaRendered(); }

function ensureCaptchaRendered(){
  if (!window.hcaptcha) return;
  const el = document.getElementById('captchaContainer');
  if (!el) return;
  if (captchaId !== null) return; // já renderizado

  captchaId = hcaptcha.render(el, {
    sitekey: 'MINHA_SITE_KEY_AQUI',
    callback: onCaptchaSuccess,
    'expired-callback': onCaptchaExpired,
    'error-callback': onCaptchaError
  });
}

function resetCaptcha(){
  if (window.hcaptcha && captchaId !== null) { hcaptcha.reset(captchaId); }
  isCaptchaVerified = false;
  document.dispatchEvent(new Event('captchaStateChange'));
}

// Não precisamos mexer nas suas funções openModal/closeModal.
// Aqui a gente liga nos eventos do próprio modal:
document.addEventListener('DOMContentLoaded', function(){
  const registerBtn   = document.getElementById('registerBtn');
  const registerModal = document.getElementById('registerModal');
  const closeBtn      = document.querySelector('.close[data-close="registerModal"]');

  // Abriu o modal de cadastro → renderiza o captcha
  registerBtn && registerBtn.addEventListener('click', ()=> setTimeout(ensureCaptchaRendered, 0));

  // Fechou o modal por clique fora / X / ESC → reseta o captcha
  registerModal && registerModal.addEventListener('click', (e)=>{ if (e.target === registerModal) resetCaptcha(); });
  closeBtn && closeBtn.addEventListener('click', resetCaptcha);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') resetCaptcha(); });
});
