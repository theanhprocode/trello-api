# Trello API

Backend cho ứng dụng quản lý công việc kiểu Trello. Viết bằng Node.js + Express, dùng MongoDB làm database.

## Tech Stack

- **Runtime:** Node.js (>=18)
- **Framework:** Express.js
- **Database:** MongoDB (driver native, không dùng Mongoose)
- **Authentication:** JWT (access token + refresh token), cookie-based session
- **Validation:** Joi
- **Upload ảnh:** Cloudinary + Multer
- **Realtime:** Socket.IO
- **Email:** Resend
- **Deploy:** Render

## Cấu trúc thư mục

```
src/
├── config/          # Cấu hình DB, CORS, env
├── controllers/     # Nhận request, trả response
├── services/        # Business logic
├── models/          # Schema validation, query MongoDB
├── validations/     # Validate request body (Joi)
├── middlewares/      # Auth, error handling, upload
├── routes/          # Định nghĩa API endpoints
├── providers/       # Cloudinary, JWT, Resend
├── sockets/         # Socket.IO events
└── utils/           # Helper functions
```

## Chức năng chính

- Đăng ký, đăng nhập, xác thực email
- Tạo/sửa/xoá board, column, card
- Kéo thả card giữa các column (cập nhật thứ tự)
- Upload ảnh cover cho card (qua Cloudinary)
- Mời user vào board (invitation system)
- Thông báo realtime khi được mời (Socket.IO)
- Phân quyền owner/member trên board
- Refresh token tự động

## Cài đặt

```bash
# Clone repo
git clone https://github.com/theanhprocode/trello-api.git
cd trello-api

# Cài dependencies
yarn install

# Tạo file .env (copy từ .env.example hoặc tự tạo)
# Cần có: MONGODB_URI, DATABASE_NAME, ACCESS_TOKEN_SECRET_KEY,
# REFRESH_TOKEN_SECRET_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
# CLOUDINARY_API_SECRET, RESEND_API_KEY, ...

# Chạy dev
yarn dev

# Build production
yarn build
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /v1/users/register | Đăng ký |
| POST | /v1/users/login | Đăng nhập |
| PUT | /v1/users/refresh_token | Refresh token |
| DELETE | /v1/users/logout | Đăng xuất |
| GET | /v1/boards | Lấy danh sách boards |
| POST | /v1/boards | Tạo board mới |
| GET | /v1/boards/:id | Chi tiết board |
| PUT | /v1/boards/:id | Cập nhật board |
| POST | /v1/columns | Tạo column |
| PUT | /v1/columns/:id | Cập nhật column |
| DELETE | /v1/columns/:id | Xoá column |
| POST | /v1/cards | Tạo card |
| PUT | /v1/cards/:id | Cập nhật card (kèm upload ảnh) |
| POST | /v1/invitations/board | Mời user vào board |
| GET | /v1/invitations | Lấy danh sách lời mời |
| PUT | /v1/invitations/board/:id | Accept/reject lời mời |

## Lưu ý
- Production deploy trên Render