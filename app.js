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

<<<<<<< HEAD
=======
  try {
    // 1. 아이디 중복 확인
    const [existingUser] = await pool.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    // 2. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. DB에 사용자 정보 저장 
    await pool.query(
      'INSERT INTO user (username, nickname, password) VALUES (?, ?, ?)',
      [username, nickname, hashedPassword]
    );

    res.status(201).json({ message: '회원가입이 완료되었습니다!' });
  } catch (err) {
    console.error("회원가입 에러:", err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message });
  }
});

// 5. 아이디 중복 확인 API
app.get('/api/auth/check-username/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.json({ available: false });
    }
    res.json({ available: true });
  } catch (err) {
    console.error("DB 조회 에러:", err);
    res.status(500).json({ message: 'DB 조회 중 오류 발생', error: err.message });
  }
});

// 6. 로그인 API
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // 테이블명 user, 컬럼명 확인 (userId 포함)
    const [users] = await pool.query('SELECT userId, username, nickname, password FROM user WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }


    // 로그인 성공 시 userId(숫자)를 함께 보냄
    res.json({ 
      message: '로그인 성공!', 
      user: {
        id: user.userId, // 숫자형 식별자
        username: user.username,
        nickname: user.nickname
      }
    });
  } catch (err) {
    res.status(500).json({ message: '서버 오류 발생' });
  }
});

// 7. 이미지 업로드 API
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
  }
  // 클라이언트에게 파일 접근 URL을 보내줌
  const imageUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl: imageUrl });
});

// 8. 리뷰 저장 API
app.post('/api/reviews', async (req, res) => {
  const { 
    userId, kakaoId, name, address, category, x, y, 
    rating, content, menuName, price,
    imageUrl, visitDate 
  } = req.body;

  try {
    // 1. 식당 등록 로직 
    let [restaurants] = await pool.query('SELECT restaurantId FROM restaurant WHERE kakaoId = ?', [kakaoId]);
    let restaurantId;
    if (restaurants.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO restaurant (kakaoId, name, address, category, x, y) VALUES (?, ?, ?, ?, ?, ?)',
        [kakaoId, name, address, category, x, y]
      );
      restaurantId = result.insertId;
    } else {
      restaurantId = restaurants[0].restaurantId;
    }

    // 2. 리뷰 저장 (imageUrl과 visitDate 반영)
    await pool.query(
      `INSERT INTO review (userId, restaurantId, rating, content, menuName, price, imageUrl, visitDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        restaurantId, 
        rating, 
        content, 
        menuName, 
        price, 
        imageUrl || null, // 사진 없으면 null
        visitDate || new Date() // 날짜 없으면 현재 시간
      ]
    );

    res.status(201).json({ message: '리뷰가 등록되었습니다!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '저장 실패', error: err.message });
  }
});

// 9. 유저의 전체 리뷰 목록 가져오기
app.get('/api/reviews/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.reviewId, 
        r.rating, 
        r.content, 
        r.menuName, 
        r.price, 
        r.visitDate,
        r.createdAt,
        r.imageUrl, 
        res.name, 
        res.address, 
        res.x, 
        res.y,
        res.kakaoId  
      FROM review r
      JOIN restaurant res ON r.restaurantId = res.restaurantId
      JOIN user u ON r.userId = u.userId
      WHERE u.username = ?
      ORDER BY r.visitDate DESC -- 최신 방문순으로 정렬하는 것이 좋습니다.
    `, [username]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '조회 실패' });
  }
});

// 10. 리뷰 수정 API
app.put('/api/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { rating, content, menuName, price, visitDate } = req.body;

  try {
    await pool.query(
      'UPDATE review SET rating = ?, content = ?, menuName = ?, price = ?, visitDate = ? WHERE reviewId = ?',
      [rating, content, menuName, price, visitDate, reviewId]
    );
    res.json({ message: '리뷰가 수정되었습니다!' });
  } catch (err) {
    console.error("수정 에러:", err);
    res.status(500).json({ message: '리뷰 수정 중 오류가 발생했습니다.' });
  }
});

// 11. 리뷰 삭제 API
app.delete('/api/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM review WHERE reviewId = ?', [reviewId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '삭제할 리뷰를 찾을 수 없습니다.' });
    }

    res.json({ message: '리뷰가 성공적으로 삭제되었습니다. 🗑️' });
  } catch (err) {
    console.error("삭제 에러:", err);
    res.status(500).json({ message: '리뷰 삭제 중 오류가 발생했습니다.' });
  }
});
>>>>>>> a39f6b47c3eeea0da06380055b1cdc4abfda3f48


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});