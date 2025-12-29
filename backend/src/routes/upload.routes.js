import express from 'express';
import multer from 'multer';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10* 1024 * 1024 }
});

router.use(auth);

export default router;