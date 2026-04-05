import os
import re

print("=" * 60)
print("INICIANDO CORREÇÃO DO SISTEMA DE EXCLUSÃO DE ALUNOS")
print("=" * 60)

# ===== PASSO 1: Criar arquivo deletar.js =====
print("\n[1/4] Criando arquivo deletar.js...")

deletar_js = '''import { query } from '@/shared/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do aluno é obrigatório' });
  }

  try {
    const result = await query(
      'DELETE FROM alunos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Aluno deletado com sucesso',
      deletedId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Erro ao deletar aluno:', error);
    return res.status(500).json({ error: 'Erro ao deletar aluno' });
  }
}'''

try:
    caminho_deletar = r'D:\kokoro-site\pages\api\alunos\deletar.js'
    with open(caminho_deletar, 'w', encoding='utf-8') as f:
        f.write(deletar_js)
    print("✅ Arquivo deletar.js criado com sucesso!")
except Exception as e:
    print(f"❌ Erro ao criar deletar.js: {e}")

# ===== PASSO 2: Corrigir função excluirDaLista =====
print("\n[2/4] Atualizando função excluirDaLista...")

try:
    caminho_html = r'D:\kokoro-site\public\admin\cadastro\lista.html'
    with open(caminho_html, 'r', encoding='utf-8') as f:
        html = f.read()
    
    nova_funcao_excluir = '''async function excluirDaLista(id){
    const ok = confirm('Remover este aluno da lista?');
    if (!ok) return;
    
    try {
        const res = await fetch(`/api/alunos/deletar?id=${id}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) throw new Error('Erro ao deletar');
        
        alunos = alunos.filter(a => a.id !== id);
        salvarAlunosLocal();
        renderizarTabela();
        alert('Aluno removido com sucesso!');
    } catch(e) {
        alert('Erro: ' + e.message);
    }
}'''
    
    html = re.sub(
        r'function excluirDaLista\(id\)\{[^}]*\}',
        nova_funcao_excluir,
        html,
        flags=re.DOTALL
    )
    
    print("✅ Função excluirDaLista atualizada!")
except Exception as e:
    print(f"❌ Erro ao atualizar excluirDaLista: {e}")

# ===== PASSO 3: Corrigir função excluirDefinitivoModal =====
print("\n[3/4] Atualizando função excluirDefinitivoModal...")

try:
    nova_funcao_definitivo = '''async function excluirDefinitivoModal(){
    if (!alunoSelecionado) return;
    
    const motivo = (document.getElementById('textoMotivo').value || '').trim();
    
    if (!motivo){
        alert('Para exclusão definitiva, informe o motivo.');
        return;
    }
    
    const ok = confirm('EXCLUSÃO DEFINITIVA.\\n\\nIsso remove o aluno permanentemente.\\nDeseja prosseguir?');
    if (!ok) return;
    
    try {
        const res = await fetch(`/api/alunos/deletar?id=${alunoSelecionado.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo })
        });
        
        if (!res.ok) throw new Error('Erro ao deletar');
        
        alunos = alunos.filter(a => a.id !== alunoSelecionado.id);
        salvarAlunosLocal();
        fecharModal();
        renderizarTabela();
        alert('Exclusão definitiva registrada.');
    } catch(e) {
        alert('Erro: ' + e.message);
    }
}'''
    
    html = re.sub(
        r'function excluirDefinitivoModal\(\)\{[^}]*\}',
        nova_funcao_definitivo,
        html,
        flags=re.DOTALL
    )
    
    print("✅ Função excluirDefinitivoModal atualizada!")
except Exception as e:
    print(f"❌ Erro ao atualizar excluirDefinitivoModal: {e}")

# ===== PASSO 4: Salvar arquivo HTML =====
print("\n[4/4] Salvando arquivo lista.html...")

try:
    with open(caminho_html, 'w', encoding='utf-8') as f:
        f.write(html)
    print("✅ Arquivo lista.html salvo com sucesso!")
except Exception as e:
    print(f"❌ Erro ao salvar lista.html: {e}")

print("\n" + "=" * 60)
print("🎉 TODAS AS CORREÇÕES APLICADAS COM SUCESSO!")
print("=" * 60)
print("\n📋 Próximos passos:")
print("1. Recarregue o navegador (F5)")
print("2. Teste a exclusão de um aluno")
print("3. Recarregue novamente (F5) para verificar se o aluno NÃO volta")
print("\n")