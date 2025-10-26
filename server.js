import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
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

// Test route
app.get("/", (req, res) => {
  res.json({ message: "🍽️ QR Food Ordering Backend is running!" });
});

// Routes
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
