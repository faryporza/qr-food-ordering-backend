import express from 'express';
import {
  getAllOrders,
  getOrdersByPin,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/order.controller.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';


const router = express.Router();

// Public routes
router.get('/pin/:pin', getOrdersByPin); // Customer get their orders
router.post('/', orderRateLimiter, createOrder); // Customer create order (rate limited)

// Protected routes (Admin & Employee)
router.get('/', authenticate, getAllOrders);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.delete('/:id', authenticate, deleteOrder);

export default router;
