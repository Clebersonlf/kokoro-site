# Kokoro – Auditoria de Rotas, APIs e UI

Gerado em: Mon Sep 15 19:16:39 -03 2025

## 1. Framework e libs
* name: kokoro-site
* version: 1.0.0
* next: —
* react: —
* react-dom: —
* typescript: —
* tailwind: —

## 2. Rotas
```
# Páginas (/pages) -> rotas
(sem pasta /pages)

# App Router (/app) -> rotas e handlers
(sem pasta /app)
```

## 3. Endpoints de API (com foco em financeiro)
```
# Todos
/api/_db.js
/api/admin/auth.js
/api/admin/check.js
/api/admin/env.js
/api/admin/login.js
/api/admin/ping.js
/api/admin/summary.js
/api/admin/users.js
/api/alunos.js
/api/alunos/complete.js
/api/alunos/delete.js
/api/alunos/finalizar.js
/api/alunos/get.js
/api/alunos/index.js
/api/alunos/list.js
/api/alunos/update.js
/api/auth/login.js
/api/convites/buscar.js
/api/convites/cancelar.js
/api/convites/criar.js
/api/convites/enviar-email.js
/api/convites/ping.js
/api/convites/status.js
/api/convites/ultimos.js
/api/convites/usar.js
/api/convites/validar.js
/api/db-check.js
/api/dbtest/_dbflex.js
/api/dbtest/finalizar.js
/api/email/teste.js
/api/env.js
/api/financeiro/extrato-professor.js
/api/financeiro/payouts.js
/api/financeiro/preview.js
/api/financeiro/recibo.js
/api/financeiro/recibo_email.js
/api/financeiro/recibo_sms.js
/api/financeiro/recibo_whatsapp.js
/api/financeiro/resumo.js
/api/financeiro/saldo-professor.js
/api/graduacoes/[id].js
/api/graduacoes/[id]/index.js
/api/graduacoes/index.js
/api/graduacoes/next.js
/api/health.js
/api/invite.js
/api/notify/send-template.js
/api/notify/whatsapp.js
/api/pagamentos/index.js
/api/professores/index.js
/api/rateio/index.js
/api/send-welcome.js
/api/upload-selfie.js

# Foco em /api/financeiro
— api/financeiro/extrato-professor.js
8:export default async function handler(req, res) {
9:  if (req.method !== 'GET') {
39:    // PAGOS (payouts) ao professor

— api/financeiro/payouts.js
8:export default async function handler(req, res) {
9:  if (req.method !== 'POST') {

— api/financeiro/preview.js
4:export default async function handler(req, res) {

— api/financeiro/recibo.js
86:  export default async function handler(req,res){
87:  const method = req.method;
88:  if (!['GET','POST'].includes(method)) {
93:  const src = method === 'GET' ? Object.fromEntries(new URL(req.url, `https://${req.headers.host}`).searchParams) : (req.body||{});
103:      SELECT id, nome, tipo, telefone, email, pix_chave, banco_nome, agencia, conta, favorecido_nome, doc_favorecido
134:    if (method==='POST' && !isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});
136:    return res.json({ ok:true, texto, professor: { id:p.id, nome:p.nome, email:p.email, telefone:p.telefone } });

— api/financeiro/recibo_email.js
67:  const resp = await fetch('https://api.resend.com/emails', {
68:    method: 'POST',
105:  export default async function handler(req,res){
106:  if (req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
109:  const { professor_id, valor_pago, metodo='PIX', pago_em, para_email, observacao } = req.body || {};
110:  if (!professor_id || !para_email || !(Number(valor_pago)>0)) {
111:    return res.status(400).json({ok:false,error:'professor_id, para_email e valor_pago são obrigatórios'});
143:    const envio = await sendEmail({ to: para_email, subject: 'Recibo de Repasse', text: texto });
144:    return res.json({ ok:true, email: envio, preview_texto: texto });

— api/financeiro/recibo_sms.js
17:    method: 'POST',
29:export default async function handler(req,res){
30:  if (req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
33:  const { professor_id, valor_pago, metodo='PIX', pago_em, destino_sms, observacao } = req.body || {};
34:  if (!professor_id || !destino_sms || !(Number(valor_pago)>0)) {
35:    return res.status(400).json({ok:false,error:'professor_id, destino_sms e valor_pago são obrigatórios'});
57:    const envio = await sendSMS({ to: destino_sms, body: texto });
58:    return res.json({ ok:true, sms: envio, preview_texto: texto });

— api/financeiro/recibo_whatsapp.js
66:  const from = process.env.TWILIO_FROM_WA; // tipo: whatsapp:+1xxxxxxxxxx
70:  params.append('To', `whatsapp:${to.replace(/^whatsapp:/,'')}`);
75:    method: 'POST',
110:  export default async function handler(req,res){
111:  if (req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'Method not allowed'});}
114:  const { professor_id, valor_pago, metodo='PIX', pago_em, destino_whatsapp, observacao } = req.body || {};
115:  if (!professor_id || !destino_whatsapp || !(Number(valor_pago)>0)) {
116:    return res.status(400).json({ok:false,error:'professor_id, destino_whatsapp e valor_pago são obrigatórios'});
122:      SELECT id, nome, tipo, telefone, email, pix_chave, banco_nome, agencia, conta, favorecido_nome, doc_favorecido
148:    const envio = await sendWhatsApp({ to: destino_whatsapp, body: texto });
149:    return res.json({ ok:true, whatsapp: envio, preview_texto: texto });

— api/financeiro/resumo.js
3:export default async function handler(req,res){
4:  if (req.method !== 'GET') {

— api/financeiro/saldo-professor.js
8:export default async function handler(req, res) {
9:  if (req.method !== 'GET') {

```

## 4. Botões e ações detectados
```
/admin/cadastro/editar.html:74 :: /admin/cadastro/editar.html:74:    <div class="actions">
/admin/cadastro/editar.html:75 :: Salvar
/admin/cadastro/editar.html:76 :: Excluir
/admin/cadastro/lista.html:89 :: ✉️ Enviar convite
/admin/cadastro/lista.html:128 :: Copiar link
/admin/cadastro/lista.html:129 :: Cancelar convite
/admin/cadastro/lista.html:137 :: Cancelar convite
/admin/cadastro/lista.html:139 :: /admin/cadastro/lista.html:139:    <div class="kkr-actions">
/admin/cadastro/lista.html:140 :: Cancelar
/admin/cadastro/lista.html:141 :: Gerar link + enviar
/admin/financeiro/financeiro.html:153 :: Atualizar lista de alunos
/admin/financeiro/financeiro.html:154 :: Adicionar Receita
/admin/financeiro/financeiro.html:175 :: Adicionar Despesa
/admin/financeiro/financeiro.html:338 :: Pago
/admin/financeiro/financeiro.html:339 :: Pendente
/admin/financeiro/financeiro.html:340 :: Editar
/admin/financeiro/financeiro.html:341 :: Excluir
/admin/financeiro/financeiro.html:342 :: Recibo
/admin/graduacao/editar.html:34 :: Salvar alterações
/admin/graduacao/lista.html:99 :: /admin/graduacao/lista.html:99:              <td class="actions">
/admin/graduacao/nova.html:92 :: Salvar
/admin/invite.html:40 :: /admin/invite.html:40:    <div class="actions">
/admin/invite.html:41 :: Gerar convite
/admin-status.html:22 :: Testar
/admin-status.html:29 :: Listar
/admin.bak.2025-08-28-141303/cadastro/editar.html:42 :: /admin.bak.2025-08-28-141303/cadastro/editar.html:42:    <div class="actions">
/admin.bak.2025-08-28-141303/cadastro/editar.html:43 :: Salvar
/admin.bak.2025-08-28-141303/cadastro/editar.html:44 :: Excluir
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:133 :: Atualizar lista de alunos
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:134 :: Adicionar Receita
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:155 :: Adicionar Despesa
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:323 :: Pago
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:324 :: Pendente
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:325 :: Editar
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:326 :: Excluir
/admin.bak.2025-08-28-141303/financeiro/financeiro.html:327 :: Recibo
/admin.bak.2025-08-29-152441/cadastro/editar.html:42 :: /admin.bak.2025-08-29-152441/cadastro/editar.html:42:    <div class="actions">
/admin.bak.2025-08-29-152441/cadastro/editar.html:43 :: Salvar
/admin.bak.2025-08-29-152441/cadastro/editar.html:44 :: Excluir
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:137 :: Atualizar lista de alunos
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:138 :: Adicionar Receita
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:159 :: Adicionar Despesa
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:327 :: Pago
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:328 :: Pendente
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:329 :: Editar
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:330 :: Excluir
/admin.bak.2025-08-29-152441/financeiro/financeiro.html:331 :: Recibo
/admin.bak.2025-08-29-152441/graduacao/editar.html:33 :: Salvar alterações
/admin.bak.2025-08-29-152441/graduacao/nova.html:36 :: Salvar
/admin.bak.2025-08-29-153024/cadastro/editar.html:42 :: /admin.bak.2025-08-29-153024/cadastro/editar.html:42:    <div class="actions">
/admin.bak.2025-08-29-153024/cadastro/editar.html:43 :: Salvar
/admin.bak.2025-08-29-153024/cadastro/editar.html:44 :: Excluir
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:137 :: Atualizar lista de alunos
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:138 :: Adicionar Receita
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:159 :: Adicionar Despesa
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:327 :: Pago
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:328 :: Pendente
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:329 :: Editar
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:330 :: Excluir
/admin.bak.2025-08-29-153024/financeiro/financeiro.html:331 :: Recibo
/admin.bak.2025-08-29-153024/graduacao/editar.html:33 :: Salvar alterações
/admin.bak.2025-08-29-153024/graduacao/nova.html:36 :: Salvar
/admin.bak.2025-08-30-012025/cadastro/editar.html:47 :: /admin.bak.2025-08-30-012025/cadastro/editar.html:47:    <div class="actions">
/admin.bak.2025-08-30-012025/cadastro/editar.html:48 :: Salvar
/admin.bak.2025-08-30-012025/cadastro/editar.html:49 :: Excluir
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:141 :: Atualizar lista de alunos
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:142 :: Adicionar Receita
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:163 :: Adicionar Despesa
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:331 :: Pago
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:332 :: Pendente
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:333 :: Editar
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:334 :: Excluir
/admin.bak.2025-08-30-012025/financeiro/financeiro.html:335 :: Recibo
/admin.bak.2025-08-30-012025/graduacao/editar.html:34 :: Salvar alterações
/admin.bak.2025-08-30-012025/graduacao/nova.html:71 :: Salvar
/assets/script.js:52 :: Buscar
/cadastro/continuar.html:27 :: Finalizar Cadastro
/completar-cadastro.html:118 :: /completar-cadastro.html:118:    <div class="actions">
/completar-cadastro.html:119 :: Enviar
/index.html:53 :: Login
/index.html:54 :: Cadastre-se
/index.html:55 :: Sair
/index.html:66 :: ×
/index.html:109 :: Entrar
/index.html:171 :: Cadastrar
/login.html:22 :: Login
/public/cadastro/index.html:20 :: Concluir cadastro
/public/invite-tokenonly.js:78 :: Copiar link
/public/invite-tokenonly.js:79 :: Desfazer convite
/shared/js/invite-rebuild.js:47 :: /shared/js/invite-rebuild.js:47:  btn.className='kkr-invite-btn btn-success';
/shared/js/invite-rebuild.js:62 :: ×
/shared/js/invite-rebuild.js:77 :: /shared/js/invite-rebuild.js:77:      <div class="kkr-actions">
/shared/js/invite-rebuild.js:78 :: Cancelar
/shared/js/invite-rebuild.js:79 :: Gerar link + enviar
/shared/js/invite-widget.js:62 :: Copiar
/shared/js/invite-widget.js:70 :: Fechar
/user/cadastro/cadastro.html:714 :: Abrir Câmera
/user/cadastro/cadastro.html:715 :: Tirar Foto
/user/cadastro/cadastro.html:719 :: Refazer Foto
/user/cadastro/cadastro.html:720 :: Recortar Foto
/user/cadastro/cadastro.html:786 :: + Adicionar Registro
/user/cadastro/cadastro.html:805 :: ?
/user/cadastro/cadastro.html:923 :: Cadastrar
/user/cadastro/cadastro.html:930 :: &times;
/user/cadastro/cadastro.html:984 :: Confirmar
/user/cadastro/cadastro.html:985 :: Cancelar
/user/cadastro/cadastro.html:994 :: Fechar
/user/cadastro/cadastro.html:1002 :: Entendi
/user/cadastro.bak.2025-08-28-235442/cadastro.html:714 :: Abrir Câmera
/user/cadastro.bak.2025-08-28-235442/cadastro.html:715 :: Tirar Foto
/user/cadastro.bak.2025-08-28-235442/cadastro.html:719 :: Refazer Foto
/user/cadastro.bak.2025-08-28-235442/cadastro.html:720 :: Recortar Foto
/user/cadastro.bak.2025-08-28-235442/cadastro.html:786 :: + Adicionar Registro
/user/cadastro.bak.2025-08-28-235442/cadastro.html:805 :: ?
/user/cadastro.bak.2025-08-28-235442/cadastro.html:923 :: Cadastrar
/user/cadastro.bak.2025-08-28-235442/cadastro.html:930 :: &times;
/user/cadastro.bak.2025-08-28-235442/cadastro.html:984 :: Confirmar
/user/cadastro.bak.2025-08-28-235442/cadastro.html:985 :: Cancelar
/user/cadastro.bak.2025-08-28-235442/cadastro.html:994 :: Fechar
/user/cadastro.bak.2025-08-28-235442/cadastro.html:1002 :: Entendi
/user/cadastro.bak.2025-08-29-000602/cadastro.html:714 :: Abrir Câmera
/user/cadastro.bak.2025-08-29-000602/cadastro.html:715 :: Tirar Foto
/user/cadastro.bak.2025-08-29-000602/cadastro.html:719 :: Refazer Foto
/user/cadastro.bak.2025-08-29-000602/cadastro.html:720 :: Recortar Foto
/user/cadastro.bak.2025-08-29-000602/cadastro.html:786 :: + Adicionar Registro
/user/cadastro.bak.2025-08-29-000602/cadastro.html:805 :: ?
/user/cadastro.bak.2025-08-29-000602/cadastro.html:923 :: Cadastrar
/user/cadastro.bak.2025-08-29-000602/cadastro.html:930 :: &times;
/user/cadastro.bak.2025-08-29-000602/cadastro.html:984 :: Confirmar
/user/cadastro.bak.2025-08-29-000602/cadastro.html:985 :: Cancelar
/user/cadastro.bak.2025-08-29-000602/cadastro.html:994 :: Fechar
/user/cadastro.bak.2025-08-29-000602/cadastro.html:1002 :: Entendi
/user/pages/dashboard.html:36 :: Artes Marciais
/user/pages/dashboard.html:37 :: Autodefesa
/user/pages/dashboard.html:67 :: /user/pages/dashboard.html:67:            <span class="close-button">×</span>
/user/pages/dashboard.html:74 :: ✨ Gerar Imagem com IA
/user/pages/jiujitsu.html:130 :: Verificar Resposta
/user/pages/mentoria.html:24 :: Solicitar Mentoria
/user/pages/preparacao.html:99 :: Nova Avaliação
/user/pages/preparacao.html:100 :: Carregar Avaliação Anterior
/user/pages/preparacao.html:104 :: Anamnese
/user/pages/preparacao.html:105 :: Avaliação Postural
/user/pages/preparacao.html:106 :: Antropometria
/user/pages/preparacao.html:107 :: Dobras Cutâneas
/user/pages/preparacao.html:108 :: Cardiorrespiratório
/user/pages/preparacao.html:109 :: Neuromotor
/user/pages/preparacao.html:110 :: Avaliação Nutricional
```

## 5. Dashboard Financeiro – trechos
```
----- ./admin/financeiro/financeiro.html -----
     1	<!DOCTYPE html>
     2	<html lang="pt-br">
     3	<head>
     4	    <meta charset="UTF-8" />
     5	    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     6	    <title>KOKORO 心 - Controle Financeiro (v2)</title>
     7	
     8	    <style>
     9	        :root {
    10	            --cor-fundo:#121212; --cor-container:#1a1a1a; --cor-borda:#333;
    11	            --cor-texto-principal:#f0f0f0; --cor-texto-secundario:#bdc3c7;
    12	            --cor-azul:#3498db; --cor-verde:#2ecc71; --cor-vermelho:#e74c3c;
    13	            --cor-amarelo:#f1c40f; --cor-roxo:#8e44ad; --cor-laranja:#f39c12;
    14	        }
    15	        *{box-sizing:border-box}
    16	        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji'; background:var(--cor-fundo); color:var(--cor-texto-principal); margin:0; padding:24px;}
    17	        .container{max-width:1600px;margin:auto}
    18	        h1,h2{text-align:center;color:var(--cor-azul)}
    19	        .card{background:linear-gradient(180deg,#1a1a1a,#171717); border:1px solid var(--cor-borda); padding:20px; border-radius:12px; margin-bottom:20px; box-shadow:0 8px 24px rgba(0,0,0,.25)}
    20	        .card h2{margin:0 0 12px; border-bottom:1px solid #255b7a; padding-bottom:10px}
    21	        .form-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; align-items:end}
    22	        .form-group{display:flex; flex-direction:column; gap:6px}
    23	        label{font-size:13px; color:var(--cor-texto-secundario)}
    24	        input,select{padding:11px 12px; background:#2a2a2a; color:#f0f0f0; border:1px solid #484848; border-radius:8px; font-size:15px; outline:none}
    25	        input:focus,select:focus{border-color:var(--cor-azul); box-shadow:0 0 0 3px rgba(52,152,219,.15)}
    26	        .form-actions{grid-column:1 / -1; display:flex; justify-content:flex-end; gap:10px}
    27	        .btn{border:none; padding:12px 18px; border-radius:10px; font-size:15px; cursor:pointer; transition:.18s ease}
    28	        .btn:active{transform:translateY(1px)}
    29	        .btn-principal{background:var(--cor-azul); color:#fff}
    30	        .btn-principal:hover{filter:brightness(1.05)}
    31	        .btn-ghost{background:transparent; color:#dcdcdc; border:1px solid #555}
    32	        .resumo-financeiro{display:grid; grid-template-columns:repeat(3,1fr); gap:16px; text-align:center}
    33	        .resumo-card h3{margin:0; color:var(--cor-texto-secundario); font-size:.95rem}
    34	        .resumo-card p{font-size:1.8rem; font-weight:700; margin:6px 0 0}
    35	        .colunas-horizontais{display:flex; gap:20px; align-items:stretch}
    36	        .coluna{flex:1}
    37	
    38	        table{width:100%; border-collapse:collapse; margin-top:10px}
    39	        th,td{padding:12px 14px; text-align:left; border-bottom:1px solid var(--cor-borda); vertical-align:middle}
    40	        thead th{background-color:#22313f; color:#fff; font-weight:600; letter-spacing:.3px}
    41	        tbody tr:hover{background-color:#232a34}
    42	        .valor{text-align:right; white-space:nowrap}
    43	        .receita{color:var(--cor-verde)}
    44	        .despesa{color:var(--cor-vermelho)}
    45	
    46	        .badge{display:inline-flex; align-items:center; gap:6px; font-weight:700; border-radius:999px; padding:6px 10px; font-size:12px; text-transform:uppercase; letter-spacing:.3px}
    47	        .badge.pago{background:rgba(46,204,113,.12); color:#b8f5d2; border:1px solid rgba(46,204,113,.35)}
    48	        .badge.pendente{background:rgba(241,196,15,.12); color:#f6e7a4; border:1px solid rgba(241,196,15,.35)}
    49	
    50	        .acoes{display:flex; gap:8px; flex-wrap:wrap}
    51	        .acao{border:none; padding:8px 10px; border-radius:8px; font-size:12px; color:#fff; cursor:pointer}
    52	        .acao-pagar{background:var(--cor-verde)}
    53	        .acao-pendente{background:var(--cor-amarelo); color:#222}
    54	        .acao-editar{background:var(--cor-laranja)}
    55	        .acao-excluir{background:var(--cor-vermelho)}
    56	        .acao-recibo{background:var(--cor-roxo)}
    57	
    58	        .dias-wrapper{display:flex; gap:8px; flex-wrap:wrap}
    59	        .dias-wrapper label{display:inline-flex; align-items:center; gap:6px; background:#232323; border:1px solid #3a3a3a; padding:6px 10px; border-radius:999px; color:#e5e5e5; cursor:pointer}
    60	        .dias-wrapper input{accent-color:var(--cor-azul)}
    61	
    62	        .hint{font-size:12px; color:#9aa7b5}
    63	        .linkado{display:inline-flex; align-items:center; gap:8px; font-size:12px; color:#9ad1ff}
    64	
    65	        /* Topbar: botão voltar */
    66	        .topbar{display:flex; justify-content:flex-end; padding:10px 16px}
    67	        .btn-back{
    68	            display:inline-flex; align-items:center; gap:.5rem;
    69	            padding:.55rem .9rem; background:#111827;
    70	            border:1px solid #334155; border-radius:.6rem;
    71	            color:#bfdbfe; text-decoration:none; line-height:1
    72	        }
    73	        .btn-back:hover{border-color:#3b82f6; color:#dbeafe}
    74	        .chevron{font-weight:600}
    75	    </style>
    76	
    77	    <!-- seus estilos globais (se existirem) -->
    78	    <link rel="stylesheet" href="/admin/css/linkbtn.css">
    79	    <link rel="stylesheet" href="/admin/css/btns.css">
    80	</head>
    81	<body>
    82	
    83	<!-- UM ÚNICO LINK estilizado como botão (sem <a> dentro de <a>) -->
    84	<nav class="topbar">
    85	    <a class="btn-back" href="/admin/index.html"><span class="chevron">←</span> Voltar ao Admin</a>
    86	</nav>
    87	
    88	<div class="container">
    89	    <h1>Sistema de Controle Financeiro</h1>
    90	
    91	    <div class="card resumo-financeiro">
    92	        <div class="resumo-card"><h3><span style="color:var(--cor-verde)">●</span> Total de Receitas</h3><p id="total-receitas" class="receita">R$ 0,00</p></div>
    93	        <div class="resumo-card"><h3><span style="color:var(--cor-vermelho)">●</span> Total de Despesas</h3><p id="total-despesas" class="despesa">R$ 0,00</p></div>
    94	        <div class="resumo-card"><h3><span style="color:var(--cor-azul)">●</span> Saldo Final</h3><p id="saldo-final" class="saldo">R$ 0,00</p></div>
    95	    </div>
    96	
    97	    <div class="colunas-horizontais">
    98	        <div class="coluna">
    99	            <div class="card">
   100	                <h2>Adicionar Receita</h2>
   101	                <div class="hint linkado" id="status-integracao">🔗 Não conectado ao cadastro ainda</div>
   102	                <form id="form-receita">
   103	                    <div class="form-grid">
   104	                        <div class="form-group">
   105	                            <label for="aluno-select">Aluno (do cadastro)</label>
   106	                            <select id="aluno-select"><option value="">— selecionar —</option></select>
   107	                        </div>
   108	                        <div class="form-group">
   109	                            <label for="aluno">Nome (ou sobrescrever)</label>
   110	                            <input type="text" id="aluno" placeholder="Digite manualmente se quiser" />
   111	                        </div>
   112	                        <div class="form-group">
   113	                            <label for="cpf">CPF</label>
   114	                            <input type="text" id="cpf" placeholder="Auto do cadastro, editável" />
   115	                        </div>
   116	                        <div class="form-group">
   117	                            <label for="item-receita">Item</label>
   118	                            <select id="item-receita" required>
   119	                                <option value="Mensalidade">Mensalidade</option>
   120	                                <option value="Kimono">Kimono</option>
   121	                                <option value="Faixa">Faixa</option>
   122	                                <option value="Vestuário">Vestuário</option>
   123	                                <option value="Exame de Faixa">Exame de Faixa</option>
   124	                                <option value="Certificado">Certificado</option>
   125	                                <option value="Outro">Outro</option>
   126	                            </select>
   127	                        </div>
   128	                        <div class="form-group">
   129	                            <label for="plano-2025">Plano (2025)</label>
   130	                            <select id="plano-2025">
   131	                                <option value="livre">Livre (valor manual)</option>
   132	                                <option value="2x">2025 • 2x/semana • R$ 100,00</option>
   133	                                <option value="3x">2025 • 3x/semana • R$ 150,00</option>
   134	                            </select>
   135	                        </div>
   136	                        <div class="form-group">
   137	                            <label>Dias da semana</label>
   138	                            <div class="dias-wrapper" id="dias-wrapper">
   139	                                <label><input type="checkbox" value="Seg">Seg</label>
   140	                                <label><input type="checkbox" value="Ter">Ter</label>
   141	                                <label><input type="checkbox" value="Qua">Qua</label>
   142	                                <label><input type="checkbox" value="Qui">Qui</label>
   143	                                <label><input type="checkbox" value="Sex">Sex</label>
   144	                                <label><input type="checkbox" value="Sáb">Sáb</label>
   145	                            </div>
   146	                            <div class="hint">Marque os dias da turma do aluno (opcional, fica salvo no lançamento).</div>
   147	                        </div>
   148	                        <div class="form-group">
   149	                            <label for="valor-receita">Valor (R$)</label>
   150	                            <input type="number" id="valor-receita" step="0.01" required />
   151	                        </div>
   152	                        <div class="form-actions">
   153	                            <button type="button" class="btn btn-ghost" id="btn-atualizar-alunos">Atualizar lista de alunos</button>
   154	                            <button type="submit" class="btn btn-principal">Adicionar Receita</button>
   155	                        </div>
   156	                    </div>
   157	                </form>
   158	            </div>
   159	        </div>
   160	
   161	        <div class="coluna">
   162	            <div class="card">
   163	                <h2>Adicionar Despesa</h2>
   164	                <form id="form-despesa">
   165	                    <div class="form-grid">
   166	                        <div class="form-group" style="grid-column:1 / -1">
   167	                            <label for="descricao-despesa">Descrição</label>
   168	                            <input type="text" id="descricao-despesa" required />
   169	                        </div>
   170	                        <div class="form-group">
   171	                            <label for="valor-despesa">Valor (R$)</label>
   172	                            <input type="number" id="valor-despesa" step="0.01" required />
   173	                        </div>
   174	                        <div class="form-actions">
   175	                            <button type="submit" class="btn btn-principal">Adicionar Despesa</button>
   176	                        </div>
   177	                    </div>
   178	                </form>
   179	            </div>
   180	        </div>
   181	    </div>
   182	
   183	    <div class="card">
   184	        <h2>Histórico de Lançamentos</h2>
   185	        <table>
   186	            <thead>
   187	            <tr>
   188	                <th>Data</th>
   189	                <th>Descrição / Aluno</th>
   190	                <th>Plano / Dias</th>
   191	                <th class="valor">Valor</th>
   192	                <th>Status</th>
   193	                <th>Ações</th>
   194	            </tr>
   195	            </thead>
   196	            <tbody id="tabela-lancamentos"></tbody>
   197	        </table>
   198	    </div>
   199	</div>
   200	
   201	<script>
   202	    document.addEventListener('DOMContentLoaded', () => {
   203	        const STORAGE_FIN = 'kokoro_financeiro_v2';
   204	        const STORAGE_ALUNOS_KEYS = ['kokoro_alunos','alunos','kokoro_cadastro_alunos'];
   205	
   206	        const formReceita = document.getElementById('form-receita');
   207	        const formDespesa = document.getElementById('form-despesa');
   208	        const tabelaLancamentos = document.getElementById('tabela-lancamentos');
   209	
   210	        const totalReceitasEl = document.getElementById('total-receitas');
   211	        const totalDespesasEl = document.getElementById('total-despesas');
   212	        const saldoFinalEl = document.getElementById('saldo-final');
   213	
   214	        const alunoSelect = document.getElementById('aluno-select');
   215	        const alunoInput = document.getElementById('aluno');
   216	        const cpfInput = document.getElementById('cpf');
   217	        const planoSelect = document.getElementById('plano-2025');
   218	        const valorReceitaInput = document.getElementById('valor-receita');
   219	        const diasWrapper = document.getElementById('dias-wrapper');
   220	        const itemReceita = document.getElementById('item-receita');
   221	        const btnAtualizarAlunos = document.getElementById('btn-atualizar-alunos');
   222	        const statusIntegracao = document.getElementById('status-integracao');
   223	
   224	        let lancamentos = loadLancamentos();
   225	        let nextId = lancamentos.reduce((max,l)=>Math.max(max,l.id),0)+1;
   226	
   227	        // ---- Integração com cadastro via localStorage ----
   228	        function loadAlunos(){
   229	            for(const key of STORAGE_ALUNOS_KEYS){
   230	                try{
   231	                    const raw = localStorage.getItem(key);
   232	                    if(!raw) continue;
   233	                    const data = JSON.parse(raw);
   234	                    if(Array.isArray(data) && data.length){
   235	                        return { key, alunos: normalizeAlunos(data) };
   236	                    }
   237	                }catch(e){}
   238	            }
   239	            return { key:null, alunos:[] };
```

## 6. Recibos – trechos
```
----- ./api/financeiro/recibo.js -----
     1	import { getClient } from '../../lib/db.js';
     2	function fmtDoc(s){
     3	  const raw = String(s||'').replace(/\D/g,'');
     4	  if (raw.length === 11) { // CPF
     5	    return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
     6	  }
     7	  return s || '—';
     8	}
     9	
    10	
    11	function labelTitle(p, extra){
    12	  const e = extra || {};
    13	  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
    14	  const tipoRaw  = String(e.tipo  || (p && p.tipo)  || '').toLowerCase();
    15	  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));
    16	
    17	  const deAcento = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    18	  const f = deAcento(rawFaixa);
    19	
    20	  // 0) Titular tem prioridade
    21	  if (titular) return 'Prof. Titular';
    22	
    23	  // 1) Mapa por FAIXA
    24	  // Azul / Roxa -> Mon.
    25	  if (/azul/.test(f) || /roxa?/.test(f)) return 'Mon.';
    26	
    27	  // Marrom -> Instr.
    28	  if (/marrom/.test(f)) return 'Instr.';
    29	
    30	  // Faixa Preta
    31	  if (/preta/.test(f)) {
    32	    // 3º–6º -> Prof.
    33	    if (/\b(3|3o|3º|4|4o|4º|5|5o|5º|6|6o|6º)\b/.test(f)) return 'Prof.';
    34	    // Lisa, 1º ou 2º -> Instr.
    35	    if (/lisa/.test(f) || /\b(1|1o|1º|2|2o|2º)\b/.test(f)) return 'Instr.';
    36	    return 'Instr.'; // sem grau: Instr.
    37	  }
    38	
    39	  // 7º (Vermelha e Preta) -> Mestre
    40	  if (/vermelha\s*e\s*preta/.test(f) || /\b7\b/.test(f)) return 'M.';
    41	
    42	  // 8º (Vermelha e Branca) -> Grande Mestre
    43	  if (/vermelha\s*e\s*branca/.test(f) || /\b8\b/.test(f)) return 'G.M.';
    44	
    45	  // 9º (Vermelha) -> Grão-Mestre
    46	  if (/vermelha/.test(f) && /\b9\b/.test(f)) return 'G.M.';
    47	
    48	  // 10º (Vermelha) -> Venerável Mestre
    49	  if (/vermelha/.test(f) && /\b10\b/.test(f)) return 'V.M.';
    50	
    51	  // 2) Fallback por TIPO explícito (permite exceções)
    52	  if (tipoRaw === 'monitor' || tipoRaw === 'monitora' || tipoRaw === 'monitor(a)') return 'Mon.';
    53	  if (tipoRaw.startsWith('instrut')) return 'Instr.';
    54	  if (tipoRaw.startsWith('prof'))    return 'Prof.';
    55	
    56	  // 3) Fallback geral
    57	  return 'Colaborador';
    58	}
    59	
    60	function fmt(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
    61	function isAdmin(req){const s=req.headers['x-admin-secret'];return s && s===process.env.ADMIN_SECRET;}
    62	
    63	function labelAux(p){
    64	  const tipo   = String((p && p.tipo)   || '').toLowerCase();
    65	  const faixa  = String((p && p.faixa)  || '').toLowerCase();
    66	  const titular = !!(p && (p.eh_titular || p.is_titular));
    67	
    68	  // 1) Titular tem prioridade
    69	  if (titular) return 'Prof. Titular';
    70	
    71	  // 2) Auxiliar com faixa
    72	  if (tipo === 'auxiliar') {
    73	    if (faixa === 'preta' || faixa === 'faixa preta' || faixa === 'black') {
    74	      return 'Prof. Auxiliar';
    75	    }
    76	    if (faixa === 'marrom' || faixa === 'faixa marrom' || faixa === 'brown') {
    77	      return 'Inst. Auxiliar';
    78	    }
    79	    // auxiliar sem faixa conhecida
    80	    return 'Colaborador';
    81	  }
    82	
    83	  // 3) Demais casos
    84	  return 'Colaborador';
    85	}
    86	  export default async function handler(req,res){
    87	  const method = req.method;
    88	  if (!['GET','POST'].includes(method)) {
    89	    res.setHeader('Allow','GET, POST'); return res.status(405).json({ok:false,error:'Method not allowed'});
    90	  }
    91	
    92	  // Aceita GET (query) ou POST (JSON)
    93	  const src = method === 'GET' ? Object.fromEntries(new URL(req.url, `https://${req.headers.host}`).searchParams) : (req.body||{});
    94	  const { professor_id, valor_pago, metodo='PIX', pago_em, observacao } = src;
    95	
    96	  if (!professor_id || !(Number(valor_pago)>0)) {
    97	    return res.status(400).json({ok:false,error:'professor_id e valor_pago são obrigatórios'});
    98	  }
    99	
   100	  const client = getClient(); await client.connect();
   101	  try {
   102	    const { rows: profRows } = await client.sql`
   103	      SELECT id, nome, tipo, telefone, email, pix_chave, banco_nome, agencia, conta, favorecido_nome, doc_favorecido
   104	      FROM professores WHERE id=${professor_id} LIMIT 1;`;
   105	    if (!profRows.length) return res.status(404).json({ok:false,error:'Professor não encontrado'});
   106	    const p = profRows[0];
   107	
   108	    // PIX da escola (opcional, se tiver settings)
   109	    let orgPix = '—';
   110	    try {
   111	      const { rows: set } = await client.sql`SELECT value FROM settings WHERE key='org_pix_chave' LIMIT 1;`;
   112	      orgPix = set[0]?.value || orgPix;
   113	    } catch(_) {}
   114	
   115	    const dt = pago_em ? new Date(pago_em) : new Date();
   116	    const dataBR = dt.toLocaleString('pt-BR',{ timeZone: 'America/Sao_Paulo' });
   117	
   118	    const texto = [
   119	      `*Recibo de Repasse*`,
   120	      `Colaborador: ${ String((p.nome||"")).replace(/\s*\([^)]*\)\s*$/,"").trim() } (${labelTitle(p, src)})`,
   121	      `Valor: ${fmt(valor_pago)}`,
   122	      `Método: ${metodo}`,
   123	      `Data/Hora: ${dataBR}`,
   124	      `Obs.: ${ (observacao && observacao.trim()) || ('Repasse ' + new Date(pago_em || Date.now()).toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'})) }`,
   125	      `—`,
   126	      `PIX do colaborador: ${p.pix_chave || '—'}`,
   127	      `Banco: ${p.banco_nome || '—'} / Ag.: ${p.agencia || '—'} / Conta: ${p.conta || '—'}`,
   128	      `Favorecido: ${p.favorecido_nome || "—"} (${fmtDoc(p.doc_favorecido)})`,
   129	      `—`,
   130	      `Chave PIX - Planck Kokoro: ${orgPix}`
   131	    ].filter(Boolean).join('\n');
   132	
   133	    // Se for POST e tiver admin, devolve o texto igual — (o envio automático é por outros endpoints)
   134	    if (method==='POST' && !isAdmin(req)) return res.status(401).json({ok:false,error:'unauthorized'});
   135	
   136	    return res.json({ ok:true, texto, professor: { id:p.id, nome:p.nome, email:p.email, telefone:p.telefone } });
   137	  } catch(e){
   138	    return res.status(500).json({ok:false,error:String(e)});
   139	  } finally {
   140	    await client.end();
   141	  }
   142	}

----- ./api/financeiro/recibo_email.js -----
     1	import { getClient } from '../../lib/db.js';
     2	function fmtDoc(s){
     3	  const raw = String(s||'').replace(/\D/g,'');
     4	  if (raw.length === 11) { // CPF
     5	    return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
     6	  }
     7	  return s || '—';
     8	}
     9	
    10	
    11	function labelTitle(p, extra){
    12	  const e = extra || {};
    13	  const rawFaixa = String(e.faixa || (p && p.faixa) || '').toLowerCase();
    14	  const tipoRaw  = String(e.tipo  || (p && p.tipo)  || '').toLowerCase();
    15	  const titular  = !!(e.eh_titular || e.is_titular || (p && (p.eh_titular || p.is_titular)));
    16	
    17	  const deAcento = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    18	  const f = deAcento(rawFaixa);
    19	
    20	  // 0) Titular tem prioridade
    21	  if (titular) return 'Prof. Titular';
    22	
    23	  // 1) Mapa por FAIXA
    24	  // Azul / Roxa -> Mon.
    25	  if (/azul/.test(f) || /roxa?/.test(f)) return 'Mon.';
    26	
    27	  // Marrom -> Instr.
    28	  if (/marrom/.test(f)) return 'Instr.';
    29	
    30	  // Faixa Preta
    31	  if (/preta/.test(f)) {
    32	    // 3º–6º -> Prof.
    33	    if (/\b(3|3o|3º|4|4o|4º|5|5o|5º|6|6o|6º)\b/.test(f)) return 'Prof.';
    34	    // Lisa, 1º ou 2º -> Instr.
    35	    if (/lisa/.test(f) || /\b(1|1o|1º|2|2o|2º)\b/.test(f)) return 'Instr.';
    36	    return 'Instr.'; // sem grau: Instr.
    37	  }
    38	
    39	  // 7º (Vermelha e Preta) -> Mestre
    40	  if (/vermelha\s*e\s*preta/.test(f) || /\b7\b/.test(f)) return 'M.';
    41	
    42	  // 8º (Vermelha e Branca) -> Grande Mestre
    43	  if (/vermelha\s*e\s*branca/.test(f) || /\b8\b/.test(f)) return 'G.M.';
    44	
    45	  // 9º (Vermelha) -> Grão-Mestre
    46	  if (/vermelha/.test(f) && /\b9\b/.test(f)) return 'G.M.';
    47	
    48	  // 10º (Vermelha) -> Venerável Mestre
    49	  if (/vermelha/.test(f) && /\b10\b/.test(f)) return 'V.M.';
    50	
    51	  // 2) Fallback por TIPO explícito (permite exceções)
    52	  if (tipoRaw === 'monitor' || tipoRaw === 'monitora' || tipoRaw === 'monitor(a)') return 'Mon.';
    53	  if (tipoRaw.startsWith('instrut')) return 'Instr.';
    54	  if (tipoRaw.startsWith('prof'))    return 'Prof.';
    55	
    56	  // 3) Fallback geral
    57	  return 'Colaborador';
    58	}
    59	
    60	function isAdmin(req){const s=req.headers['x-admin-secret'];return s && s===process.env.ADMIN_SECRET;}
    61	function fmt(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
    62	
    63	async function sendEmail({to, subject, text}) {
    64	  const apiKey = process.env.RESEND_API_KEY;
    65	  if(!apiKey) throw new Error('RESEND_API_KEY não configurado');
    66	
    67	  const resp = await fetch('https://api.resend.com/emails', {
    68	    method: 'POST',
    69	    headers: {'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    70	    body: JSON.stringify({
    71	      from: process.env.RESEND_FROM || 'Planck Kokoro <no-reply@planckkokoro.com>',
    72	      to: [to],
    73	      subject,
    74	      text
    75	    })
    76	  });
    77	  const data = await resp.json();
    78	  if(!resp.ok) throw new Error(`Resend erro: ${resp.status} ${JSON.stringify(data)}`);
    79	  return data;
    80	}
    81	
    82	function labelAux(p){
    83	  const tipo   = String((p && p.tipo)   || '').toLowerCase();
    84	  const faixa  = String((p && p.faixa)  || '').toLowerCase();
    85	  const titular = !!(p && (p.eh_titular || p.is_titular));
    86	
    87	  // 1) Titular tem prioridade
    88	  if (titular) return 'Prof. Titular';
    89	
    90	  // 2) Auxiliar com faixa
    91	  if (tipo === 'auxiliar') {
    92	    if (faixa === 'preta' || faixa === 'faixa preta' || faixa === 'black') {
    93	      return 'Prof. Auxiliar';
    94	    }
    95	    if (faixa === 'marrom' || faixa === 'faixa marrom' || faixa === 'brown') {
```
