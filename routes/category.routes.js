import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryVisibility
} from "../controllers/category.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes (can view categories)
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

// Protected routes (require authentication)
router.post("/categories", authenticate, createCategory);
router.put("/categories/:id", authenticate, updateCategory);
router.delete("/categories/:id", authenticate, deleteCategory);
router.patch("/categories/:id/toggle-visibility", authenticate, toggleCategoryVisibility);

export default router;
