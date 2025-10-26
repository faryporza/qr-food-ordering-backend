import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply JWT middleware to all routes in this router
router.use(authenticateToken);

// Protected routes
router.get("/dashboard", (req, res) => {
  res.json({ 
    message: "Welcome to dashboard", 
    user: req.user 
  });
});

router.get("/profile", (req, res) => {
  res.json({ 
    message: "User profile", 
    user: req.user 
  });
});

export default router;
