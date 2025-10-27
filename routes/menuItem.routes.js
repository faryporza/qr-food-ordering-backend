import express from 'express';
import multer from 'multer';
import {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleVisibility,
  deleteMenuItem,
  uploadImage,
} from '../controllers/menuItem.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น'), false);
    }
  },
});

// Public routes (with optional auth to support both customer and admin/employee)
router.get('/', optionalAuth, getAllMenuItems);
router.get('/:id', getMenuItemById);

// Protected routes (require authentication)
router.post('/', authenticate, createMenuItem);
router.put('/:id', authenticate, updateMenuItem);
router.patch('/:id/toggle-visibility', authenticate, toggleVisibility);
router.delete('/:id', authenticate, deleteMenuItem);

// Image upload route
router.post('/upload-image', authenticate, upload.single('image'), uploadImage);

export default router;
