# Seejam Server API Documentation

## Tổng quan
Seejam Server là một RESTful API được xây dựng bằng NestJS, sử dụng MongoDB Atlas làm cơ sở dữ liệu và JWT để xác thực.

## Base URL
```
http://localhost:3000
```

## Swagger UI
Truy cập Swagger documentation tại: `http://localhost:3000/api`

## Authentication
API sử dụng JWT Bearer token để xác thực. Thêm header sau vào request:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Authentication (`/auth`)

#### 1.1 Đăng ký tài khoản
```http
POST /auth/register
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

**Response thành công (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "user",
    "isEmailVerified": false
  }
}
```

#### 1.2 Đăng nhập
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response thành công (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "user",
    "isEmailVerified": false
  }
}
```

#### 1.3 Lấy thông tin profile
```http
GET /auth/profile
Authorization: Bearer <your-jwt-token>
```

**Response thành công (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "user",
  "isEmailVerified": false
}
```

### 2. Users Management (`/users`)

#### 2.1 Lấy danh sách tất cả người dùng
```http
GET /users
Authorization: Bearer <your-jwt-token>
```

#### 2.2 Lấy thông tin người dùng theo ID
```http
GET /users/:id
Authorization: Bearer <your-jwt-token>
```

#### 2.3 Cập nhật thông tin người dùng
```http
PATCH /users/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn B",
  "email": "newemail@example.com"
}
```

#### 2.4 Xóa người dùng
```http
DELETE /users/:id
Authorization: Bearer <your-jwt-token>
```

## Validation Rules

### Đăng ký
- **fullName**: Tối thiểu 2 ký tự
- **email**: Phải là email hợp lệ và duy nhất
- **password**: Tối thiểu 6 ký tự, phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số
- **confirmPassword**: Phải giống với password

### Đăng nhập
- **email**: Phải là email hợp lệ
- **password**: Tối thiểu 6 ký tự

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Xác nhận mật khẩu không khớp"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Email hoặc mật khẩu không đúng",
  "error": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email đã tồn tại trong hệ thống",
  "error": "Conflict"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy người dùng",
  "error": "Not Found"
}
```

## Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment variables
Tạo file `.env` với các biến sau:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
PORT=3000
```

### 3. Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## Testing

### Chạy tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Công nghệ sử dụng

- **Framework**: NestJS
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT + Passport
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Language**: TypeScript

## Liên hệ

- **Email**: support@seejam.com
- **Website**: https://seejam.com
- **License**: MIT
