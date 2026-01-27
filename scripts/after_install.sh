#!/bin/bash
cd /home/ec2-user/backend

# nvm 환경 변수 로드 (Node/npm 위치를 알려줍니다)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 만약 위 코드로도 npm을 못 찾으면 직접 경로를 추가 (Amazon Linux 기준)
export PATH=$PATH:/home/ec2-user/.nvm/versions/node/$(nvm current)/bin

npm install