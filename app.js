const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
// const pool = require('./db'); // The routes now import the pool directly

const app = express();

// 1. 미들웨어 설정
app.use(cors());
app.use(express.json());
// uploads 폴더를 정적 경로로 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. DB 연결 설정 - 각 라우트 파일에서 db.js를 직접 임포트하므로 여기서는 필요 없음

// 3. 서버 실행 확인용
app.get('/', (req, res) => {
  res.send('서버가 정상적으로 작동 중입니다!');
});

// 4. 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});