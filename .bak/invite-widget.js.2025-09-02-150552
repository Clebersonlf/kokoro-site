// Widget "Enviar convite" — botão estilizado + modal funcional
(() => {
  const API = '/api/send-welcome';

  // util p/ criar elementos
  function el(tag, attrs={}, children=[]) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k==='style' && v && typeof v==='object') Object.assign(e.style, v);
      else if (k in e) e[k]=v; else e.setAttribute(k,v);
    });
    children.forEach(c => e.appendChild(typeof c==='string'?document.createTextNode(c):c));
    return e;
  }

  // modal com campos
  function makeModal(){
    const overlay = el('div',{style:{
      position:'fixed', inset:'0', background:'rgba(0,0,0,.5)',
      display:'grid', placeItems:'center', zIndex: 9999
    }});

    const box = el('div',{style:{
      width:'min(520px, 92vw)', background:'#111827', color:'#e5e7eb',
      borderRadius:'12px', padding:'18px 16px', boxShadow:'0 8px 28px rgba(0,0,0,.35)',
      border:'1px solid rgba(255,255,255,.08)'
    }});

    const title = el('div',{style:{fontSize:'18px',fontWeight:'700',marginBottom:'6px'}},['Enviar convite']);
    const sub   = el('div',{style:{fontSize:'12px',opacity:.8,marginBottom:'12px'}},
                 ['Preencha os dados básicos; o aluno recebe o link para completar o cadastro.']);

    const form  = el('form');

    function row(labelTxt, inputEl){
      const L = el('label',{style:{display:'block',fontSize:'12px',opacity:.9,margin:'10px 0 4px'}},[labelTxt]);
      form.append(L, inputEl);
    }

    const inNome  = el('input',{type:'text',placeholder:'Nome do aluno',style:css.input});
    const inEmail = el('input',{type:'email',placeholder:'email@exemplo.com',style:css.input});
    const inTel   = el('input',{type:'tel',placeholder:'(DDD) 99999-9999',style:css.input});
    const inWa    = el('input',{type:'tel',placeholder:'WhatsApp/Telegram (opcional)',style:css.input});
    const inObs   = el('textarea',{placeholder:'Observações (opcional)',rows:3,style:css.textarea});

    row('Nome*', inNome);
    row('E-mail*', inEmail);
    row('Telefone', inTel);
    row('WhatsApp/Telegram', inWa);
    row('Observações', inObs);

    const msg = el('div',{id:'inviteMsg',style:{minHeight:'1.2em',marginTop:'8px',fontSize:'12px'}});
    const actions = el('div',{style:{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'14px'}});

    const btnCancel = el('button',{type:'button',textContent:'Cancelar',style:css.btnGhost});
    const btnSend   = el('button',{type:'submit',textContent:'Enviar',style:css.btnPrimary});
    actions.append(btnCancel, btnSend);

    box.append(title, sub, form, msg, actions);
    overlay.appendChild(box);

    btnCancel.onclick = () => overlay.remove();

    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const nome  = (inNome.value  || '').trim();
      const email = (inEmail.value || '').trim().toLowerCase();
      const tel   = (inTel.value   || '').trim();
      const wa    = (inWa.value    || '').trim();
      const obs   = (inObs.value   || '').trim();

      if (!nome || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
        msg.textContent = 'Preencha nome e um e-mail válido.'; msg.style.color = '#fecaca'; return;
      }

      btnSend.disabled = true; btnSend.textContent = 'Enviando...';
      msg.textContent = '';

      try{
        const r = await fetch(API, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ nome, email, telefone: tel, whatsapp: wa, observacoes: obs })
        });
        const data = await r.json().catch(()=>({}));

        if (r.ok && data && data.ok){
          msg.textContent = 'Convite gerado e enviado com sucesso.'; msg.style.color = '#bbf7d0';
          setTimeout(()=>overlay.remove(), 800);
        } else {
          msg.textContent = data && data.error ? String(data.error) : 'Falha ao enviar.';
          msg.style.color = '#fecaca';
        }
      }catch(e){
        msg.textContent = 'Erro de rede. Tente novamente.'; msg.style.color = '#fecaca';
      }finally{
        btnSend.disabled = false; btnSend.textContent = 'Enviar';
      }
    });

    return overlay;
  }

  // estilos compartilhados
  const css = {
    input: {
      width:'100%', padding:'10px 12px', borderRadius:'10px',
      border:'1px solid #374151', background:'#0b1220', color:'#e5e7eb',
      outline:'none'
    },
    textarea: {
      width:'100%', padding:'10px 12px', borderRadius:'10px',
      border:'1px solid #374151', background:'#0b1220', color:'#e5e7eb',
      outline:'none', resize:'vertical'
    },
    btnPrimary: {
      padding:'10px 18px', border:'none', borderRadius:'10px',
      background:'#2563eb', color:'#fff', cursor:'pointer', fontWeight:'700',
      boxShadow:'0 2px 6px rgba(0,0,0,.25)'
    },
    btnGhost: {
      padding:'10px 18px', border:'1px solid #334155', borderRadius:'10px',
      background:'transparent', color:'#e5e7eb', cursor:'pointer'
    }
  };

  function injectButton(){
    if (document.getElementById('btnInvite')) return;

    // barra com margem interna para afastar da lateral
    const barWrap = el('div',{style:{
      width:'100%', padding:'0 24px', margin:'20px 0 12px'
    }});
    const bar = el('div',{style:{
      display:'flex', alignItems:'center', gap:'12px', maxWidth:'1200px'
    }});
    barWrap.appendChild(bar);

    const btn = el('button',{id:'btnInvite',textContent:'📨 Enviar convite',style:{
      padding:'10px 18px', cursor:'pointer', borderRadius:'12px', border:'none',
      background:'#2563eb', color:'#fff', fontSize:'14px', fontWeight:'700',
      boxShadow:'0 2px 6px rgba(0,0,0,.25)', transition:'filter .15s ease'
    }});
    btn.onmouseover = ()=> btn.style.filter='brightness(0.95)';
    btn.onmouseout  = ()=> btn.style.filter='';

    // removi o texto "(gera link + atalhos)"
    btn.onclick = ()=> document.body.appendChild(makeModal());

    bar.appendChild(btn);

    // tenta posicionar logo abaixo do título da página
    const after = document.querySelector('h1, h2, .page-title');
    if (after && after.parentElement){
      after.parentElement.insertBefore(barWrap, after.nextSibling);
    } else {
      document.body.insertBefore(barWrap, document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
