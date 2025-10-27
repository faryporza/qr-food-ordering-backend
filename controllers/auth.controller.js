import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email }, { username: email }, { email: username }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔒 SECURITY: Public registration can only create "employee" role
    // Admin and Dev users must be created by authorized users via createUser endpoint
    const user = new User({
      username,
      email,
      password,
      role: "employee", // Fixed role for public registration
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile (for authenticated users)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (admin or dev only)
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin or dev
    if (req.user.role !== "admin" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Access denied. Admin or Dev only." });
    }

    const users = await User.find().select("-password");
    
    res.json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID (admin or dev only)
export const getUserById = async (req, res) => {
  try {
    // Check if user is admin or dev
    if (req.user.role !== "admin" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Access denied. Admin or Dev only." });
    }

    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User retrieved successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user (admin or dev only, with role restrictions)
export const updateUser = async (req, res) => {
  try {
    // Check if user is admin or dev
    if (req.user.role !== "admin" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Access denied. Admin or Dev only." });
    }

    const { id } = req.params;
    const { username, email, role, password } = req.body;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 SECURITY: Role-based restrictions
    // Only dev can update to dev role
    if (role === "dev" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Only dev can assign dev role" });
    }

    // Only dev can update other dev users
    if (user.role === "dev" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Only dev can update dev users" });
    }

    // Check if username/email is already taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (admin or dev only, with restrictions)
export const deleteUser = async (req, res) => {
  try {
    // Check if user is admin or dev
    if (req.user.role !== "admin" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Access denied. Admin or Dev only." });
    }

    const { id } = req.params;

    // Prevent user from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 SECURITY: Only dev can delete dev users
    if (user.role === "dev" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Only dev can delete dev users" });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create user (admin or dev only, with role restrictions)
export const createUser = async (req, res) => {
  try {
    // Check if user is admin or dev
    if (req.user.role !== "admin" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Access denied. Admin or Dev only." });
    }

    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    // 🔒 SECURITY: Only dev can create dev users
    if (role === "dev" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Only dev can create dev users" });
    }

    // 🔒 SECURITY: Only dev can create admin users
    if (role === "admin" && req.user.role !== "dev") {
      return res.status(403).json({ message: "Only dev can create admin users" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || "employee",
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
