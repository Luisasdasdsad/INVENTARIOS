import express from 'express';
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
  generarCodigoBarrasProducto,
  generarCodigosBarrasMasivoProductos,
  buscarProductoPorCodigoBarras
} from '../controllers/producto.controller.js';

const router = express.Router();

// Rutas CRUD para productos
router.post('/', crearProducto);
router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);

// Rutas de código de barras para productos
router.post('/generar-barcode/:id', generarCodigoBarrasProducto);
router.post('/generar-barcode-masivo', generarCodigosBarrasMasivoProductos);
router.get('/buscar-barcode/:barcode', buscarProductoPorCodigoBarras);

export default router;