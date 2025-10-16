import express from 'express';
import { subirFoto } from '../controllers/foto.controller.js';  // Importa la función del controlador
import multer from 'multer';
import { auth } from '../middlewares/auth.js';

// CORREGIDO: Define fotoRouter aquí (era lo que faltaba)
const fotoRouter = express.Router();

fotoRouter.use(auth);

// Config Multer: Usa memoria (buffer) en lugar de disco – ideal para Cloudinary
const storage = multer.memoryStorage();  // CAMBIADO: No guarda en /uploads local
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024  // Max 5MB por foto
  },
  fileFilter: (req, file, cb) => {
    // Solo permite imágenes (jpg, png, webp, etc.)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});
// Ruta POST: Recibe foto como multipart/form-data, sube a Cloudinary
fotoRouter.post('/', upload.single('foto'), subirFoto);  // 'foto' es el nombre del campo en FormData del frontend

export default fotoRouter;
