import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บข้อมูล user ใน request
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Optional authentication - ไม่บังคับต้องมี token
export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // เก็บข้อมูล user ถ้ามี token
    } catch (error) {
      // ถ้า token ไม่ valid ก็ข้าม ไม่ต้อง error
      req.user = null;
    }
  }

  next(); // ไม่บังคับต้องมี user
};

// Export alias for convenience
export const authenticate = authenticateToken;
