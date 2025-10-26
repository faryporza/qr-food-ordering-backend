import express from 'express';
import {
  getCheckoutByPin,
  createCheckout,
  getAllCheckouts,
  getCheckoutById,
} from '../controllers/checkout.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ทุก route ต้องผ่าน authentication (พนักงาน/แอดมิน)
router.use(authenticate);

// ดึงสรุป checkout ก่อนชำระเงิน
router.get('/preview/:pinId', getCheckoutByPin);

// สร้าง checkout และชำระเงิน
router.post('/', createCheckout);

// ดึงประวัติ checkout ทั้งหมด
router.get('/', getAllCheckouts);

// ดึง checkout ตาม ID
router.get('/:id', getCheckoutById);

export default router;
