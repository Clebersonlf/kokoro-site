document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#invite-form');
  if (!form) return;

  const outputBox = document.createElement('div');
  outputBox.id = 'invite-link-box';
  outputBox.style.marginTop = '10px';
  outputBox.style.padding = '10px';
  outputBox.style.background = '#111';
  outputBox.style.border = '1px solid #333';
  outputBox.style.borderRadius = '8px';
  outputBox.style.color = '#0f0';
  outputBox.style.fontSize = '0.9rem';
  form.appendChild(outputBox);

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.addEventListener('click', async (ev) => {
    ev.preventDefault();

    const nome  = form.querySelector('[name="nome"]').value;
    const email = form.querySelector('[name="email"]').value;

    outputBox.innerHTML = "⏳ Gerando link curto...";

    try {
      // Chama a API convites/criar
      const r = await fetch('/api/convites/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email })
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Falha API");

      const token = data.token;
      const shortUrl = `${window.location.origin}/cadastro.html?token=${token}`;

      outputBox.innerHTML = `
        <p><b>Link gerado:</b><br>
        <input type="text" value="${shortUrl}" readonly style="width:100%;padding:5px;"/></p>
        <button id="copyLink">📋 Copiar</button>
        <button id="cancelInvite">❌ Desfazer</button>
      `;

      document.querySelector('#copyLink').onclick = () => {
        navigator.clipboard.writeText(shortUrl);
        alert("Copiado!");
      };

      document.querySelector('#cancelInvite').onclick = async () => {
        await fetch('/api/convites/cancelar', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ token })
        });
        outputBox.innerHTML = "<span style='color:red'>Convite cancelado</span>";
      };
    } catch(e) {
      outputBox.innerHTML = "❌ Erro: " + e.message;
    }
  });
});
