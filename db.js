// backend/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// DB 연결 풀 생성 및 내보내기
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

module.exports = pool;
