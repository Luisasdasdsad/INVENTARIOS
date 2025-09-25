import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import herramientasRoutes from './routes/herramienta.routes.js';
import barcodeRoutes from './routes/barcode.routes.js';
import authRoutes from './routes/auth.js';
import movimientoRoutes from './routes/movimientos.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba
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

app.get('/',(resq,res)=> res.send('API Inventarios - Backend (Herramientas)'));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

