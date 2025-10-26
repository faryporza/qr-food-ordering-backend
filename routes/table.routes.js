import express from "express";
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} from "../controllers/table.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes (can view tables)
router.get("/tables", getAllTables);
router.get("/tables/:id", getTableById);

// Protected routes (require authentication - Admin only for CUD operations)
router.post("/tables", authenticate, createTable);
router.put("/tables/:id", authenticate, updateTable);
router.delete("/tables/:id", authenticate, deleteTable);

export default router;
