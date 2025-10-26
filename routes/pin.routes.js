import express from 'express';
import {
  getAllPins,
  getPinByCode,
  createPin,
  updatePinStatus,
  closeTable,
  markAsPaid,
  getActiveTables,
} from '../controllers/pin.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/pin/:pin', getPinByCode); // For customer to access via URL

// Protected routes (require authentication)
router.get('/', authenticate, getAllPins);
router.get('/active', authenticate, getActiveTables);
router.post('/', authenticate, createPin); // Open table
router.put('/:id', authenticate, updatePinStatus);
router.patch('/:id/close', authenticate, closeTable);
router.patch('/:id/paid', authenticate, markAsPaid);

export default router;
