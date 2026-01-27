#!/bin/bash
cd /home/ec2-user/backend

# 기존 node_modules 삭제 (충돌 방지) 및 재설치
rm -rf node_modules
npm install