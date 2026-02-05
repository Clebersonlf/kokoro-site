export default function Home() {
  return (
    <main style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Planck Kokoro - Online</h1>
      <p>O site foi publicado com sucesso.</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/admin" style={{ margin: '10px', color: 'blue' }}>Painel Admin</a>
        <a href="/user/cadastro/cadastro.html" style={{ margin: '10px', color: 'blue' }}>Cadastro</a>
      </div>
    </main>
  );
}
