# Backend Dockerfile
FROM node:20-alpine

# ตั้งค่า working directory
WORKDIR /app

# คัดลอก package files
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm ci --only=production

# คัดลอกโค้ดทั้งหมด
COPY . .

# เปิด port
EXPOSE 3000

# รันแอพ
CMD ["npm", "start"]
