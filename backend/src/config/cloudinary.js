import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

// Carga .env (si no se carga en server.js, esto lo hace aquí)
config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;