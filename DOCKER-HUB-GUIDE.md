# 🐳 Docker Hub 发布指南

## 📋 发布前准备

### 1. 注册Docker Hub账户
1. 访问 [Docker Hub](https://hub.docker.com/)
2. 注册账户或登录
3. 记住你的用户名（后面会用到）

### 2. 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# macOS
# 下载并安装 Docker Desktop

# Windows
# 下载并安装 Docker Desktop
```

### 3. 登录Docker Hub
```bash
docker login
# 输入你的Docker Hub用户名和密码
```

## 🚀 一键发布

### 方法一：使用发布脚本（推荐）

```bash
# 运行自动化发布脚本
./build-and-push.sh
```

脚本会自动：
- ✅ 检查Docker环境
- ✅ 构建镜像
- ✅ 测试镜像
- ✅ 推送到Docker Hub
- ✅ 清理本地镜像

### 方法二：手动发布

```bash
# 1. 构建镜像
docker build -t your-dockerhub-username/cultivation-game:1.0.0 .
docker tag your-dockerhub-username/cultivation-game:1.0.0 your-dockerhub-username/cultivation-game:latest

# 2. 测试镜像
docker run -d --name test-game -p 8888:80 your-dockerhub-username/cultivation-game:1.0.0
curl http://localhost:8888  # 测试是否正常
docker stop test-game && docker rm test-game

# 3. 推送镜像
docker push your-dockerhub-username/cultivation-game:1.0.0
docker push your-dockerhub-username/cultivation-game:latest
```

## 📝 更新Docker Hub仓库信息

### 1. 仓库描述
在Docker Hub仓库页面设置：

**简短描述**：
```
修仙世界 - 网页修仙游戏，支持多人在线、自动修炼、任务系统
```

**详细描述**：
复制 `DOCKER-HUB-README.md` 的内容

### 2. 添加标签
```
game, web-game, php, vue, mysql, docker, cultivation, mmorpg, chinese
```

### 3. 设置仓库链接
- **源代码**: https://github.com/your-username/cultivation-game
- **文档**: https://github.com/your-username/cultivation-game/blob/main/README.md
- **问题跟踪**: https://github.com/your-username/cultivation-game/issues

## 🔄 自动构建设置

### 1. 连接GitHub仓库
1. 在Docker Hub仓库页面点击 "Builds"
2. 连接你的GitHub账户
3. 选择 `cultivation-game` 仓库
4. 配置构建规则：

| 源类型 | 源 | Docker标签 | Dockerfile位置 |
|--------|-----|-----------|----------------|
| Branch | main | latest | Dockerfile |
| Tag | /^v([0-9.]+)$/ | {\1} | Dockerfile |

### 2. 构建触发器
- ✅ 推送到main分支时自动构建
- ✅ 创建新标签时自动构建
- ✅ 手动触发构建

## 📊 镜像优化

### 1. 多阶段构建（可选）
```dockerfile
# 构建阶段
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 运行阶段
FROM php:8.1-apache
COPY --from=builder /app/node_modules ./node_modules
# ... 其他配置
```

### 2. 减小镜像大小
```dockerfile
# 清理包管理器缓存
RUN apt-get update && apt-get install -y \
    package1 package2 \
    && rm -rf /var/lib/apt/lists/*

# 使用.dockerignore
echo "node_modules" >> .dockerignore
echo ".git" >> .dockerignore
echo "*.md" >> .dockerignore
```

## 🧪 测试发布的镜像

### 1. 本地测试
```bash
# 拉取并测试镜像
docker pull your-dockerhub-username/cultivation-game:latest
docker run -d --name test-cultivation -p 8080:80 your-dockerhub-username/cultivation-game:latest

# 访问测试
curl http://localhost:8080
curl http://localhost:8080/api/test

# 清理
docker stop test-cultivation && docker rm test-cultivation
```

### 2. 完整环境测试
```bash
# 使用docker-compose测试
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/docker-compose.hub.yml -o test-compose.yml
docker-compose -f test-compose.yml up -d

# 测试功能
# 访问 http://localhost:8080

# 清理
docker-compose -f test-compose.yml down -v
```

## 📈 发布后推广

### 1. 更新项目文档
- ✅ 更新README.md中的Docker Hub链接
- ✅ 更新安装脚本中的镜像名称
- ✅ 创建使用示例

### 2. 社区分享
- 🌟 在GitHub上添加Docker Hub徽章
- 📝 写技术博客介绍项目
- 💬 在技术社区分享
- 🐦 社交媒体宣传

### 3. 持续维护
- 🔄 定期更新镜像
- 🐛 修复用户反馈的问题
- 📊 监控下载量和使用情况
- 🔒 及时更新安全补丁

## 📋 发布检查清单

### 发布前
- [ ] Docker环境正常
- [ ] 代码已提交到GitHub
- [ ] 测试通过
- [ ] 更新版本号
- [ ] 准备发布说明

### 发布中
- [ ] 构建镜像成功
- [ ] 本地测试通过
- [ ] 推送到Docker Hub成功
- [ ] 镜像可以正常拉取

### 发布后
- [ ] 更新Docker Hub仓库信息
- [ ] 测试一键安装脚本
- [ ] 更新项目文档
- [ ] 通知用户更新

## 🔧 常见问题

### 1. 构建失败
```bash
# 检查Dockerfile语法
docker build --no-cache -t test-image .

# 查看构建日志
docker build -t test-image . 2>&1 | tee build.log
```

### 2. 推送失败
```bash
# 重新登录
docker logout
docker login

# 检查镜像名称
docker images | grep cultivation-game

# 重新标记
docker tag local-image your-dockerhub-username/cultivation-game:latest
```

### 3. 镜像过大
```bash
# 分析镜像层
docker history your-dockerhub-username/cultivation-game:latest

# 使用dive工具分析
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest your-dockerhub-username/cultivation-game:latest
```

## 🎉 发布成功

恭喜！你的修仙世界游戏现在可以通过以下方式安装：

```bash
# 一键安装
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/docker-hub-install.sh | bash

# 直接运行
docker run -d -p 8080:80 your-dockerhub-username/cultivation-game:latest
```

用户现在可以在几分钟内部署你的游戏了！🚀✨
