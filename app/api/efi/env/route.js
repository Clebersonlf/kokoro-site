// /app/api/efi/env/route.js
export async function GET() {
  return new Response(JSON.stringify({ ok: true, msg: "Rota /api/efi/env ativa" }), {
    headers: { "content-type": "application/json" }
  });
}
