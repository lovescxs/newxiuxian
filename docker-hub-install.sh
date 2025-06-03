#!/bin/bash

# 修仙世界游戏 - Docker Hub一键部署
# 使用方法: curl -fsSL https://your-domain.com/docker-hub-install.sh | bash

set -e

DOCKER_IMAGE="your-dockerhub-username/cultivation-game"
CONTAINER_NAME="cultivation-game"
WEB_PORT="8080"
DB_PORT="3306"
PMA_PORT="8081"

echo "🏮 修仙世界游戏 - Docker Hub部署 🏮"
echo "================================="
echo ""

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "安装命令: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 创建工作目录
WORK_DIR="cultivation-game-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "📁 工作目录: $(pwd)"

# 下载docker-compose配置文件
echo "📥 下载配置文件..."
if curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/docker-compose.hub.yml -o docker-compose.yml; then
    echo "✅ 配置文件下载成功"
else
    echo "⚠️  配置文件下载失败，使用内置配置"

    # 创建docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    image: your-dockerhub-username/cultivation-game:latest
    container_name: cultivation_game_web
    ports:
      - "8080:80"
    environment:
      - DB_HOST=db
      - DB_NAME=cultivation_game
      - DB_USER=cultivation_user
      - DB_PASS=cultivation_pass_2024
    depends_on:
      - db
    networks:
      - cultivation_network
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: cultivation_game_db
    environment:
      MYSQL_ROOT_PASSWORD: cultivation_root_2024
      MYSQL_DATABASE: cultivation_game
      MYSQL_USER: cultivation_user
      MYSQL_PASSWORD: cultivation_pass_2024
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - cultivation_network
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: cultivation_game_phpmyadmin
    environment:
      PMA_HOST: db
      PMA_PORT: 3306
      PMA_USER: cultivation_user
      PMA_PASSWORD: cultivation_pass_2024
    ports:
      - "8081:80"
    depends_on:
      - db
    networks:
      - cultivation_network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  cultivation_network:
    driver: bridge
EOF
fi

# 下载数据库初始化脚本
echo "📥 下载数据库初始化脚本..."
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/init.sql -o init.sql 2>/dev/null || echo "⚠️  数据库脚本下载失败，将使用默认配置"

# 询问端口配置
echo ""
read -p "🔧 Web端口 (默认: 8080): " input_web_port
read -p "🔧 数据库端口 (默认: 3306): " input_db_port
read -p "🔧 phpMyAdmin端口 (默认: 8081): " input_pma_port

WEB_PORT=${input_web_port:-8080}
DB_PORT=${input_db_port:-3306}
PMA_PORT=${input_pma_port:-8081}

# 更新端口配置
sed -i.bak "s/8080:80/$WEB_PORT:80/g" docker-compose.yml
sed -i.bak "s/3306:3306/$DB_PORT:3306/g" docker-compose.yml
sed -i.bak "s/8081:80/$PMA_PORT:80/g" docker-compose.yml

rm docker-compose.yml.bak 2>/dev/null || true

echo ""
echo "🚀 启动服务..."

# 拉取最新镜像并启动
docker-compose pull
docker-compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 20

echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 访问地址:"
echo "   游戏主页: http://localhost:$WEB_PORT"
echo "   数据库管理: http://localhost:$PMA_PORT"
echo ""
echo "👤 默认账户:"
echo "   管理员: admin / password"
echo ""
echo "📝 管理命令:"
echo "   停止: docker-compose down"
echo "   重启: docker-compose restart"
echo "   日志: docker-compose logs -f"
