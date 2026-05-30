import { Router, type Request } from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { isCloudinaryConfigured, uploadImageBuffer } from '../services/cloudinary.service.js';

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

uploadRouter.post('/image', authenticateUser, upload.single('image'), async (request, response) => {
  const uploadRequest = request as Request & { file?: Express.Multer.File };

  if (!isCloudinaryConfigured()) {
    return response.status(500).json({ message: 'Cloudinary is not configured' });
  }

  if (!uploadRequest.file) {
    return response.status(400).json({ message: 'Image file is required' });
  }

  try {
    const imageUrl = await uploadImageBuffer(uploadRequest.file.buffer, uploadRequest.file.originalname);

    return response.status(201).json({ imageUrl });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return response.status(500).json({ message: 'Failed to upload image' });
  }
});