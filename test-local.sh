#!/bin/bash

# 本地测试脚本 - 模拟GitHub Actions流程

set -e

echo "🧪 修仙世界游戏 - 本地测试脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker已安装${NC}"

# 代码质量检查
echo ""
echo -e "${BLUE}🔍 代码质量检查...${NC}"

# PHP语法检查
echo "检查PHP语法..."
php_errors=0
for file in $(find . -name "*.php"); do
    if ! php -l "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ PHP语法错误: $file${NC}"
        php_errors=$((php_errors + 1))
    fi
done

if [ $php_errors -eq 0 ]; then
    echo -e "${GREEN}✅ PHP语法检查通过${NC}"
else
    echo -e "${RED}❌ 发现 $php_errors 个PHP语法错误${NC}"
    exit 1
fi

# 检查必要文件
echo "检查项目结构..."
required_files=("index.html" "game.js" "style.css" "Dockerfile" "docker-compose.yml")
missing_files=0

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 缺失${NC}"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}❌ 缺失 $missing_files 个必要文件${NC}"
    exit 1
fi

# 检查API目录
if [ -d "api" ]; then
    echo -e "${GREEN}✅ api目录存在${NC}"
    api_files=("config.php" "index.php" "auth.php" "game.php")
    for file in "${api_files[@]}"; do
        if [ -f "api/$file" ]; then
            echo -e "${GREEN}✅ api/$file${NC}"
        else
            echo -e "${YELLOW}⚠️  api/$file 缺失${NC}"
        fi
    done
else
    echo -e "${RED}❌ api目录缺失${NC}"
    exit 1
fi

# Docker构建测试
echo ""
echo -e "${BLUE}🐳 Docker构建测试...${NC}"

# 构建镜像
echo "构建Docker镜像..."
if docker build -t cultivation-game:test . > build.log 2>&1; then
    echo -e "${GREEN}✅ Docker镜像构建成功${NC}"
else
    echo -e "${RED}❌ Docker镜像构建失败${NC}"
    echo "构建日志:"
    cat build.log
    exit 1
fi

# 测试镜像
echo "测试Docker镜像..."
docker rm -f test-cultivation 2>/dev/null || true

if docker run -d --name test-cultivation -p 8888:80 cultivation-game:test; then
    echo -e "${GREEN}✅ 测试容器启动成功${NC}"
else
    echo -e "${RED}❌ 测试容器启动失败${NC}"
    exit 1
fi

# 等待容器启动
echo "等待服务启动..."
sleep 10

# 测试HTTP服务
echo "测试HTTP服务..."
for i in {1..5}; do
    if curl -s http://localhost:8888 > /dev/null; then
        echo -e "${GREEN}✅ HTTP服务正常${NC}"
        break
    else
        echo -e "${YELLOW}⏳ 等待HTTP服务启动... ($i/5)${NC}"
        sleep 3
    fi
    
    if [ $i -eq 5 ]; then
        echo -e "${RED}❌ HTTP服务异常${NC}"
        echo "容器日志:"
        docker logs test-cultivation
        docker stop test-cultivation
        docker rm test-cultivation
        exit 1
    fi
done

# 测试API（可选，因为需要数据库）
echo "测试API端点..."
if curl -s http://localhost:8888/api/test > /dev/null; then
    echo -e "${GREEN}✅ API服务正常${NC}"
else
    echo -e "${YELLOW}⚠️  API服务需要数据库连接${NC}"
fi

# 清理测试容器
echo "清理测试环境..."
docker stop test-cultivation > /dev/null
docker rm test-cultivation > /dev/null
echo -e "${GREEN}✅ 测试环境已清理${NC}"

# 镜像信息
echo ""
echo -e "${BLUE}📊 镜像信息:${NC}"
docker images | grep cultivation-game

# 模拟推送测试（不实际推送）
echo ""
echo -e "${BLUE}🚀 模拟推送测试...${NC}"

DOCKERHUB_USERNAME="your-dockerhub-username"
echo "镜像标签: $DOCKERHUB_USERNAME/cultivation-game:test"
echo "推送命令: docker push $DOCKERHUB_USERNAME/cultivation-game:test"
echo -e "${YELLOW}💡 实际推送需要运行: docker login && docker push${NC}"

# 清理构建镜像（可选）
echo ""
read -p "🧹 是否清理测试镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi cultivation-game:test > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ 测试镜像已清理${NC}"
fi

echo ""
echo -e "${GREEN}🎉 本地测试完成！${NC}"
echo ""
echo -e "${BLUE}📝 测试结果总结:${NC}"
echo "   ✅ 代码质量检查通过"
echo "   ✅ 项目结构完整"
echo "   ✅ Docker镜像构建成功"
echo "   ✅ HTTP服务正常运行"
echo ""
echo -e "${BLUE}🚀 下一步:${NC}"
echo "   1. 推送代码到GitHub"
echo "   2. 设置GitHub Secrets"
echo "   3. 触发自动构建"
echo ""
echo -e "${YELLOW}💡 提示: 查看 GITHUB-ACTIONS-SETUP.md 了解详细设置步骤${NC}"
