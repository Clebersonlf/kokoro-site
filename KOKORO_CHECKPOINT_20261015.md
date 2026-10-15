# KOKORO-SITE — CHECKPOINT 15/10/2026

## Ambiente
- Projeto: /mnt/d/kokoro-site (WSL Ubuntu).
- Next.js: utilizar Webpack, nao Turbopack.
- Terminal 01: servidor de desenvolvimento.
- Terminal 02: executar um bloco por vez.
- Banco: Neon PostgreSQL.
- Manter separacao entre banco principal e banco de testes.
- Branch Neon de testes temporaria: expira em 20/10/2026.
- Nao executar migracoes ou alterar dados sem validacao.

## GitHub
- Commit dos Dashboards: aef3f11.
- Branch remota:
  checkpoint/kokoro-20261015-dashboards
- Push desse commit confirmado em 15/10/2026.
- A branch main remota ainda nao foi atualizada.
- Nao houve publicacao de producao neste checkpoint.

## Dashboard Administrativo
- Layout mobile 390x844 testado e aprovado.
- Botao do menu integrado ao cabecalho.
- Layout desktop preservado.

## Dashboard do Atleta
- Login individual do aluno testado.
- Visual azul-neon deve ser preservado.
- Ficha do Aluno aprovada visualmente.
- Oito campos e seus icones preservados.
- Icone de Faixa/Grau aprovado.
- Botao Abrir chat com balao de conversa aprovado.
- Botao Saude esportiva com coracao aprovado.
- Proximo trabalho visual: LADO ESQUERDO do Painel do Aluno.
- Comparar com o desenho original aprovado.
- Nao reconstruir o Dashboard do zero.
- Verificar posteriormente botao Editar meus dados,
  indicadores inferiores e responsividade.

## Login e seguranca
- Quatro perfis testados: admin, aluno,
  professor titular e professor auxiliar.
- Bloqueios de acesso entre perfis testados.
- Seis endpoints protegidos testados sem login: HTTP 401.
- Administrador autenticado acessou reserva de caixa
  e listagem de certificados.
- Falta concluir verificacao individual de certificados
  do aluno e demais testes autorizados.
- APIs administrativas e de seguranca possuem
  alteracoes locais ainda pendentes de commit.
- Revisar campos expostos pela validacao publica
  de certificados antes de publicar.

## Pendencias importantes
- Muitas alteracoes locais fora do commit aef3f11.
- Existem backups e arquivos temporarios nao rastreados.
- Tres arquivos .env estao preparados para exclusao
  no indice Git. Revisar antes de qualquer commit geral.
- Nunca executar git add . indiscriminadamente.
- Nao incluir credenciais, senhas ou backups em commits.
- Revisar dependencias e testar antes da producao.
- Preservar todos os Dashboards aprovados.

## Proxima sequencia
1. Preservar e revisar codigo de login e seguranca.
2. Preparar commits especificos, sem arquivos sensiveis.
3. Validar uma versao completa antes da publicacao.
4. Continuar lado esquerdo do Dashboard do Atleta.
5. Finalizar responsividade e testes pendentes.
