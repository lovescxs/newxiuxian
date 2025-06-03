#!/bin/bash

# 修仙世界游戏停止脚本

echo "🏮 修仙世界游戏 - 停止服务 🏮"
echo "=========================="

# 检查是否有运行的容器
if [ "$(docker-compose ps -q)" ]; then
    echo "🛑 停止所有服务..."
    docker-compose down
    
    echo "🧹 清理未使用的资源..."
    docker system prune -f
    
    echo "✅ 服务已停止"
else
    echo "ℹ️  没有运行的服务"
fi

echo ""
echo "📝 如需完全清理（包括数据），请运行:"
echo "   docker-compose down -v"
echo "   docker system prune -a -f"
