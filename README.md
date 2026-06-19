# Personal Life Hub — Backend API

REST API สำหรับแอปจัดการชีวิตส่วนตัว (Personal Life Hub) สร้างด้วย **Express 5 + MySQL**
รวมการจัดการงาน, ปฏิทิน, โน้ต, เป้าหมาย, การเงิน และการแจ้งเตือน ไว้ในที่เดียว

> ส่วนหน้าเว็บ (frontend) อยู่ในโปรเจกต์ Angular แยกต่างหากที่ `../Angular`

---

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|------|-----------|
| Runtime | Node.js (CommonJS) |
| Framework | Express v5 |
| Database | MySQL (ผ่าน `mysql2/promise` connection pool) |
| Auth | JWT (`jsonwebtoken`) + แฮชรหัสผ่านด้วย `bcryptjs` |
| Config | `dotenv` |

---

## โครงสร้างโปรเจกต์

```
Nodejs/
├── server.js                  # entry point — อ่าน PORT แล้ว app.listen
├── schema.sql                 # สคีมาฐานข้อมูลทั้งหมด (รันครั้งเดียวตอนติดตั้ง)
├── .env                       # ค่าตั้งค่า (gitignored — ต้องสร้างเอง)
└── src/
    ├── app.js                 # Express app factory + ผูก route ทั้งหมด
    ├── config/
    │   └── db.js              # mysql2 pool (connectionLimit: 10)
    ├── middlewares/
    │   ├── authMiddleware.js  # ตรวจ Bearer token แล้วแนบ req.user (id, email)
    │   └── errorHandler.js    # global error handler → { success: false, message }
    ├── controllers/           # ตรรกะแต่ละ feature
    └── routes/                # นิยาม endpoint แต่ละ feature
```

**Request flow:** `server.js` → `src/app.js` → `routes/<feature>.js` → `controllers/<feature>.js` → `config/db.js`

---

## การติดตั้งและรัน

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. สร้างฐานข้อมูล
รัน `schema.sql` กับ MySQL server ของคุณ (สร้าง database `personal_life_hub` พร้อมตารางทั้งหมด):
```bash
mysql -u root -p < schema.sql
```

### 3. สร้างไฟล์ `.env`
```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=plh_user
DB_PASSWORD=your_password_here
DB_NAME=personal_life_hub

JWT_SECRET=ใส่ค่าลับยาวๆ สุ่มเอง
JWT_EXPIRES_IN=7d
```

### 4. รันเซิร์ฟเวอร์
```bash
node server.js
```
เซิร์ฟเวอร์จะรันที่ `http://localhost:5000` (ไม่มีขั้นตอน build)

---

## รูปแบบ Response

ทุก endpoint ตอบกลับเป็น JSON รูปแบบเดียวกัน:

```jsonc
// สำเร็จ
{ "success": true, "message": "...", "data": { /* ... */ } }

// ผิดพลาด (จัดการโดย errorHandler หรือ controller)
{ "success": false, "message": "ข้อความอธิบายข้อผิดพลาด" }
```

---

## Authentication

ทุก endpoint ยกเว้น `/api/auth/*` ต้องแนบ JWT มาใน header:
```
Authorization: Bearer <token>
```
token ได้จากการ login (อายุ 7 วันโดยค่าเริ่มต้น)

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Body | คำอธิบาย |
|--------|------|------|----------|
| POST | `/register` | `username`, `email`, `password` | สมัครสมาชิก |
| POST | `/login` | `email`, `password` | เข้าสู่ระบบ → คืน `token` |

ทุก endpoint ด้านล่างนี้ **ต้องล็อกอิน** และจะเห็นเฉพาะข้อมูลของผู้ใช้ตนเอง (ตรวจ ownership ทุกครั้ง)

### Todos — `/api/todos`
| Method | Path | Body |
|--------|------|------|
| GET | `/` | — |
| POST | `/` | `title`*, `description`, `due_date`, `priority` (low/medium/high) |
| PUT | `/:id` | ฟิลด์ที่ต้องการแก้ |
| DELETE | `/:id` | — |

### Events (ปฏิทิน) — `/api/events`
| Method | Path | Body |
|--------|------|------|
| GET | `/` | — (เรียงตาม `start_datetime`) |
| POST | `/` | `title`*, `start_datetime`*, `end_datetime`, `description`, `color` |
| PUT | `/:id` | ฟิลด์ที่ต้องการแก้ |
| DELETE | `/:id` | — |

### Notes (โน้ต) — `/api/notes`
| Method | Path | Body |
|--------|------|------|
| GET | `/` | — |
| POST | `/` | `title`*, `content`, `tags` (work/personal/study/other) |
| PUT | `/:id` | ฟิลด์ที่ต้องการแก้ |
| DELETE | `/:id` | — |

### Goals (เป้าหมาย) — `/api/goals`
| Method | Path | Body |
|--------|------|------|
| GET | `/` | — |
| POST | `/` | `title`*, `description`, `status` (active/completed/cancelled), `progress` (0–100), `target_date` |
| PUT | `/:id` | ฟิลด์ที่ต้องการแก้ |
| DELETE | `/:id` | — |

### Transactions (การเงิน) — `/api/transactions`
| Method | Path | Body |
|--------|------|------|
| GET | `/` | — (เรียงตาม `date` ล่าสุดก่อน) |
| POST | `/` | `type`* (income/expense), `amount`* (>0), `date`*, `category`, `note` |
| PUT | `/:id` | ฟิลด์ที่ต้องการแก้ |
| DELETE | `/:id` | — |

### Reminders (การแจ้งเตือน) — `/api/reminders`
| Method | Path | Body |
|--------|------|------|
| GET | `/` | — (แนบ `ref_title` ของรายการที่อ้างอิงมาด้วย) |
| POST | `/` | `ref_type`* (todo/event/goal), `ref_id`*, `remind_at`* |
| PUT | `/:id` | `ref_type`, `ref_id`, `remind_at`, `is_sent` |
| DELETE | `/:id` | — |

> `*` = ฟิลด์ที่จำเป็น · การแจ้งเตือนอ้างอิงรายการ todo/event/goal และตรวจ ownership ของรายการที่อ้างอิงตอนสร้าง/แก้ไข

---

## ข้อกำหนดในการพัฒนา (Conventions)

- **CommonJS** (`require`/`module.exports`) ไม่ใช้ ES modules
- **Express v5** — async error ส่งต่อไป `next(err)` อัตโนมัติ ไม่ต้องครอบ try/catch ใน controller (ยกเว้น auth ที่ครอบไว้)
- เพิ่ม feature ใหม่: สร้าง controller ใน `src/controllers/`, route ใน `src/routes/`, แล้ว mount ใน `src/app.js`
- Query ฐานข้อมูลใช้ pool จาก `src/config/db.js`: `const pool = require('../config/db'); pool.query(...)`
- คอลัมน์ชนิด `DATE` ถูกตั้งให้คืนเป็น string `"YYYY-MM-DD"` (`dateStrings: ['DATE']`) เพื่อกันวันที่เพี้ยนจาก timezone
- คอลัมน์ `DECIMAL` (เช่น `amount`) mysql2 คืนเป็น **string** — ฝั่ง client ต้องแปลงเป็นตัวเลขเองเมื่อนำไปคำนวณ
