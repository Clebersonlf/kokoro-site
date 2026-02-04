// ====================== Kokoro Session Timer (após login) ======================
(() => {
  // REGRA 1: só em /admin (evita rodar na home pública)
  const isAdminPath = location.pathname.startsWith('/admin');

  // REGRA 2: opcional p/ usuários logados fora de /admin (se quiser no futuro)
  // Use <body data-auth="true"> nas páginas protegidas de usuário.
  const isAuthenticatedPage =
    document.documentElement.hasAttribute?.('data-auth') ||
    document.body?.hasAttribute?.('data-auth');

  if (!isAdminPath && !isAuthenticatedPage) return;

  const LIMIT_MS = 25 * 60 * 1000;            // 25 minutos
  const STORAGE_DEADLINE = "kokoro_session_deadline";
  const POSITION = "tr";                       // top-left
  const BADGE_BG = "#f77f00";                  // laranja
  const BADGE_FG = "#0d0c0f";                  // texto escuro

  function createTimerEl() {
    const el = document.createElement("div");
    el.id = "kokoro-session-timer";
    const posMap = {
      br: { bottom: "16px", right: "16px" },
      bl: { bottom: "16px", left: "16px" },
      tr: { top: "16px", right: "16px" },
      tl: { top: "16px", left: "16px" },
    };
    const pos = posMap[POSITION] || posMap.br;

    Object.assign(el.style, {
      position:"fixed", zIndex:"9999", ...pos,
      padding:"8px 12px", borderRadius:"999px",
      fontFamily:"Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Arial, sans-serif",
      fontSize:"12px", fontWeight:"800", letterSpacing:"0.4px",
      boxShadow:"0 6px 24px rgba(0,0,0,.35)", border:"1px solid rgba(0,0,0,.2)",
      background:BADGE_BG, color:BADGE_FG,
      display:"inline-flex", alignItems:"center", gap:"8px",
      userSelect:"none", cursor:"default",
    });

    const label=document.createElement("span");
    label.textContent="Sessão:";
    label.style.opacity=".85";

    const time=document.createElement("code");
    time.id="kokoro-session-time";
    time.style.fontWeight="900";
    time.style.fontFeatureSettings="'tnum' 1, 'lnum' 1";

    el.append(label,time);
    document.body.appendChild(el);
    return time;
  }

  let intervalId;
  const fmt = (ms) => {
    const s=Math.max(0,Math.floor(ms/1000));
    const m=Math.floor(s/60);
    const r=s%60;
    return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
  };
  const getDeadline = () => {
    const raw=localStorage.getItem(STORAGE_DEADLINE);
    const num=raw?parseInt(raw,10):NaN;
    return Number.isFinite(num)?num:null;
  };
  const setDeadline = (ms=LIMIT_MS) => {
    const d=Date.now()+ms;
    localStorage.setItem(STORAGE_DEADLINE,String(d));
    return d;
  };

  function performLogout(){
    const btn=document.getElementById("btn-logout"); // usa o botão "Sair" se existir
    if(btn){ btn.click(); return; }
    try{
      localStorage.removeItem("adminSecret");
      localStorage.removeItem("kokoro_admin_secret");
      localStorage.removeItem("kkr_admin_secret");
      sessionStorage.clear();
    }catch(_){}
    alert("Sessão expirada por inatividade (25 minutos).");
    window.location.href="/";
  }

  function tick(el){
    const now=Date.now();
    const deadline=getDeadline() ?? setDeadline(LIMIT_MS);
    const remaining=deadline-now;
    el.textContent=fmt(remaining);
    if(remaining<=0){ clearInterval(intervalId); performLogout(); }
  }

  function reset(){ setDeadline(LIMIT_MS); } // zera no clique e na navegação

  document.addEventListener("DOMContentLoaded", () => {
    // Só mostra o timer se a página realmente estiver logada (tem o botão Sair)
    if (!document.getElementById("btn-logout")) return;

    // zera ao entrar em qualquer página interna
    reset();

    const timeEl = createTimerEl();
    tick(timeEl);
    clearInterval(intervalId);
    intervalId = setInterval(() => tick(timeEl), 1000);

    // zera a cada clique (atividade)
    window.addEventListener("click", reset, { passive:true });

    // sincroniza entre abas
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_DEADLINE) tick(timeEl);
    });
  });
})();
