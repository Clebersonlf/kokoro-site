// login.client.js (FRONTEND - roda no navegador)
const form = document.getElementById("f");
const showErr = (m) => { const el = document.getElementById("err"); if (el) el.textContent = m || ""; };

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  showErr("");

  const email = document.getElementById("email")?.value?.trim();
  const senha = document.getElementById("senha")?.value;
  const token = document.querySelector("[name='h-captcha-response']")?.value || "";

  if (!email || !senha) { showErr("Informe email e senha."); return; }
  if (!token) { showErr("Confirme o hCaptcha antes de entrar."); return; }

  try {
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha, hcaptchaToken: token })
    });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data.ok) {
      showErr(data.error || `Erro ${resp.status}`);
      return;
    }
    // sucesso ? redireciona
    window.location.href = "/admin.html";
  } catch (err) {
    console.error(err);
    showErr("Falha de rede/servidor.");
  }
});