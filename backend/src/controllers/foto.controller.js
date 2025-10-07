import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

export const subirFoto = async (req, res) => {
  try {
    //Verifica si se recibió archivo
    if (!req.file){
      return res.status(400).json({msg:'No se recibió ninguna foto'})
    }

    console.log('Foto recibida:', req.file.originalname, 'Tamaño:', req.file.size, 'bytes'); //Log para debug

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'inventario/fotos',
          public_id: 'movimiento-${Date.now()}',
          transformation: [
            {
            width: 800,
            height: 600,
            crop: 'limit',
            quality: 'auto'
            },
            { fetch_format: 'auto'}
          ],
          upload_preset: process.env.UPLOAD_PRESET
        },
        (error, result) => {
          if (error) {
            console.error('Error en cloudinary:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    console.log('Foto subida correctamente a Cloudinary');
    console.log('URL:', result.secure_url);

    res.status(200).json({
      msg:'Foto subida exitosamente',
      foto: result.secure_url
    });
  } catch (error) {
    console.error('Error al subir foto:', error.message);
    res.status(500).json({
      msg: 'Error interno al subir foto a la nube',
      error: error.message
    });
  }
};
