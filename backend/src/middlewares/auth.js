import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.model.js';

// Middleware de autenticación
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Usuario.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ msg: 'Token no válido' });
    }

    req.user = user; // Adjuntar usuario completo al request
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token no válido' });
  }
};

// Middleware para verificar roles
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ msg: 'No tienes permiso para acceder a este recurso' });
    }

    next();
  };
};