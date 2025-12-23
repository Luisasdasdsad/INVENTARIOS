import { google } from 'googleapis';
import stream from 'stream';
import path from 'path';
import fs from 'fs';

// Configuración de autenticación
const KEYFILEPATH = path.join(process.cwd(), 'credentials.json'); // Tu archivo descargado
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

export const uploadToDrive = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No se subió ningún archivo.');

        // 1. Verificar que exista el archivo de credenciales
        if (!fs.existsSync(KEYFILEPATH)) {
            console.error('❌ ERROR: No se encuentra el archivo credentials.json en:', KEYFILEPATH);
            return res.status(500).json({ msg: 'Error de configuración: Falta credentials.json en el backend.' });
        }

        // 2. Verificar que exista el ID de la carpeta en .env
        let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!folderId) {
            console.error('❌ ERROR: No se ha definido GOOGLE_DRIVE_FOLDER_ID en el archivo .env');
            return res.status(500).json({ msg: 'Error de configuración: Falta ID de carpeta Drive en .env' });
        }
        folderId = folderId.trim(); // Eliminar espacios accidentales

        const driveService = google.drive({ version: 'v3', auth });

        // 3. Verificar acceso a la carpeta antes de intentar subir
        try {
            await driveService.files.get({
                fileId: folderId,
                supportsAllDrives: true
            });
        } catch (err) {
            console.error(`❌ ERROR PERMISOS: La cuenta de servicio no puede acceder a la carpeta ${folderId}.`);
            return res.status(500).json({ msg: 'La cuenta de servicio no tiene acceso a la carpeta. Asegúrate de compartirla (Editor) con el email del archivo credentials.json.' });
        }

        // 4. DIAGNÓSTICO: Verificar cuota de almacenamiento del robot
        try {
            const about = await driveService.about.get({ fields: 'storageQuota' });
            const limit = about.data.storageQuota.limit;
            const usage = about.data.storageQuota.usage;
            console.log(`ℹ️ INFO DRIVE: El robot ha usado ${usage} bytes de ${limit || 'ILIMITADO'}`);

            // Validación proactiva: Si el límite es 0, lanzar error controlado
            if (limit !== undefined && String(limit) === '0') {
                throw new Error('QUOTA_ZERO');
            }
        } catch (e) { 
            if (e.message === 'QUOTA_ZERO') throw e;
            console.warn('No se pudo verificar la cuota:', e.message); 
        }

        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        const fileMetadata = {
            name: req.file.originalname, // O el nombre que generaste en frontend
            parents: [folderId], 
        };

        const media = {
            mimeType: req.file.mimetype,
            body: bufferStream,
        };

        const response = await driveService.files.create({
            requestBody: fileMetadata, // CORRECCIÓN: Usar 'requestBody' en lugar de 'resource' para que lea 'parents'
            media: media,
            fields: 'id, webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        // Hacer el archivo público para lectura (opcional, si quieres que cualquiera con el link lo vea)
        await driveService.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Devolver el enlace directo
        res.json({ url: response.data.webViewLink });

    } catch (error) {
        console.error('❌ ERROR GOOGLE DRIVE:', error.message);
        // Detectar error específico de cuota/permisos
        if (error.message === 'QUOTA_ZERO' || error.message.includes('Service Accounts do not have storage quota') || error.message.includes('storage quota exceeded')) {
            return res.status(500).json({ 
                msg: 'Error de Almacenamiento: La cuenta de servicio (robot) no tiene espacio disponible.',
                detail: 'SOLUCIÓN: Ve a Google Cloud Console > Facturación y vincula una tarjeta para activar los 15GB gratuitos del robot. (El log indica límite: 0 bytes).'
            });
        }
        res.status(500).json({ msg: 'Error al subir archivo a Drive', error: error.message });
    }
};
