#!/bin/bash
cd /home/ec2-user/backend

# 1. 환경 변수 설정
export HOME="/home/ec2-user"
export NVM_DIR="$HOME/.nvm"

# 2. NVM 로드 (이미 설치되어 있을 것이므로 로드 위주)
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. PATH 강제 업데이트 (NVM이 설치한 node/npm 위치를 찾음)
export PATH="$NVM_DIR/versions/node/$(nvm current)/bin:$PATH"

# 4. [중요] 권한 문제 해결
# CodeDeploy가 root로 생성한 파일들을 ec2-user가 쓸 수 있게 소유권 변경
sudo chown -R ec2-user:ec2-user /home/ec2-user/backend

# 5. 확인 로그
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 6. 의존성 설치
# 이제 ec2-user 권한으로 마음껏 node_modules를 만들 수 있습니다.
npm install