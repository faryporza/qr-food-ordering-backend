import express from "express";
import { login, register, getProfile, getAllUsers, getUserById, updateUser, deleteUser, createUser } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/register - 🔒 DISABLED: Use /api/auth/users instead (admin/dev only)
// Public registration is disabled for security. Only admin/dev can create users.
// router.post("/register", register);

// GET /api/auth/user (get current user profile)
router.get("/user", authenticateToken, getProfile);

// GET /api/auth/users (get all users - admin only)
router.get("/users", authenticateToken, getAllUsers);

// POST /api/auth/users (create user - admin only)
router.post("/users", authenticateToken, createUser);

// GET /api/auth/users/:id (get user by ID - admin only)
router.get("/users/:id", authenticateToken, getUserById);

// PUT /api/auth/users/:id (update user - admin only)
router.put("/users/:id", authenticateToken, updateUser);

// DELETE /api/auth/users/:id (delete user - admin only)
router.delete("/users/:id", authenticateToken, deleteUser);

export default router;
