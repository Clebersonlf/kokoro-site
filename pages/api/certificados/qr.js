import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const codigo = String(req.query.codigo || '').trim();
  const formato = String(req.query.formato || 'png').toLowerCase();

  if (!codigo) {
    return res.status(400).json({ error: 'Codigo do certificado nao informado' });
  }

  const baseUrl = 'https://www.planckkokoro.com';
  const link = `${baseUrl}/validar-certificado.html?codigo=${encodeURIComponent(codigo)}`;

  try {
    if (formato === 'svg') {
      const qr = QRCode.create(link, { errorCorrectionLevel: 'H' });
      const size = qr.modules.size;
      const margin = 4;
      const cell = 10;
      const total = (size + margin * 2) * cell;

      let rects = '';

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (qr.modules.get(x, y)) {
            rects += `<rect x="${(x + margin) * cell}" y="${(y + margin) * cell}" width="${cell}" height="${cell}"/>`;
          }
        }
      }

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">
<rect width="100%" height="100%" fill="#ffffff"/>
<g fill="#000000">
${rects}
</g>
</svg>`;

      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${codigo}.svg"`);
      return res.status(200).send(svg);
    }

    const buffer = await QRCode.toBuffer(link, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 1000,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${codigo}.png"`);
    return res.status(200).send(buffer);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
