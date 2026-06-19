const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // คืนค่าคอลัมน์ DATE เป็น string "YYYY-MM-DD" ตรงๆ ไม่แปลงเป็น Date object
  // ป้องกันวันที่เพี้ยน 1 วันจากการ shift timezone (UTC) ตอน serialize JSON
  dateStrings: ['DATE'],
});

module.exports = pool;