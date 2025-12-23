import express from 'express';
import multer from 'multer';
import { uploadToDrive } from '../controllers/drive.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10* 1024 * 1024 }
});

router.use(auth);

router.post('/drive', upload.single('archivo'), uploadToDrive);

export default router;