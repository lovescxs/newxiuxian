#!/bin/bash

# 修仙世界游戏 - 发布脚本
# 用于创建GitHub Release和Docker Hub镜像

set -e

VERSION=${1:-"v1.0.0"}
DOCKER_USERNAME="your-dockerhub-username"
REPO_NAME="cultivation-game"

echo "🏮 修仙世界游戏 - 发布脚本 🏮"
echo "版本: $VERSION"
echo "=========================="

# 检查Git状态
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改，请先提交"
    git status
    exit 1
fi

echo "✅ Git状态检查通过"

# 构建Docker镜像
echo ""
echo "🔨 构建Docker镜像..."
docker build -t "$DOCKER_USERNAME/$REPO_NAME:$VERSION" .
docker tag "$DOCKER_USERNAME/$REPO_NAME:$VERSION" "$DOCKER_USERNAME/$REPO_NAME:latest"

echo "✅ Docker镜像构建完成"

# 推送到Docker Hub
echo ""
read -p "🚀 是否推送到Docker Hub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 推送Docker镜像..."
    docker push "$DOCKER_USERNAME/$REPO_NAME:$VERSION"
    docker push "$DOCKER_USERNAME/$REPO_NAME:latest"
    echo "✅ Docker镜像推送完成"
fi

# 创建Git标签
echo ""
echo "🏷️  创建Git标签..."
git tag -a "$VERSION" -m "Release $VERSION"

# 推送到GitHub
echo ""
read -p "📤 是否推送到GitHub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    git push origin "$VERSION"
    echo "✅ 代码推送完成"
fi

# 创建发布包
echo ""
echo "📦 创建发布包..."
RELEASE_DIR="release-$VERSION"
mkdir -p "$RELEASE_DIR"

# 复制必要文件
cp -r api "$RELEASE_DIR/"
cp index.html game.js style.css "$RELEASE_DIR/"
cp Dockerfile docker-compose.yml .env.example .htaccess "$RELEASE_DIR/"
cp *.sh "$RELEASE_DIR/"
cp README.md DEPLOY.md PLANmd "$RELEASE_DIR/"

# 创建压缩包
tar -czf "$RELEASE_DIR.tar.gz" "$RELEASE_DIR"
zip -r "$RELEASE_DIR.zip" "$RELEASE_DIR"

echo "✅ 发布包创建完成:"
echo "   - $RELEASE_DIR.tar.gz"
echo "   - $RELEASE_DIR.zip"

# 清理临时目录
rm -rf "$RELEASE_DIR"

echo ""
echo "🎉 发布完成！"
echo ""
echo "📋 发布信息:"
echo "   版本: $VERSION"
echo "   Docker镜像: $DOCKER_USERNAME/$REPO_NAME:$VERSION"
echo "   发布包: $RELEASE_DIR.tar.gz, $RELEASE_DIR.zip"
echo ""
echo "📝 下一步:"
echo "1. 在GitHub上创建Release并上传发布包"
echo "2. 更新安装脚本中的仓库地址"
echo "3. 测试安装脚本"
