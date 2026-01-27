const express = require('express');
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// 1. Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일명 중복 방지
  }
});
const upload = multer({ storage: storage });

// 2. 이미지 업로드 API (인증 필요)
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
  }
  // 클라이언트에게 파일 접근 URL을 보내줌
  const imageUrl = `${process.env.BACKEND_URL}/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl: imageUrl });
});

module.exports = router;
