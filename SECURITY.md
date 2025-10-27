# 🔒 Security Guide - QR Food Ordering System

## Overview
This document outlines the security features implemented in the backend API to protect against unauthorized access and abuse.

---

## 🛡️ Role-Based Access Control (RBAC)

### User Roles

| Role | Description | Can Create | Can Manage |
|------|-------------|------------|------------|
| **employee** | Regular staff member | ❌ Cannot create users | ✅ Take orders, checkout |
| **admin** | System administrator | ✅ Create employees only | ✅ Manage users, menus, tables |
| **dev** | Developer/Super admin | ✅ Create all roles | ✅ Full system access |

### Permission Matrix

| Action | Employee | Admin | Dev |
|--------|----------|-------|-----|
| View users | ❌ | ✅ | ✅ |
| Create employee | ❌ | ❌ | ✅ |
| Create admin | ❌ | ❌ | ✅ |
| Create dev | ❌ | ❌ | ✅ |
| Update employee | ❌ | ✅ | ✅ |
| Update admin | ❌ | ❌ | ✅ |
| Update dev | ❌ | ❌ | ✅ |
| Delete employee | ❌ | ✅ | ✅ |
| Delete admin | ❌ | ❌ | ✅ |
| Delete dev | ❌ | ❌ | ✅ |

---

## 🚫 Registration Security

### Public Registration (`POST /api/auth/register`)
- ✅ **Open to public** (no authentication required)
- ⚠️ **Restricted to employee role only**
- ❌ **Cannot specify role** in request body
- 🔒 **Rate limited**: Max 5 registrations per IP per hour

**Request Example:**
```json
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
  // role is automatically set to "employee"
}
```

### Admin/Dev Creation (`POST /api/protected/users`)
- 🔐 **Requires authentication** (JWT token)
- 👤 **Only dev can create admin/dev users**
- 📋 **Validation**: Username, email, password required

**Request Example:**
```json
POST /api/protected/users
Headers: { Authorization: "Bearer <dev-token>" }
{
  "username": "super_admin",
  "email": "admin@example.com",
  "password": "strongPassword456",
  "role": "admin" // Only dev can set this
}
```

---

## ⏱️ Rate Limiting

### General API Limit
- **Window**: 15 minutes
- **Max requests**: 100 per IP
- **Applies to**: All API endpoints

### Authentication Endpoints
- **Window**: 15 minutes  
- **Max requests**: 20 per IP
- **Applies to**: `/api/auth/login`

### Registration Endpoint
- **Window**: 1 hour
- **Max requests**: 5 per IP
- **Applies to**: `/api/auth/register`

**Rate Limit Response:**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## 🔑 Password Security

### Hashing
- **Algorithm**: bcryptjs
- **Salt rounds**: 12
- **Auto-hashing**: Pre-save middleware in User model

### Password Requirements
- ✅ Minimum length: 6 characters
- ⚠️ Recommendation: Use strong passwords with mix of characters

---

## 🎯 Security Best Practices

### Creating First Dev User
Since dev users can only be created by other dev users, you need to create the first dev user manually:

**Option 1: MongoDB Direct Insert**
```javascript
// Connect to MongoDB and run in MongoDB shell or Compass
use qr-food-ordering

db.users.insertOne({
  username: "superdev",
  email: "dev@yourcompany.com",
  password: "$2a$12$YOUR_HASHED_PASSWORD", // Use bcrypt to hash
  role: "dev",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Option 2: Temporary Bypass (Development Only)**
Temporarily modify `createUser` controller to allow first dev creation, then remove the bypass code.

### Token Management
- **Expiration**: 1 day
- **Storage**: Client-side (localStorage/sessionStorage)
- **Refresh**: Re-login required after expiration

### Protecting Sensitive Data
- ❌ Never expose password in API responses
- ✅ Use `.select("-password")` in queries
- ✅ Validate all input data
- ✅ Sanitize user inputs

---

## 🚨 Common Attack Prevention

### SQL Injection
- ✅ Using MongoDB (NoSQL) with Mongoose ODM
- ✅ Parameterized queries by default

### Brute Force Attacks
- ✅ Rate limiting on login/register
- ✅ Account lockout after multiple failed attempts (todo)

### XSS (Cross-Site Scripting)
- ✅ Input validation
- ✅ Content-Type headers
- ⚠️ Client-side: Use React's built-in XSS protection

### CSRF (Cross-Site Request Forgery)
- ✅ JWT tokens (stateless authentication)
- ✅ CORS configuration

---

## 📝 Monitoring & Logging

### Request Logging
- **Tool**: Morgan middleware
- **Format**: dev (console output)
- **Logs**: HTTP method, status, response time

### Error Logging
- ✅ Console errors in development
- ⚠️ Production: Consider using logging service (Winston, Sentry)

---

## 🔄 Security Checklist for Production

- [ ] Change default JWT secret to strong random string
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure environment variables properly
- [ ] Enable MongoDB authentication
- [ ] Set up proper CORS origins (not wildcard)
- [ ] Implement account lockout mechanism
- [ ] Add password strength requirements
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Implement 2FA for admin/dev accounts (optional)

---

## 📞 Security Contact

If you discover a security vulnerability, please email: security@yourcompany.com

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
