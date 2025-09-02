// Fix leve: garante botão e abre o modal de convite
(function(){
  function ensureInvite(){
    // 1) Acha (ou cria) o botão
    var btn = document.querySelector("#btnInvite,[data-action=invite-open]");
    if(!btn){
      btn = document.createElement("button");
      btn.id = "btnInvite";
      btn.type = "button";
      btn.dataset.action = "invite-open";
      btn.className = "btn btn-primary kkr-invite-btn";
      btn.innerHTML = "&#128233; Enviar convite";
      var h1 = document.querySelector("h1") || document.body;
      if(h1 && h1.parentNode){
        if(h1.nextSibling) h1.parentNode.insertBefore(btn, h1.nextSibling);
        else h1.parentNode.appendChild(btn);
      } else {
        document.body.appendChild(btn);
      }
    }

    // 2) Abre o modal (usa nossa API global, com fallback por evento)
    function openModal(){
      try{
        if(window.kkrInvite && typeof window.kkrInvite.show === "function"){
          window.kkrInvite.show();
          return;
        }
      }catch(_){}
      document.dispatchEvent(new CustomEvent("kkr:invite:open"));
    }

    // 3) Clique direto + delegação
    btn.addEventListener("click", function(ev){ ev.preventDefault(); openModal(); });
    document.addEventListener("click", function(ev){
      var t = ev.target && ev.target.closest ? ev.target.closest("#btnInvite,[data-action=invite-open]") : null;
      if(t){ ev.preventDefault(); openModal(); }
    });

    // 4) CSS mínimo: afastar da lateral e do topo
    if(!document.getElementById("kkrInviteFixCSS")){
      var st = document.createElement("style");
      st.id = "kkrInviteFixCSS";
      st.textContent = ".kkr-invite-btn{margin-left:24px;margin-top:8px}";
      document.head.appendChild(st);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ensureInvite);
  } else {
    ensureInvite();
  }
  window.addEventListener("pageshow", ensureInvite);
})();
