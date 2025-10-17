import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import herramientasRoutes from './routes/herramienta.routes.js';
import barcodeRoutes from './routes/barcode.routes.js';
import authRoutes from './routes/auth.js';
<<<<<<< HEAD
import movimientoRoutes from './routes/movimientos.js'; // Movimientos de Herramientas
import productoRoutes from './routes/producto.routes.js';
import movimientoProductoRoutes from './routes/movimientoProducto.routes.js'; // <-- NUEVO: Movimientos de Productos

=======
import movimientoRoutes from './routes/movimientos.js';
import fotoRouter from './routes/fotos.routes.js';
import path from 'path';
>>>>>>> 9a5119de10d4f228053212b90cdb27f36c2c2b9e

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

// Ruta de herramientas
app.use("/api/herramientas",herramientasRoutes);
// Ruta de códigos de barras
app.use("/api/barcode", barcodeRoutes); 
//Ruta de autenticación
app.use("/api/auth", authRoutes);
//Ruta de movimientos
app.use("/api/movimientos", movimientoRoutes)
//Ruta foto
app.use(' /uploads', express.static(path.join(process.cwd(), 'uploads'))); // Servir archivos estáticos
app.use('/api/fotos', fotoRouter); // Monta las rutas


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));