import express from 'express';
import { register, login, validate } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';
import Usuario from '../models/usuario.model.js';

const router = express.Router();

// Middleware condicional para registro: sin auth si es el primer usuario, con auth si no
const conditionalAuth = async (req, res, next) => {
  try {
    const userCount = await Usuario.countDocuments();
    if (userCount === 0) {
      return next(); // Sin auth para el primer usuario
    } else {
      return auth(req, res, next); // Con auth para usuarios posteriores
    }
  } catch (error) {
    return res.status(500).json({ msg: 'Error en servidor' });
  }
};

router.post('/register', conditionalAuth, register);
router.post('/login', login);
router.get('/validate', auth, validate);

export default router;
