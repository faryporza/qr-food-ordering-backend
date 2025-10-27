import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import tableRoutes from "./routes/table.routes.js";
import menuItemRoutes from "./routes/menuItem.routes.js";
import pinRoutes from "./routes/pin.routes.js";
import orderRoutes from "./routes/order.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 🔒 Rate Limiting Configuration
// General API rate limiter - applies to all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login/register attempts per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful requests
});

// Extra strict limiter for registration to prevent bot spam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  message: {
    success: false,
    message: "Too many accounts created from this IP, please try again after 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "🍽️ QR Food Ordering Backend is running!" });
});

// Routes
app.use("/api/auth/login", authLimiter); // Apply auth limiter to login
app.use("/api/auth/register", registerLimiter); // Apply strict limiter to register
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tableRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/pins", pinRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkouts", checkoutRoutes);

// Server listen
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready`);
});
