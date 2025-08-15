<script>
    // ====== Central de numeração e placeholders ======
    (function(){
    const ALUNOS_KEY    = 'kokoro_alunos_v1';
    const REG_STATE_KEY = 'kokoro_reg_state_v1';

    function load(){ return JSON.parse(localStorage.getItem(ALUNOS_KEY)||'[]'); }
    function save(arr){ localStorage.setItem(ALUNOS_KEY, JSON.stringify(arr)); }

    function initRegState(){
    const s = JSON.parse(localStorage.getItem(REG_STATE_KEY) || 'null');
    if(!s){
    localStorage.setItem(REG_STATE_KEY, JSON.stringify({
    nextAuto: 74,              // 0074+ automático
    blocked: [[0,20],[21,73]]  // 0000–0020 (Reservado), 0021–0073 (Pendente)
}));
}
}

    // cria placeholders 0000–0020 (Reservado) e 0021–0073 (Pendente), sem duplicar
    function ensurePlaceholders(){
    initRegState();
    let alunos = load();

    const temNumero = new Set(
    alunos.map(a => a?.registro?.numero).filter(Boolean)
    );

    // 0000–0020 → Reservado
    for(let n=0; n<=20; n++){
    const num = String(n).padStart(4,'0');
    if(!temNumero.has(num)){
    alunos.push({
    id: `PL-${num}`,
    nome: '',
    email: '',
    esporte: '',
    corFaixa: '',
    status: 'Reservado',
    registro: { numero: num, historico: [] },
    createdAt: new Date().toISOString(),
    isPlaceholder: true
});
}
}

    // 0021–0073 → Pendente
    for(let n=21; n<=73; n++){
    const num = String(n).padStart(4,'0');
    if(!temNumero.has(num)){
    alunos.push({
    id: `PL-${num}`,
    nome: '',
    email: '',
    esporte: '',
    corFaixa: '',
    status: 'Pendente',
    registro: { numero: num, historico: [] },
    createdAt: new Date().toISOString(),
    isPlaceholder: true
});
}
}

    save(alunos);
}

    // expõe no global
    window.KokoroRegistro = {
    ALUNOS_KEY,
    REG_STATE_KEY,
    ensurePlaceholders
};
})();
</script>