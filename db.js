// backend/db.js
const { PrismaClient } = require('@prisma/client');

// Prisma Client 인스턴스 생성 및 내보내기
// 애플리케이션 전체에서 하나의 인스턴스를 공유합니다.
const prisma = new PrismaClient();

module.exports = prisma;
