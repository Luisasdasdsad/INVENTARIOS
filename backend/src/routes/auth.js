import express from 'express';
import { register, login, validate } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

//router.post('/register', register);
router.post('/login', login);
router.get('/validate', auth, validate);

export default router;
