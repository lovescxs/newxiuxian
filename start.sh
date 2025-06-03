#!/bin/bash

# 修仙世界游戏启动脚本

echo "🏮 修仙世界游戏 - Docker部署脚本 🏮"
echo "=================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件修改默认密码和密钥"
    echo "   nano .env"
    echo ""
fi

# 显示当前配置
echo "📋 当前配置:"
echo "   Web端口: $(grep WEB_PORT .env | cut -d'=' -f2 || echo '8080')"
echo "   数据库端口: $(grep DB_PORT .env | cut -d'=' -f2 || echo '3306')"
echo "   phpMyAdmin端口: $(grep PHPMYADMIN_PORT .env | cut -d'=' -f2 || echo '8081')"
echo ""

# 询问是否继续
read -p "是否继续启动服务? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消启动"
    exit 1
fi

echo "🚀 启动服务..."

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 测试API连接
echo "🧪 测试API连接..."
WEB_PORT=$(grep WEB_PORT .env | cut -d'=' -f2 || echo '8080')

if curl -s http://localhost:$WEB_PORT/api/test > /dev/null; then
    echo "✅ API服务正常"
else
    echo "❌ API服务异常，请检查日志"
    echo "   docker-compose logs web"
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 访问地址:"
echo "   游戏主页: http://localhost:$WEB_PORT"
echo "   数据库管理: http://localhost:$(grep PHPMYADMIN_PORT .env | cut -d'=' -f2 || echo '8081')"
echo "   API测试: http://localhost:$WEB_PORT/api/test"
echo ""
echo "👤 默认管理员账户:"
echo "   用户名: admin"
echo "   密码: password"
echo ""
echo "📝 常用命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo ""
echo "⚠️  生产环境请务必修改默认密码！"
