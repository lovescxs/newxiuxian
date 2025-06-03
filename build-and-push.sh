#!/bin/bash

# 修仙世界游戏 - Docker Hub 构建和推送脚本

set -e

# 配置信息
DOCKER_USERNAME=""
IMAGE_NAME="cultivation-game"
VERSION="1.0.0"
LATEST_TAG="latest"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏮 修仙世界游戏 - Docker Hub 发布脚本 🏮${NC}"
echo "=============================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装，请先安装Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker已安装: $(docker --version)${NC}"

# 获取Docker Hub用户名
if [ -z "$DOCKER_USERNAME" ]; then
    read -p "🔑 请输入你的Docker Hub用户名: " DOCKER_USERNAME
    if [ -z "$DOCKER_USERNAME" ]; then
        echo -e "${RED}❌ Docker Hub用户名不能为空${NC}"
        exit 1
    fi
fi

# 获取版本号
read -p "📦 请输入版本号 (默认: $VERSION): " input_version
if [ ! -z "$input_version" ]; then
    VERSION="$input_version"
fi

# 构建完整镜像名
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME"

echo ""
echo -e "${BLUE}📋 构建信息:${NC}"
echo "   Docker Hub用户名: $DOCKER_USERNAME"
echo "   镜像名称: $IMAGE_NAME"
echo "   版本: $VERSION"
echo "   完整镜像名: $FULL_IMAGE_NAME:$VERSION"
echo ""

# 确认构建
read -p "🚀 是否开始构建? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 构建取消${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔨 开始构建Docker镜像...${NC}"

# 构建镜像
if docker build -t "$FULL_IMAGE_NAME:$VERSION" .; then
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

# 标记为latest
echo -e "${BLUE}🏷️  标记为latest版本...${NC}"
docker tag "$FULL_IMAGE_NAME:$VERSION" "$FULL_IMAGE_NAME:$LATEST_TAG"

# 显示镜像信息
echo ""
echo -e "${BLUE}📊 镜像信息:${NC}"
docker images | grep "$DOCKER_USERNAME/$IMAGE_NAME"

# 测试镜像
echo ""
echo -e "${BLUE}🧪 测试镜像...${NC}"
TEST_CONTAINER="test-cultivation-game"

# 清理可能存在的测试容器
docker rm -f "$TEST_CONTAINER" 2>/dev/null || true

# 启动测试容器
if docker run -d --name "$TEST_CONTAINER" -p 8888:80 "$FULL_IMAGE_NAME:$VERSION"; then
    echo -e "${GREEN}✅ 测试容器启动成功${NC}"
    echo "   测试地址: http://localhost:8888"
    
    # 等待容器启动
    sleep 5
    
    # 测试HTTP响应
    if curl -s http://localhost:8888 > /dev/null; then
        echo -e "${GREEN}✅ HTTP服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP服务可能还在启动中${NC}"
    fi
    
    # 停止并删除测试容器
    docker stop "$TEST_CONTAINER" > /dev/null
    docker rm "$TEST_CONTAINER" > /dev/null
    echo -e "${GREEN}✅ 测试完成，容器已清理${NC}"
else
    echo -e "${RED}❌ 测试容器启动失败${NC}"
    exit 1
fi

# 登录Docker Hub
echo ""
echo -e "${BLUE}🔑 登录Docker Hub...${NC}"
if docker login; then
    echo -e "${GREEN}✅ Docker Hub登录成功${NC}"
else
    echo -e "${RED}❌ Docker Hub登录失败${NC}"
    exit 1
fi

# 推送镜像
echo ""
echo -e "${BLUE}📤 推送镜像到Docker Hub...${NC}"

echo "推送版本镜像: $FULL_IMAGE_NAME:$VERSION"
if docker push "$FULL_IMAGE_NAME:$VERSION"; then
    echo -e "${GREEN}✅ 版本镜像推送成功${NC}"
else
    echo -e "${RED}❌ 版本镜像推送失败${NC}"
    exit 1
fi

echo "推送latest镜像: $FULL_IMAGE_NAME:$LATEST_TAG"
if docker push "$FULL_IMAGE_NAME:$LATEST_TAG"; then
    echo -e "${GREEN}✅ latest镜像推送成功${NC}"
else
    echo -e "${RED}❌ latest镜像推送失败${NC}"
    exit 1
fi

# 清理本地镜像（可选）
echo ""
read -p "🧹 是否清理本地镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi "$FULL_IMAGE_NAME:$VERSION" "$FULL_IMAGE_NAME:$LATEST_TAG" 2>/dev/null || true
    echo -e "${GREEN}✅ 本地镜像已清理${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Docker Hub发布完成！${NC}"
echo ""
echo -e "${BLUE}📱 使用方法:${NC}"
echo ""
echo -e "${YELLOW}1. 单容器运行:${NC}"
echo "   docker run -d -p 8080:80 --name cultivation-game $FULL_IMAGE_NAME:$VERSION"
echo ""
echo -e "${YELLOW}2. 使用docker-compose:${NC}"
echo "   # 在docker-compose.yml中使用:"
echo "   image: $FULL_IMAGE_NAME:$VERSION"
echo ""
echo -e "${YELLOW}3. 一键安装命令:${NC}"
echo "   docker run -d -p 8080:80 -p 3306:3306 \\"
echo "     -e MYSQL_ROOT_PASSWORD=your_password \\"
echo "     -e MYSQL_DATABASE=cultivation_game \\"
echo "     $FULL_IMAGE_NAME:$VERSION"
echo ""
echo -e "${BLUE}🔗 Docker Hub链接:${NC}"
echo "   https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
echo ""
echo -e "${BLUE}📖 拉取命令:${NC}"
echo "   docker pull $FULL_IMAGE_NAME:$VERSION"
echo "   docker pull $FULL_IMAGE_NAME:latest"
