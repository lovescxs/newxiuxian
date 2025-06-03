#!/bin/bash

# 更新README.md中的安装链接

GITHUB_USERNAME="your-username"
GITHUB_REPO="cultivation-game"
DOCKER_USERNAME="your-dockerhub-username"
DOMAIN="your-domain.com"

echo "📝 更新README.md安装链接..."

# 备份原文件
cp README.md README.md.bak

# 更新GitHub链接
sed -i.tmp "s/your-username/$GITHUB_USERNAME/g" README.md
sed -i.tmp "s/cultivation-game/$GITHUB_REPO/g" README.md
sed -i.tmp "s/your-dockerhub-username/$DOCKER_USERNAME/g" README.md
sed -i.tmp "s/your-domain.com/$DOMAIN/g" README.md

# 清理临时文件
rm README.md.tmp 2>/dev/null || true

echo "✅ README.md更新完成"

# 同样更新其他文件
echo "📝 更新安装脚本链接..."

files=("install.sh" "quick-install.sh" "docker-hub-install.sh" "web-installer.html")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$file.bak"
        sed -i.tmp "s/your-username/$GITHUB_USERNAME/g" "$file"
        sed -i.tmp "s/cultivation-game/$GITHUB_REPO/g" "$file"
        sed -i.tmp "s/your-dockerhub-username/$DOCKER_USERNAME/g" "$file"
        sed -i.tmp "s/your-domain.com/$DOMAIN/g" "$file"
        rm "$file.tmp" 2>/dev/null || true
        echo "✅ $file 更新完成"
    fi
done

echo ""
echo "🎉 所有文件更新完成！"
echo ""
echo "📝 请确认以下信息正确："
echo "   GitHub用户名: $GITHUB_USERNAME"
echo "   GitHub仓库: $GITHUB_REPO"
echo "   Docker Hub用户名: $DOCKER_USERNAME"
echo "   域名: $DOMAIN"
