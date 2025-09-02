// Widget "Enviar convite" com modal (email obrigatório; telefone/nome opcionais)
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

  function makeModal() {
    const overlay = el('div',{id:'inviteOverlay',style:{
      position:'fixed',inset:'0',background:'rgba(0,0,0,.45)',display:'flex',
      alignItems:'center',justifyContent:'center',zIndex:'9999'
    }});
    const box = el('div',{style:{
      width:'min(520px,92vw)',background:'#111',color:'#eee',borderRadius:'12px',
      border:'1px solid #2a2a2a',boxShadow:'0 10px 40px rgba(0,0,0,.5)',padding:'18px'
    }});
    const title = el('div',{style:{fontSize:'18px',marginBottom:'10px',fontWeight:'600'}},['Enviar convite']);
    const hint  = el('div',{style:{fontSize:'12px',opacity:.85,marginBottom:'12px'}},
      ['Preencha os dados. O link será gerado e os atalhos (WhatsApp / Telegram / SMS / E-mail) aparecerão.']);

    const frm = el('form',{});
    const row = (label, input)=> el('div',{style:{marginBottom:'10px'}},[
      el('label',{style:{display:'block',marginBottom:'6px',fontSize:'13px'}},[label]),
      input
    ]);

    const inEmail = el('input',{type:'email',placeholder:'nome@exemplo.com',required:true,style:{
      width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #444',background:'#0b0b0b',color:'#fff'
    }});
    const inTel   = el('input',{type:'tel',placeholder:'DDI+DDD+Número (apenas dígitos, opcional)',style:{
      width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #444',background:'#0b0b0b',color:'#fff'
    }});
    const inNome  = el('input',{type:'text',placeholder:'Nome (opcional)',style:{
      width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #444',background:'#0b0b0b',color:'#fff'
    }});
    const msg     = el('div',{id:'inviteMsg',style:{minHeight:'1.2em',fontSize:'13px',marginTop:'6px',color:'#f99'}});

    const actions = el('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'8px'}});
    const btnCancel = el('button',{type:'button',textContent:'Cancelar',style:{
      padding:'8px 12px',borderRadius:'8px',border:'1px solid #444',background:'#191919',color:'#ddd',cursor:'pointer'
    }});
    const btnOk = el('button',{type:'submit',textContent:'Enviar',style:{
      padding:'8px 12px',borderRadius:'8px',border:'1px solid #2b5',background:'#184',color:'#fff',cursor:'pointer'
    }});

    actions.appendChild(btnCancel); actions.appendChild(btnOk);
    frm.append(
      row('E-mail do aluno (obrigatório):', inEmail),
      row('Telefone (opcional):', inTel),
      row('Nome (opcional):', inNome),
      msg, actions
    );
    box.append(title,hint,frm); overlay.appendChild(box);

    btnCancel.addEventListener('click',()=> overlay.remove());

    frm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      msg.style.color='#8f8'; msg.textContent='Gerando convite...';
      const email = String(inEmail.value||'').trim();
      if (!email) { msg.style.color='#f99'; msg.textContent='Informe um e-mail válido.'; return; }
      const telefone = (inTel.value||'').replace(/\D/g,'') || null;
      const nome = (inNome.value||'').trim() || null;
      try{
        const r = await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, telefone, nome, via:'email' })});
        const data = await r.json().catch(()=>({}));
        if (!r.ok || !data?.ok || !data?.link){
          msg.style.color='#f99'; msg.textContent=data?.message||'Falha ao gerar convite.'; return;
        }
        const s = data.delivery?.suggestions||{};
        const lines = [
          `Link:\n${data.link}`,
          s.whatsapp?`\nWhatsApp:\n${s.whatsapp}`:'',
          s.telegram?`\nTelegram:\n${s.telegram}`:'',
          s.sms?`\nSMS:\n${s.sms}`:'',
          s.mailto?`\nE-mail:\n${s.mailto}`:''
        ].filter(Boolean).join('\n');
        alert(lines);
        msg.style.color='#8f8'; msg.textContent='Convite gerado com sucesso.';
      }catch(err){
        msg.style.color='#f99'; msg.textContent='Erro de conexão.';
      }
    });

    return overlay;
  }

  function injectButton(){
    const anchor = document.querySelector('h1, h2, .page-title, body');
    if (!anchor || document.getElementById('btnInvite')) return;
    const bar = el('div',{style:{margin:'8px 0',display:'flex',gap:'8px',alignItems:'center'}});
    const btn = el('button',{id:'btnInvite',textContent:'📨 Enviar convite',style:{
      padding:'6px 10px',cursor:'pointer',borderRadius:'8px',border:'1px solid #444',background:'#1b1b1b',color:'#eee'
    }});
    const tip = el('span',{style:{fontSize:'12px',opacity:.8}},['(gera link + atalhos)']);
    btn.addEventListener('click',()=> document.body.appendChild(makeModal()));
    bar.append(btn,tip);
    if (anchor.parentElement) anchor.parentElement.insertBefore(bar, anchor.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',injectButton);
  else injectButton();
})();
