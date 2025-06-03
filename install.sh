#!/bin/bash

# 修仙世界游戏 - 一键安装脚本
# 使用方法: curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/install.sh | bash

set -e

REPO_URL="https://github.com/your-username/cultivation-game"
INSTALL_DIR="cultivation-game"
VERSION="latest"

echo "🏮 修仙世界游戏 - 一键安装脚本 🏮"
echo "=================================="
echo ""

# 检查系统要求
echo "📋 检查系统环境..."

# 检查操作系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "✅ 操作系统: Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo "✅ 操作系统: macOS"
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装"
    echo ""
    echo "请先安装Docker:"
    if [[ "$OS" == "linux" ]]; then
        echo "Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
        echo "CentOS/RHEL: curl -fsSL https://get.docker.com | sh"
    elif [[ "$OS" == "macos" ]]; then
        echo "macOS: 下载Docker Desktop from https://www.docker.com/products/docker-desktop"
    fi
    exit 1
else
    echo "✅ Docker已安装: $(docker --version)"
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    echo ""
    echo "安装Docker Compose:"
    echo "sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
else
    echo "✅ Docker Compose已安装: $(docker-compose --version)"
fi

# 检查Git
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装"
    echo ""
    echo "请先安装Git:"
    if [[ "$OS" == "linux" ]]; then
        echo "Ubuntu/Debian: sudo apt update && sudo apt install git"
        echo "CentOS/RHEL: sudo yum install git"
    elif [[ "$OS" == "macos" ]]; then
        echo "macOS: xcode-select --install"
    fi
    exit 1
else
    echo "✅ Git已安装: $(git --version)"
fi

echo ""

# 选择安装目录
read -p "📁 安装目录 (默认: $INSTALL_DIR): " input_dir
if [ ! -z "$input_dir" ]; then
    INSTALL_DIR="$input_dir"
fi

# 检查目录是否存在
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  目录 $INSTALL_DIR 已存在"
    read -p "是否删除并重新安装? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        echo "🗑️  已删除旧目录"
    else
        echo "❌ 安装取消"
        exit 1
    fi
fi

echo ""
echo "🚀 开始安装..."

# 克隆仓库
echo "📥 下载游戏文件..."
if git clone "$REPO_URL.git" "$INSTALL_DIR"; then
    echo "✅ 下载完成"
else
    echo "❌ 下载失败，请检查网络连接"
    exit 1
fi

# 进入安装目录
cd "$INSTALL_DIR"

# 设置权限
chmod +x *.sh

# 创建环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建配置文件..."
    cp .env.example .env
    
    # 生成随机密码
    DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    ROOT_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    API_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # 替换默认密码
    sed -i.bak "s/cultivation_pass_2024/$DB_PASS/g" .env
    sed -i.bak "s/cultivation_root_2024/$ROOT_PASS/g" .env
    sed -i.bak "s/cultivation_secret_key_2024_change_in_production/$API_SECRET/g" .env
    sed -i.bak "s/cultivation_jwt_secret_2024_change_in_production/$JWT_SECRET/g" .env
    
    rm .env.bak 2>/dev/null || true
    
    echo "✅ 配置文件已创建并设置随机密码"
fi

# 询问端口配置
echo ""
echo "🔧 端口配置"
read -p "Web端口 (默认: 8080): " web_port
read -p "数据库端口 (默认: 3306): " db_port
read -p "phpMyAdmin端口 (默认: 8081): " pma_port

web_port=${web_port:-8080}
db_port=${db_port:-3306}
pma_port=${pma_port:-8081}

# 更新端口配置
sed -i.bak "s/8080:80/$web_port:80/g" docker-compose.yml
sed -i.bak "s/3306:3306/$db_port:3306/g" docker-compose.yml
sed -i.bak "s/8081:80/$pma_port:80/g" docker-compose.yml

rm docker-compose.yml.bak 2>/dev/null || true

echo "✅ 端口配置完成"

# 启动服务
echo ""
echo "🚀 启动服务..."

if docker-compose up -d --build; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败"
    echo "请查看错误信息并重试"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务初始化..."
sleep 15

# 测试服务
echo "🧪 测试服务连接..."
if curl -s "http://localhost:$web_port/api/test" > /dev/null; then
    echo "✅ 服务运行正常"
else
    echo "⚠️  服务可能还在启动中，请稍后访问"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📱 访问地址:"
echo "   游戏主页: http://localhost:$web_port"
echo "   数据库管理: http://localhost:$pma_port"
echo "   API测试: http://localhost:$web_port/api/test"
echo ""
echo "👤 默认管理员账户:"
echo "   用户名: admin"
echo "   密码: password"
echo ""
echo "📝 管理命令:"
echo "   启动服务: docker-compose up -d"
echo "   停止服务: docker-compose down"
echo "   查看日志: docker-compose logs -f"
echo "   重启服务: docker-compose restart"
echo ""
echo "📁 安装目录: $(pwd)"
echo ""
echo "🎮 开始你的修仙之旅吧！"
