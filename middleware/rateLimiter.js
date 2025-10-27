import rateLimit from "express-rate-limit";

// จำกัดการสั่งอาหารจาก IP เดียว
export const orderRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 5, // จำกัดได้สูงสุด 5 ครั้งต่อนาที
  message: {
    success: false,
    message: "Too many orders from this IP, please try again after 1 minute.",
  },
  standardHeaders: true, // แสดงข้อมูล rate-limit ใน header
  legacyHeaders: false,  // ปิด header แบบเก่า
});
