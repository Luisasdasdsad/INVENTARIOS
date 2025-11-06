import express from 'express';
import { getUsuarios, updateUsuario, deleteUsuario } from '../controllers/usuario.controller.js';
import { auth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(auth);
router.use(requireRole(['admin']));

// Obtener todos los usuarios
router.get('/', getUsuarios);

// Actualizar usuario
router.put('/:id', updateUsuario);

// Eliminar usuario
router.delete('/:id', deleteUsuario);

export default router;
