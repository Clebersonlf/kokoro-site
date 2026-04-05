# Corrigir arquivo listar.js - Remover 'sq' e adicionar backticks

with open(r'D:\kokoro-site\pages\api\alunos\listar.js', 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Corrigir a query SQL - substituir sqSELECT por sql`SELECT
conteudo_corrigido = conteudo.replace(
    'const r=await sqSELECT id,nome,email,faixa,grau,ultima,financeiro,status,historico,numero_certificado as "numeroCertificado",observacoes FROM alunos ORDER BY nome ASC;',
    'const r = await sql`SELECT id,nome,email,faixa,grau,ultima,financeiro,status,historico,numero_certificado as "numeroCertificado",observacoes FROM alunos ORDER BY nome ASC`;'
)

with open(r'D:\kokoro-site\pages\api\alunos\listar.js', 'w', encoding='utf-8') as f:
    f.write(conteudo_corrigido)

print('✅ Arquivo listar.js corrigido com sucesso!')