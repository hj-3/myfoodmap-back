const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
// const pool = require('./db'); // The routes now import the pool directly

const app = express();

console.log('현재 허용된 프론트 주소:', process.env.FRONT_URL);

// 1. 미들웨어 설정
app.use(cors({
  origin: '*', // 내 프론트엔드 CF 주소 (슬래시 없이!)
  credentials: true, // 쿠키 등을 주고받으려면 필수
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 메서드
}));
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
  console.log(`서버가 http://:${PORT} 에서 실행 중입니다.`);
});