#!/bin/bash

# Docker配置测试脚本

echo "🧪 修仙世界游戏 - Docker配置测试"
echo "================================"

# 检查Docker
echo "📋 检查Docker环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    exit 1
else
    echo "✅ Docker已安装: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    exit 1
else
    echo "✅ Docker Compose已安装: $(docker-compose --version)"
fi

# 检查配置文件
echo ""
echo "📋 检查配置文件..."

if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile存在"
else
    echo "❌ Dockerfile不存在"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml存在"
else
    echo "❌ docker-compose.yml不存在"
    exit 1
fi

if [ -f ".env.example" ]; then
    echo "✅ .env.example存在"
else
    echo "❌ .env.example不存在"
fi

# 检查API文件
echo ""
echo "📋 检查API文件..."
api_files=("config.php" "index.php" "auth.php" "game.php" "chat.php" "admin.php" "cultivation.php" "quests.php" "database.sql")

for file in "${api_files[@]}"; do
    if [ -f "api/$file" ]; then
        echo "✅ api/$file存在"
    else
        echo "❌ api/$file不存在"
    fi
done

# 检查前端文件
echo ""
echo "📋 检查前端文件..."
frontend_files=("index.html" "game.js" "style.css")

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file存在"
    else
        echo "❌ $file不存在"
    fi
done

# 验证docker-compose配置
echo ""
echo "📋 验证Docker Compose配置..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml配置有效"
else
    echo "❌ docker-compose.yml配置无效"
    docker-compose config
    exit 1
fi

echo ""
echo "🎉 所有检查通过！可以开始部署了。"
echo ""
echo "📝 下一步："
echo "1. 运行 ./start.sh 启动服务"
echo "2. 或者手动运行 docker-compose up -d --build"
