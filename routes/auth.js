const express = require('express');
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const prisma = require('../db');

const router = express.Router();

// 1. 회원가입 API
router.post('/signup', async (req, res) => {
    const { username, nickname, password } = req.body;

    try {
        // 1-1. 아이디 중복 확인
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
        }

        // 1-2. 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1-3. DB에 사용자 정보 저장
        await prisma.user.create({
            data: {
                username,
                nickname,
                password: hashedPassword,
            },
        });

        res.status(201).json({ message: '회원가입이 완료되었습니다!' });
    } catch (err) {
        console.error("회원가입 에러:", err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message });
    }
});

// 2. 아이디 중복 확인 API
router.get('/check-username/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });
        if (user) {
            return res.json({ available: false });
        }
        res.json({ available: true });
    } catch (err) {
        console.error("DB 조회 에러:", err);
        res.status(500).json({ message: 'DB 조회 중 오류 발생', error: err.message });
    }
});

// 3. 로그인 API
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { username: username }
        });
        
        if (!user) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }

        // JWT 생성
        const token = jwt.sign(
            { userId: user.userId, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // 1시간 동안 유효
        );

        res.json({ 
            message: '로그인 성공!', 
            token, // 토큰을 응답에 포함
            user: {
                id: user.userId, // 숫자형 식별자
                username: user.username,
                nickname: user.nickname
            }
        });
    } catch (err) {
        console.error("로그인 에러:", err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

module.exports = router;
