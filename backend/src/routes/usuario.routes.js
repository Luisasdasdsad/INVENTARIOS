import express from 'express';
import { getUsuarios, updateUsuario, deleteUsuario, updateUserRole } from '../controllers/usuario.controller.js';
import { auth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas de usuarios requieren autenticación
router.use(auth);

// Obtener todos los usuarios (admin y superadmin)
router.get('/', requireRole(['admin', 'superadmin']), getUsuarios);

// Actualizar usuario (admin y superadmin)
router.put('/:id', requireRole(['admin', 'superadmin']), updateUsuario);

// Actualizar solo el rol de un usuario (superadmin only)
router.put('/:id/rol', requireRole(['superadmin']), updateUserRole);

// Eliminar usuario (admin y superadmin)
router.delete('/:id', requireRole(['admin', 'superadmin']), deleteUsuario);

export default router;
