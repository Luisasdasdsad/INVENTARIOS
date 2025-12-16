import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configuración para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno (asegúrate de que apunte a tu .env correcto)
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/inventario"; // Ajusta si tu URI es diferente

const runBackup = async () => {
    try {
        console.log("📦 Iniciando respaldo de base de datos...");
        
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        // Crear nombre de carpeta con la fecha y hora actual (ej: 2023-10-25_14-30-00)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('Z')[0];
        const backupPath = path.join(__dirname, '../backups', timestamp);

        // Crear la carpeta si no existe
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }

        // Obtener todas las colecciones de la base de datos
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collection of collections) {
            const name = collection.name;
            const data = await mongoose.connection.db.collection(name).find({}).toArray();
            
            // Guardar en archivo JSON
            fs.writeFileSync(
                path.join(backupPath, `${name}.json`), 
                JSON.stringify(data, null, 2)
            );
            console.log(`   📄 ${name}: ${data.length} documentos guardados.`);
        }

        console.log(`\n🎉 Respaldo completado exitosamente en:\n   ${backupPath}`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Error durante el respaldo:", error);
        process.exit(1);
    }
};

runBackup();
