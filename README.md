# Seejam Server - NestJS với MongoDB Atlas

Server NestJS với chức năng xác thực tài khoản sử dụng MongoDB Atlas và JWT.

## 🚀 Tính năng

- ✅ Xác thực tài khoản (Đăng ký/Đăng nhập)
- ✅ JWT Authentication
- ✅ MongoDB Atlas integration
- ✅ Password hashing với bcrypt
- ✅ Validation với class-validator
- ✅ CORS enabled
- ✅ TypeScript support

## 📋 Yêu cầu hệ thống

- Node.js (v16 trở lên)
- npm hoặc yarn
- MongoDB Atlas account

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd Seejam_Server
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
```bash
# Copy file môi trường mẫu
cp env.example .env

# Chỉnh sửa file .env với thông tin MongoDB Atlas của bạn
```

### 4. Cấu hình MongoDB Atlas
1. Đăng nhập vào [MongoDB Atlas](https://cloud.mongodb.com/)
2. Tạo cluster mới hoặc sử dụng cluster có sẵn
3. Tạo database user với quyền read/write
4. Lấy connection string và cập nhật vào file `.env`

### 5. Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 🔧 Cấu hình môi trường

Tạo file `.env` với các biến sau:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/seejam_db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký tài khoản mới
- `POST /auth/login` - Đăng nhập
- `GET /auth/profile` - Lấy thông tin profile (cần JWT)

### Users
- `POST /users` - Tạo user mới
- `GET /users` - Lấy danh sách users (cần JWT)
- `GET /users/profile` - Lấy profile của user hiện tại (cần JWT)
- `GET /users/:id` - Lấy thông tin user theo ID (cần JWT)
- `PATCH /users/:id` - Cập nhật thông tin user (cần JWT)
- `DELETE /users/:id` - Xóa user (cần JWT)
- `PATCH /users/:id/deactivate` - Vô hiệu hóa user (cần JWT)

## 🔐 Sử dụng JWT

Sau khi đăng nhập thành công, bạn sẽ nhận được `access_token`. Sử dụng token này trong header:

```
Authorization: Bearer <your-access-token>
```

## 📝 Ví dụ sử dụng

### Đăng ký tài khoản
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0123456789"
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Truy cập API được bảo vệ
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer <your-access-token>"
```

## 🏗️ Cấu trúc dự án

```
src/
├── auth/                 # Module xác thực
│   ├── dto/             # Data Transfer Objects
│   ├── guards/          # Authentication guards
│   ├── strategies/      # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # Module quản lý users
│   ├── dto/            # Data Transfer Objects
│   ├── schemas/        # MongoDB schemas
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── app.module.ts        # Module chính
└── main.ts             # Entry point
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Build

```bash
npm run build
```

## 🚀 Deployment

1. Build ứng dụng: `npm run build`
2. Chạy production: `npm run start:prod`
3. Đảm bảo biến môi trường `NODE_ENV=production`

## 🔒 Bảo mật

- Passwords được hash với bcrypt
- JWT tokens có thời hạn
- Validation cho tất cả input
- CORS được cấu hình đúng cách

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License
