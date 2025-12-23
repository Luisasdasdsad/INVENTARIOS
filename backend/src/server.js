import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import herramientasRoutes from './routes/herramienta.routes.js';
import barcodeRoutes from './routes/barcode.routes.js';
import qrRoutes from './routes/qr.routes.js';
import authRoutes from './routes/auth.js';
import movimientoRoutes from './routes/movimientos.js';
import fotoRouter from './routes/fotos.routes.js';
import ClienteRoutes from './routes/cliente.routes.js';
import ProductoRoutes from './routes/producto.routes.js';
import CotizacionRoutes from './routes/cotizacion.routes.js';
import ordenTrabajoRoutes from './routes/ordenTrabajo.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import facturaRoutes from './routes/factura.routes.js';
import proveedorRoutes from './routes/proveedor.routes.js';
import movimientoProductoRoutes from './routes/movimientoProducto.routes.js';
import notificacionRoutes from './routes/notificacion.routes.js';
import https from 'https';
import compraRoutes from "./routes/compra.routes.js";
import uploadRoutes from './routes/upload.routes.js';
import eventoRoutes from './routes/evento.routes.js';

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
// Ruta de códigos QR
app.use("/api/qr", qrRoutes);
//Ruta de autenticación
app.use("/api/auth", authRoutes);
//Ruta de movimientos
app.use("/api/movimientos", movimientoRoutes)
//Ruta foto
app.use('/api/fotos', fotoRouter); // Monta las rutas

app.use('/api/clientes', ClienteRoutes);
app.use('/api/productos', ProductoRoutes);
app.use('/api/cotizaciones', CotizacionRoutes);

app.use("/api/ordenes-trabajo", ordenTrabajoRoutes);

app.use('/api/usuarios', usuarioRoutes);

app.use('/api/facturas', facturaRoutes);

app.use('/api/proveedores', proveedorRoutes);

app.use('/api/movimientos-productos', movimientoProductoRoutes);

app.use('/api/notificaciones', notificacionRoutes);

app.use("/api/compras", compraRoutes);

app.use('/api/upload', uploadRoutes);

app.use('/api/eventos', eventoRoutes);

// Endpoint proxy para obtener tipo de cambio (evita CORS)
app.get('/api/tipo-cambio', (req, res) => {
  https.get('https://api.apis.net.pe/v1/tipo-cambio-sunat', (resp) => {
    let data = '';
    // Un fragmento de datos ha sido recibido.
    resp.on('data', (chunk) => {
      data += chunk;
    });
    // Toda la respuesta ha sido recibida.
    resp.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Error al procesar datos de SUNAT' });
      }
    });
  }).on("error", (err) => {
    res.status(500).json({ error: "Error de conexión con SUNAT: " + err.message });
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));