import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import herramientasRoutes from './routes/herramienta.routes.js';
import barcodeRoutes from './routes/barcode.routes.js';
import authRoutes from './routes/auth.js';
import movimientoRoutes from './routes/movimientos.js'; // Movimientos de Herramientas
import productoRoutes from './routes/producto.routes.js';
import movimientoProductoRoutes from './routes/movimientoProducto.routes.js'; // <-- NUEVO: Movimientos de Productos


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

app.use("/api/herramientas", herramientasRoutes);
app.use("/api/barcode", barcodeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/movimientos", movimientoRoutes); // Rutas para movimientos de Herramientas
app.use("/api/productos", productoRoutes);
app.use("/api/movimientos-productos", movimientoProductoRoutes); // <-- NUEVO: Rutas para movimientos de Productos

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));