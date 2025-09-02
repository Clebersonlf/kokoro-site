(function(){
  // Elementos esperados no modal
  function el(id){ return document.getElementById(id); }

  function buildInviteLink(email, nome) {
    const base = location.origin || 'https://www.planckkokoro.com';
    // Link simples para completar cadastro; pode evoluir para token depois
    const u = new URL(base + '/admin/cadastro/nova.html');
    if (email) u.searchParams.set('email', email);
    if (nome)  u.searchParams.set('nome',  nome);
    return u.toString();
  }

  async function copy(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
  }

  function normPhone(raw){
    if(!raw) return '';
    // tira tudo que não é dígito
    const d = String(raw).replace(/\D+/g,'');
    return d; // dexa só os dígitos; o wa.me aceita DDD+numero
  }

  function onSend(){
    var nome = (el('invNome')?.value || '').trim();
    var email= (el('invEmail')?.value || '').trim().toLowerCase();
    var fone = (el('invFone')?.value || '').trim();
    var app  = (el('invApp')?.value || '').trim();
    var obs  = (el('invObs')?.value || '').trim();

    // validação mínima
    if(!nome){ alert('Informe o nome.'); return; }
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert('Informe um e-mail válido.'); return; }

    const link = buildInviteLink(email, nome);
    const msg  =
`Olá ${nome}! 👋

Você foi pré-cadastrado no Kokoro. Complete seu cadastro por este link:
${link}

Dados básicos:
• E-mail: ${email}
${fone ? '• Telefone: '+fone : ''}
${app  ? '• WhatsApp/Telegram: '+app : ''}
${obs  ? '\nObs: '+obs : ''}

Qualquer dúvida, estamos à disposição.`;

    // Copia a mensagem
    copy(msg).then((ok)=>{
      // Se informou telefone, tenta abrir WhatsApp
      const d = normPhone(app || fone);
      if (d) {
        const wa = 'https://wa.me/'+d+'?text='+encodeURIComponent(msg);
        // abre em nova aba/janela (pode ser bloqueado; a cópia já garante fallback)
        window.open(wa, '_blank', 'noopener,noreferrer');
        alert('Mensagem copiada e WhatsApp aberto.\nSe não abrir, cole a mensagem manualmente.');
      } else {
        alert('Mensagem copiada para a área de transferência.\nCole no WhatsApp/Telegram/E-mail.');
      }
    });
  }

  function wire(){
    var btn = document.getElementById('invSend');
    if(!btn) return;
    btn.removeAttribute('disabled'); // habilita
    btn.addEventListener('click', function(ev){
      ev.preventDefault();
      onSend();
    }, { once:false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
