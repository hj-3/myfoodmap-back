#!/bin/bash
cd /home/ec2-user/backend

# 1. 환경 변수 설정
export HOME="/home/ec2-user"
export NVM_DIR="$HOME/.nvm"

# 2. NVM이 없으면 설치, 있으면 로드
if [ ! -d "$NVM_DIR" ]; then
    echo "NVM not found. Installing..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# NVM 로드
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. Node.js 설치 확인 및 설치 (LTS 버전)
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing LTS..."
    nvm install --lts
    nvm use --lts
fi

# 4. PATH 강제 업데이트
export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"

# 5. 확인 로그
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 6. 의존성 설치
npm install