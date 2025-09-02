// /api/upload-selfie.js  (Serverless Function no Vercel)
import { put } from '@vercel/blob';

// Desliga o bodyParser padrão pra receber multipart via stream
export const config = { api: { bodyParser: false } };

// Vamos usar busboy pra ler multipart/form-data
function parseFormData(req) {
    return new Promise((resolve, reject) => {
        const Busboy = require('busboy');
        const busboy = Busboy({ headers: req.headers });
        const fields = {};
        let fileBuffer = Buffer.alloc(0);
        let filename = null;
        let mimeType = 'image/jpeg'; // padrão

        busboy.on('file', (name, file, info) => {
            filename = info?.filename || `selfie-${Date.now()}.jpg`;
            mimeType = info?.mimeType || 'image/jpeg';
            file.on('data', (data) => { fileBuffer = Buffer.concat([fileBuffer, data]); });
        });

        busboy.on('field', (name, val) => { fields[name] = val; });
        busboy.on('finish', () => resolve({ fields, fileBuffer, filename, mimeType }));
        busboy.on('error', reject);

        req.pipe(busboy);
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

    try {
        const { fields, fileBuffer, filename, mimeType } = await parseFormData(req);
        const userId = fields.userId || 'anon';

        if (!fileBuffer?.length) {
            return res.status(400).json({ ok:false, error:'Nenhum arquivo recebido' });
        }

        // Nome do arquivo no Blob (diretório por usuário)
        const blobName = `selfies/${userId}/${Date.now()}-${filename.replace(/\s+/g,'_')}`;

        // Salva no Vercel Blob (acesso privado)
        const { url } = await put(blobName, fileBuffer, {
            access: 'private',
            contentType: mimeType,
            token: process.env.BLOB_READ_WRITE_TOKEN, // precisa dessa env var
        });

        // Retorna a URL privada (guarde no seu banco) e o "path"
        return res.status(200).json({ ok:true, url, path: blobName });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok:false, error:'Falha no upload' });
    }
}
