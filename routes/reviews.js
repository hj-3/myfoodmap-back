const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// 1. 리뷰 저장 API (인증 필요)
router.post('/', authenticateToken, async (req, res) => {
  // req.body에서 userId를 받는 대신, 인증 미들웨어를 통해 얻은 사용자 정보를 사용
  const userId = req.user.userId; 
  const { 
    kakaoId, name, address, category, x, y, 
    rating, content, menuName, price,
    imageUrl, visitDate 
  } = req.body;

  try {
    // 1-1. 식당 등록 로직 
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

    const formattedVisitDate = (visitDate ? new Date(visitDate) : new Date())
      .toISOString().slice(0, 19).replace('T', ' ');

    // 1-2. 리뷰 저장 (imageUrl과 visitDate 반영)
    await pool.query(
      `INSERT INTO review (userId, restaurantId, rating, content, menuName, price, imageUrl, visitDate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, // 토큰에서 추출한 userId 사용
        restaurantId, 
        rating, 
        content, 
        menuName, 
        price, 
        imageUrl || null, // 사진 없으면 null
        formattedVisitDate
      ]
    );

    res.status(201).json({ message: '리뷰가 등록되었습니다!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '저장 실패', error: err.message });
  }
});

// 2. 유저의 전체 리뷰 목록 가져오기
router.get('/:username', async (req, res) => {
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

// 3. 리뷰 수정 API (인증 및 권한 확인 필요)
router.put('/:reviewId', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.userId;
  const { rating, content, menuName, price, visitDate, imageUrl } = req.body;

  try {
    // 3-1. 리뷰 작성자 확인
    const [reviews] = await pool.query('SELECT userId FROM review WHERE reviewId = ?', [reviewId]);
    if (reviews.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    if (reviews[0].userId !== userId) {
      return res.status(403).json({ message: '이 리뷰를 수정할 권한이 없습니다.' });
    }
    
    // 3-2. 리뷰 수정
    const formattedVisitDate = (visitDate ? new Date(visitDate) : new Date())
      .toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      'UPDATE review SET rating = ?, content = ?, menuName = ?, price = ?, visitDate = ?, imageUrl = ? WHERE reviewId = ?',
      [rating, content, menuName, price || 0, formattedVisitDate, imageUrl || null, reviewId]
    );
    res.json({ message: '리뷰가 수정되었습니다!' });
  } catch (err) {
    console.error("수정 에러:", err);
    res.status(500).json({ message: '리뷰 수정 중 오류가 발생했습니다.' });
  }
});

// 4. 리뷰 삭제 API (인증 및 권한 확인 필요)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.userId;

  try {
    // 4-1. 리뷰 작성자 확인
    const [reviews] = await pool.query('SELECT userId FROM review WHERE reviewId = ?', [reviewId]);
    if (reviews.length === 0) {
      // 리뷰가 애초에 없는 경우, 굳이 메시지를 노출할 필요 없이 성공한 것처럼 처리하거나 404를 보낼 수 있음
      return res.status(404).json({ message: '삭제할 리뷰를 찾을 수 없습니다.' });
    }
    if (reviews[0].userId !== userId) {
      return res.status(403).json({ message: '이 리뷰를 삭제할 권한이 없습니다.' });
    }

    // 4-2. 리뷰 삭제
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

module.exports = router;
