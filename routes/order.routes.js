import express from 'express';
import {
  getAllOrders,
  getOrdersByPin,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/pin/:pin', getOrdersByPin); // Customer get their orders
router.post('/', createOrder); // Customer create order

// Protected routes (Admin & Employee)
router.get('/', authenticate, getAllOrders);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.delete('/:id', authenticate, deleteOrder);

export default router;
