// Widget "Enviar convite" (modal já implementado) – estilo ajustado
(() => {
  const API = '/api/send-welcome';

  function el(tag, attrs={}, children=[]) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k==='style' && typeof v==='object') Object.assign(e.style, v);
      else if (k in e) e[k]=v; else e.setAttribute(k,v);
    });
    children.forEach(c=>e.appendChild(typeof c==='string'?document.createTextNode(c):c));
    return e;
  }

  // ... (resto do modal igual antes)

  function injectButton(){
    const anchor = document.querySelector('h1, h2, .page-title, body');
    if (!anchor || document.getElementById('btnInvite')) return;

    const bar = el('div',{style:{
      margin:'20px 0', display:'flex', gap:'12px',
      alignItems:'center', justifyContent:'flex-start'
    }});

    const btn = el('button',{id:'btnInvite',textContent:'📨 Enviar convite',style:{
      padding:'10px 18px',
      cursor:'pointer',
      borderRadius:'10px',
      border:'none',
      background:'#2563eb',   // azul (pode trocar: #10b981 verde, #dc2626 vermelho, etc.)
      color:'#fff',
      fontSize:'14px',
      fontWeight:'600',
      boxShadow:'0 2px 6px rgba(0,0,0,0.25)',
      transition:'all .2s ease'
    }});

    btn.addEventListener('mouseover',()=>{btn.style.background='#1d4ed8';});
    btn.addEventListener('mouseout', ()=>{btn.style.background='#2563eb';});

    const tip = el('span',{style:{fontSize:'12px',opacity:.75}},['(gera link + atalhos)']);
    btn.addEventListener('click',()=> document.body.appendChild(makeModal()));
    bar.append(btn,tip);

    if (anchor.parentElement) anchor.parentElement.insertBefore(bar, anchor.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',injectButton);
  else injectButton();
})();
