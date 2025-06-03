# 🤖 GitHub Actions 自动化设置指南

## 📋 概述

通过GitHub Actions，你可以实现：
- 🐳 自动构建Docker镜像
- 📤 自动推送到Docker Hub
- 🚀 自动创建GitHub Release
- 🔍 代码质量检查
- 🔒 安全扫描
- ⚡ 性能测试

## 🔑 第一步：设置GitHub Secrets

### 1. 获取Docker Hub Access Token

1. 登录 [Docker Hub](https://hub.docker.com/)
2. 点击右上角头像 → "Account Settings"
3. 选择 "Security" 标签页
4. 点击 "New Access Token"
5. 输入Token名称（如：`github-actions`）
6. 选择权限：`Read, Write, Delete`
7. 点击 "Generate" 并复制Token

### 2. 在GitHub仓库中添加Secrets

1. 进入你的GitHub仓库
2. 点击 "Settings" 标签页
3. 在左侧菜单选择 "Secrets and variables" → "Actions"
4. 点击 "New repository secret"

添加以下Secrets：

| Secret名称 | 值 | 说明 |
|-----------|-----|------|
| `DOCKERHUB_USERNAME` | 你的Docker Hub用户名 | 用于登录Docker Hub |
| `DOCKERHUB_TOKEN` | 刚才生成的Access Token | 用于推送镜像 |

### 3. 验证Secrets设置

确保添加了以下Secrets：
- ✅ `DOCKERHUB_USERNAME`
- ✅ `DOCKERHUB_TOKEN`

## 🚀 第二步：触发自动构建

### 方法一：推送代码到main分支
```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 方法二：创建版本标签
```bash
# 创建版本标签
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 方法三：手动触发
1. 进入GitHub仓库
2. 点击 "Actions" 标签页
3. 选择 "🐳 Build and Push Docker Image"
4. 点击 "Run workflow"
5. 输入版本号（可选）
6. 点击 "Run workflow"

## 📊 工作流说明

### 1. 🔍 CI/CD Pipeline (`ci.yml`)
**触发条件**: 推送到main/develop分支，或创建PR

**执行内容**:
- ✅ PHP语法检查
- ✅ JavaScript语法检查
- ✅ 项目结构检查
- ✅ Docker构建测试
- ✅ 安全扫描
- ✅ 性能测试

### 2. 🐳 Build and Push Docker Image (`docker-build.yml`)
**触发条件**: 推送到main分支，创建标签，或手动触发

**执行内容**:
- ✅ 构建多平台Docker镜像（AMD64, ARM64）
- ✅ 推送到Docker Hub
- ✅ 镜像功能测试
- ✅ 安全扫描

### 3. 🚀 Release (`release.yml`)
**触发条件**: 创建版本标签（如v1.0.0）

**执行内容**:
- ✅ 创建GitHub Release
- ✅ 生成发布包（tar.gz, zip）
- ✅ 构建并推送Docker镜像
- ✅ 自动生成Release说明

### 4. 📝 Update README (`update-readme.yml`)
**触发条件**: Docker构建完成后，或手动触发

**执行内容**:
- ✅ 更新README中的链接
- ✅ 添加项目徽章
- ✅ 更新统计信息
- ✅ 自动提交更改

## 🎯 使用流程

### 开发阶段
1. 在`develop`分支开发新功能
2. 推送代码触发CI检查
3. 创建PR到`main`分支
4. CI通过后合并PR

### 发布阶段
1. 合并到`main`分支
2. 创建版本标签：`git tag v1.0.0 && git push origin v1.0.0`
3. 自动触发Release工作流
4. 自动创建GitHub Release和Docker镜像

### 结果
- 🐳 Docker Hub: `your-username/cultivation-game:1.0.0`
- 📦 GitHub Release: 包含下载包
- 📝 自动更新的README和文档

## 🔧 自定义配置

### 修改镜像名称
编辑 `.github/workflows/docker-build.yml`:
```yaml
env:
  IMAGE_NAME: your-custom-name  # 修改这里
```

### 修改构建平台
编辑 `.github/workflows/docker-build.yml`:
```yaml
platforms: linux/amd64,linux/arm64,linux/arm/v7  # 添加更多平台
```

### 修改触发条件
编辑工作流文件的 `on` 部分：
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]  # 添加更多分支
```

## 📊 监控和调试

### 查看工作流状态
1. 进入GitHub仓库
2. 点击 "Actions" 标签页
3. 查看工作流运行状态

### 调试失败的工作流
1. 点击失败的工作流
2. 展开失败的步骤
3. 查看详细日志
4. 根据错误信息修复问题

### 常见问题

**1. Docker Hub登录失败**
- 检查 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`
- 确保Token有正确的权限

**2. 构建失败**
- 检查Dockerfile语法
- 确保所有必要文件存在

**3. 推送失败**
- 检查网络连接
- 确保仓库名称正确

## 🎉 完成设置

设置完成后，你的项目将拥有：

- ✅ 自动化CI/CD流程
- ✅ 自动Docker镜像构建
- ✅ 自动发布管理
- ✅ 代码质量保证
- ✅ 安全扫描
- ✅ 性能监控

用户现在可以通过以下方式获取你的游戏：

```bash
# 最新版本
docker pull your-username/cultivation-game:latest

# 特定版本
docker pull your-username/cultivation-game:1.0.0

# 一键安装
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/install.sh | bash
```

🎮 **开始你的自动化修仙之旅吧！** ✨
