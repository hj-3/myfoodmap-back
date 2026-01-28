const express = require('express');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk'); // 추가
const multerS3 = require('multer-s3'); // 추가
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// 1. AWS S3 설정 (IAM Role을 사용하므로 별도의 Key 입력 불필요)
const s3 = new AWS.S3({
  region: 'ap-northeast-2'
});

// 2. Multer S3 스토리지 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_IMAGE_BUCKET_NAME, // 환경 변수명 확인!
    contentType: multerS3.AUTO_CONTENT_TYPE, // 브라우저에서 파일이 다운로드되지 않고 바로 열리게 함
    key: function (req, file, cb) {
      // 사용자 이름 가져오기 (auth 미들웨어가 넣어준 req.user 사용)
      const username = req.user ? req.user.username : 'anonymous';
      const extension = path.extname(file.originalname);
      const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}${extension}`;
      
      // S3 내 저장 경로: 사용자명/파일이름 (S3는 슬래시를 기준으로 자동 폴더 트리 생성)
      cb(null, `${username}/${filename}`);
    }
  })
});

// 3. 이미지 업로드 API (인증 필요)
// 프론트엔드 FormData에서 보내는 이름이 'photo'인지 다시 확인하세요!
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
  }

  // req.file.location은 multer-s3가 제공하는 전체 S3 객체 URL입니다.
  // 예: https://버킷이름.s3.ap-northeast-2.amazonaws.com/username/filename.jpg
  res.status(201).json({ imageUrl: req.file.location });
});

module.exports = router;
