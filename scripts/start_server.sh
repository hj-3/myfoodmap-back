#!/bin/bash
cd /home/ec2-user/backend

# nvm 및 npm 경로 강제 로드
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/$(ls $NVM_DIR/versions/node | head -n 1)/bin:$PATH"

# PM2 실행
pm2 delete food || true
pm2 start app.js --name food
pm2 save