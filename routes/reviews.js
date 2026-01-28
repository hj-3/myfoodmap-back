const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const prisma = require('../db'); // Prisma Client 인스턴스를 가져옵니다.
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// validation 에러를 처리하는 헬퍼 함수
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 1. 리뷰 저장 API (인증 및 검증 필요)
router.post('/',
  authenticateToken,
  [
    body('kakaoId').notEmpty().isString(),
    body('name').notEmpty().isString(),
    body('address').notEmpty().isString(),
    body('category').optional().isString().withMessage('카테고리는 문자열이어야 합니다.'),
    body('x').notEmpty().isString(),
    body('y').notEmpty().isString(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('평점은 1에서 5 사이의 정수여야 합니다.'),
    body('content').notEmpty().withMessage('메뉴, 가격, 내용은 필수 입력 항목입니다.').isString().withMessage('리뷰 내용은 문자열이어야 합니다.'),
    body('menuName').notEmpty().withMessage('메뉴, 가격, 내용은 필수 입력 항목입니다.').isString(),
    body('price').notEmpty().withMessage('메뉴, 가격, 내용은 필수 입력 항목입니다.').isInt({ min: 0 }).withMessage('가격은 0 이상의 정수여야 합니다.'),
    body('visitDate').isISO8601().withMessage('유효한 날짜 형식(YYYY-MM-DD)이어야 합니다.'),
    body('imageUrl').optional({ checkFalsy: true }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const userId = req.user.userId;
    const {
      kakaoId, name, address, category, x, y,
      rating, content, menuName, price,
      imageUrl, visitDate
    } = req.body;

    try {
      const restaurant = await prisma.restaurant.upsert({
        where: { kakaoId: kakaoId },
        update: { name, address, category, x, y },
        create: { kakaoId, name, address, category, x, y },
      });

      const newReview = await prisma.review.create({
        data: {
          userId: userId,
          restaurantId: restaurant.restaurantId,
          rating: rating,
          content: content,
          menuName: menuName,
          price: price,
          imageUrl: imageUrl || null,
          visitDate: new Date(visitDate),
        }
      });

      res.status(201).json({ message: '리뷰가 등록되었습니다!', review: newReview });
    } catch (err) {
      console.error('리뷰 저장 에러:', err);
      res.status(500).json({ message: '서버 오류로 인해 리뷰를 저장하지 못했습니다.', error: err.message });
    }
  });

// 2. 유저의 전체 리뷰 목록과 통계 가져오기 (검증 필요)
router.get('/:username',
  [
    param('username').notEmpty().isString(),
    query('startDate').optional().isISO8601().withMessage('시작일은 유효한 날짜 형식(YYYY-MM-DD)이어야 합니다.'),
    query('endDate').optional().isISO8601().withMessage('종료일은 유효한 날짜 형식(YYYY-MM-DD)이어야 합니다.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { username } = req.params;
    const { startDate, endDate } = req.query;

    try {
      const dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lt = new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1));
      }

      const reviews = await prisma.review.findMany({
        where: {
          user: { username: username },
          ...(Object.keys(dateFilter).length > 0 && { visitDate: dateFilter }),
        },
        include: {
          restaurant: true,
        },
        orderBy: {
          visitDate: 'desc',
        },
      });

      const stats = await prisma.review.aggregate({
        _sum: { price: true },
        _avg: { rating: true },
        where: {
          user: { username: username },
          ...(Object.keys(dateFilter).length > 0 && { visitDate: dateFilter }),
        },
      });

      res.json({
        reviews: reviews.map(r => ({ ...r.restaurant, ...r })),
        stats: {
          totalSpending: stats._sum.price || 0,
          averageRating: stats._avg.rating || 0,
        }
      });

    } catch (err) {
      console.error('리뷰 조회 에러:', err);
      res.status(500).json({ message: '서버 오류로 인해 리뷰를 조회하지 못했습니다.' });
    }
  });

// 3. 리뷰 수정 API (인증 및 검증 필요)
router.put('/:reviewId',
  authenticateToken,
  [
    param('reviewId').isInt().withMessage('리뷰 ID는 정수여야 합니다.'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('평점은 1에서 5 사이의 정수여야 합니다.'),
    body('content').optional().notEmpty().isString().trim(),
    body('menuName').optional().isString(),
    body('price').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('가격은 0 이상의 정수여야 합니다.'),
    body('visitDate').optional().isISO8601().withMessage('유효한 날짜 형식(YYYY-MM-DD)이어야 합니다.'),
    body('imageUrl').optional({ checkFalsy: true }),
  ],
  handleValidationErrors,
  async (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    const userId = req.user.userId;
    const { rating, content, menuName, price, visitDate, imageUrl } = req.body;

    try {
      const review = await prisma.review.findUnique({
        where: { reviewId: reviewId },
      });

      if (!review) {
        return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
      }
      if (review.userId !== userId) {
        return res.status(403).json({ message: '이 리뷰를 수정할 권한이 없습니다.' });
      }

      const updatedReview = await prisma.review.update({
        where: { reviewId: reviewId },
        data: {
          rating,
          content,
          menuName,
          price,
          visitDate: new Date(visitDate),
          ...(imageUrl && { imageUrl }),
        },
      });

      res.json({ message: '리뷰가 수정되었습니다!', review: updatedReview });
    } catch (err) {
      console.error("리뷰 수정 에러:", err);
      res.status(500).json({ message: '서버 오류로 인해 리뷰를 수정하지 못했습니다.' });
    }
  });

// 4. 리뷰 삭제 API (인증 및 검증 필요)
router.delete('/:reviewId',
  authenticateToken,
  [
    param('reviewId').isInt().withMessage('리뷰 ID는 정수여야 합니다.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    const userId = req.user.userId;

    try {
      const deleteResult = await prisma.review.deleteMany({
        where: {
          reviewId: reviewId,
          userId: userId,
        },
      });

      if (deleteResult.count === 0) {
        return res.status(404).json({ message: '삭제할 리뷰를 찾을 수 없거나 권한이 없습니다.' });
      }

      res.json({ message: '리뷰가 성공적으로 삭제되었습니다. 🗑️' });
    } catch (err) {
      console.error("리뷰 삭제 에러:", err);
      res.status(500).json({ message: '서버 오류로 인해 리뷰를 삭제하지 못했습니다.' });
    }
  });

module.exports = router;
