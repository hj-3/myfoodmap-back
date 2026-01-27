#!/bin/bash
# 1. 작업 디렉토리 이동
cd /home/ec2-user/backend

# 2. nvm 및 npm 경로 강제 로드
# ec2-user 홈 디렉토리를 명시적으로 지정합니다.
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. nvm 명령어를 못 찾을 경우를 대비해 PATH 수동 추가
export PATH="$NVM_DIR/versions/node/$(ls $NVM_DIR/versions/node | head -n 1)/bin:$PATH"

# 4. 제대로 잡혔는지 로그 확인 (CodeDeploy 로그에서 확인 가능)
echo "Current PATH: $PATH"
node -v
npm -v

# 5. 의존성 설치
npm install