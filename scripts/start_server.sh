#!/bin/bash
cd /home/ec2-user/backend

# 이미 실행 중인 프로세스가 있다면 죽이고 새로 시작, 없으면 그냥 시작
pm2 delete food || true
pm2 start app.js --name food

# PM2 설정을 저장하여 서버 재부팅 시 자동 실행되게 함
pm2 save