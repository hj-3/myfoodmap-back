#!/bin/bash
cd /home/ec2-user/backend

export HOME="/home/ec2-user"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"

# PM2 설치 확인 (없으면 설치)
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 서비스 재시작
pm2 delete food || true
pm2 start app.js --name food
pm2 save