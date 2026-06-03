#!/bin/bash
set -e

# ============================================
#  Property Management System (PMS) — Remote Deploy Script
#  Usage: bash deploy.sh
# ============================================

SERVER="root@srv1100100.hstgr.cloud"
REMOTE_DIR="/home/web/pms2"
GIT_REPO="https://github.com/mizae1234/pms.git"

echo ""
echo "🚀 Preparing remote directory on ${SERVER}..."
ssh "$SERVER" mkdir -p "$REMOTE_DIR"

echo "📤 Uploading environment configuration..."
scp .env "$SERVER":"$REMOTE_DIR/.env"

echo ""
echo "🚀 Deploying PMS to ${SERVER}..."
echo "============================================"

ssh "$SERVER" bash -s <<EOF
set -e

cd /home/web

if [ ! -d "pms2/.git" ]; then
  echo "📥 Initializing git repository on server..."
  cd pms2
  git init
  git remote add origin $GIT_REPO
  git fetch origin
  git checkout -f main
else
  echo "📥 Pulling latest code..."
  cd pms2
  git fetch origin
  git reset --hard origin/main
fi

# Ensure .env is present (was copied by scp)
if [ ! -f ".env" ]; then
  echo "❌ .env file not found!"
  exit 1
fi

echo ""
echo "🐳 Rebuilding Docker image..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "⏳ Waiting for container..."
sleep 5

if docker ps --filter "name=pms-app" --filter "status=running" -q | grep -q .; then
    echo ""
    echo "✅ Deploy successful!"
    docker logs --tail 5 pms-app
else
    echo ""
    echo "❌ Container failed!"
    docker logs --tail 20 pms-app
    exit 1
fi
EOF

echo ""
echo "🎉 PMS deployed successfully!"
echo "🌐 URL: http://pms.popcorn-creator.com"
echo ""
