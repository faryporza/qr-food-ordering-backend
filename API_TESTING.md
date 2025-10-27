# API Testing Guide - Security Features

## 🧪 Test Scenarios

### 1. Test Public Registration (Should create employee only)

```bash
# ✅ Should succeed - Creates employee
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_employee",
    "email": "employee@test.com",
    "password": "password123"
  }'

# Response: { role: "employee" } - Always employee, regardless of request
```

### 2. Test Login

```bash
# ✅ Should succeed
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_employee",
    "password": "password123"
  }'

# Copy the token from response for next tests
```

### 3. Test Rate Limiting

```bash
# 🔒 Run this 6 times quickly - 6th request should be blocked
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"test$i\",
      \"email\": \"test$i@test.com\",
      \"password\": \"password123\"
    }"
  echo ""
done

# Expected: First 5 succeed, 6th returns rate limit error
```

### 4. Test Employee Cannot Create Users

```bash
# ❌ Should fail - Employee role cannot create users
curl -X POST http://localhost:3000/api/protected/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -d '{
    "username": "new_user",
    "email": "new@test.com",
    "password": "password123",
    "role": "employee"
  }'

# Expected: 403 Forbidden - "Access denied. Admin or Dev only."
```

### 5. Test Dev Can Create Admin

```bash
# ✅ Should succeed (requires dev token)
curl -X POST http://localhost:3000/api/protected/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <DEV_TOKEN>" \
  -d '{
    "username": "new_admin",
    "email": "admin@test.com",
    "password": "password123",
    "role": "admin"
  }'

# Expected: 201 Created - Admin user created
```

### 6. Test Admin Cannot Create Dev

```bash
# ❌ Should fail - Only dev can create dev users
curl -X POST http://localhost:3000/api/protected/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "username": "new_dev",
    "email": "dev@test.com",
    "password": "password123",
    "role": "dev"
  }'

# Expected: 403 Forbidden - "Only dev can create dev users"
```

### 7. Test Admin Cannot Update Dev User

```bash
# ❌ Should fail - Only dev can update dev users
curl -X PUT http://localhost:3000/api/protected/users/<DEV_USER_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "username": "updated_dev"
  }'

# Expected: 403 Forbidden - "Only dev can update dev users"
```

### 8. Test Admin Cannot Delete Dev User

```bash
# ❌ Should fail - Only dev can delete dev users
curl -X DELETE http://localhost:3000/api/protected/users/<DEV_USER_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Expected: 403 Forbidden - "Only dev can delete dev users"
```

---

## 🔧 Getting Tokens for Testing

### Get Employee Token
```bash
TOKEN_EMPLOYEE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"employee1","password":"password123"}' \
  | jq -r '.token')

echo "Employee Token: $TOKEN_EMPLOYEE"
```

### Get Admin Token (after creating admin)
```bash
TOKEN_ADMIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"password123"}' \
  | jq -r '.token')

echo "Admin Token: $TOKEN_ADMIN"
```

### Get Dev Token (after creating dev via MongoDB)
```bash
TOKEN_DEV=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superdev","password":"devpass123"}' \
  | jq -r '.token')

echo "Dev Token: $TOKEN_DEV"
```

---

## 📊 Expected Results Summary

| Test | Employee | Admin | Dev |
|------|----------|-------|-----|
| Register publicly | ✅ Employee only | N/A | N/A |
| Login | ✅ | ✅ | ✅ |
| View users | ❌ 403 | ✅ | ✅ |
| Create employee | ❌ 403 | ❌ 403 | ✅ |
| Create admin | ❌ 403 | ❌ 403 | ✅ |
| Create dev | ❌ 403 | ❌ 403 | ✅ |
| Update employee | ❌ 403 | ✅ | ✅ |
| Update admin | ❌ 403 | ❌ 403 | ✅ |
| Update dev | ❌ 403 | ❌ 403 | ✅ |
| Delete employee | ❌ 403 | ✅ | ✅ |
| Delete admin | ❌ 403 | ❌ 403 | ✅ |
| Delete dev | ❌ 403 | ❌ 403 | ✅ |

---

## 🎯 Quick Test Script

Save as `test-security.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing Security Features..."
echo ""

# Test 1: Public registration
echo "1️⃣ Testing public registration (should create employee)..."
curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test_emp","email":"emp@test.com","password":"pass123"}' \
  | jq '.user.role'
echo ""

# Test 2: Rate limiting (run 6 times)
echo "2️⃣ Testing rate limiting (6 registrations)..."
for i in {1..6}; do
  RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"limit$i\",\"email\":\"limit$i@test.com\",\"password\":\"pass123\"}")
  
  if echo $RESPONSE | grep -q "Too many"; then
    echo "❌ Request $i: Rate limited (expected on 6th)"
  else
    echo "✅ Request $i: Success"
  fi
done
echo ""

echo "✅ Security tests completed!"
```

Run with:
```bash
chmod +x test-security.sh
./test-security.sh
```

---

## 🔍 Debugging Tips

### Check Rate Limit Headers
```bash
curl -I http://localhost:3000/api/auth/register

# Look for headers:
# RateLimit-Limit: 5
# RateLimit-Remaining: 4
# RateLimit-Reset: <timestamp>
```

### Decode JWT Token
```bash
# Install jwt-cli: npm install -g jwt-cli

jwt decode <YOUR_TOKEN>

# Or use online tool: https://jwt.io
```

### MongoDB Check User Roles
```javascript
// In MongoDB shell or Compass
db.users.find({}, { username: 1, email: 1, role: 1 })
```

---

**Note**: Replace `<EMPLOYEE_TOKEN>`, `<ADMIN_TOKEN>`, `<DEV_TOKEN>`, and `<DEV_USER_ID>` with actual values from your tests.
