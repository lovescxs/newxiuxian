# 🏮 修仙世界 - 网页修仙游戏

一个基于Vue 3和PHP的现代化修仙主题网页游戏，支持多人在线、实时聊天、自动修炼等功能。

## ✨ 主要功能

### 🎮 核心游戏系统
- **修炼系统**: 手动修炼 + 自动修炼（离线挂机）
- **境界突破**: 练气期 → 筑基期 → 金丹期 → 元婴期 → 化神期
- **战斗系统**: 回合制战斗，技能连招
- **探索系统**: 多地图探索，随机遭遇
- **技能系统**: 火球术、治疗术、护体术、雷电术等

### 🛠️ 生活系统
- **炼丹系统**: 收集材料炼制丹药
- **装备强化**: 装备升级和属性提升
- **任务系统**: 日常任务、周常任务
- **成就系统**: 丰富的成就奖励

### 🏛️ 社交系统
- **宗门系统**: 加入宗门，获得加成
- **聊天系统**: 实时江湖聊天
- **排行榜**: 等级榜、财富榜、战力榜
- **管理系统**: 完整的后台管理

## 🚀 一键安装部署

### 方法一：超快速安装（推荐）

```bash
# Linux/macOS 一键安装
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/install.sh | bash
```

### 方法二：Docker Hub部署（自动构建）

```bash
# 使用GitHub Actions自动构建的镜像
docker run -d -p 8080:80 your-dockerhub-username/cultivation-game:latest

# 或使用一键安装脚本
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/docker-hub-install.sh | bash
```

### 方法三：网页安装器

访问在线安装器：[https://your-domain.com/web-installer.html](https://your-domain.com/web-installer.html)

### 方法四：手动下载

1. **下载发布包**：
   - [下载 .tar.gz](https://github.com/your-username/cultivation-game/releases/latest/download/cultivation-game.tar.gz)
   - [下载 .zip](https://github.com/your-username/cultivation-game/releases/latest/download/cultivation-game.zip)

2. **解压并安装**：
```bash
# 解压文件
tar -xzf cultivation-game.tar.gz  # 或 unzip cultivation-game.zip
cd cultivation-game

# 配置环境
cp .env.example .env
nano .env  # 修改密码和密钥

# 启动服务
docker-compose up -d --build
```

### 方法五：Git克隆

```bash
# 克隆仓库
git clone https://github.com/your-username/cultivation-game.git
cd cultivation-game

# 一键启动
chmod +x start.sh
./start.sh
```

## 📋 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 5GB+ 磁盘空间

## 🎯 默认账户

- **管理员**: admin / password
- **数据库**: cultivation_user / cultivation_pass_2024

⚠️ **生产环境请务必修改默认密码！**

## 📖 详细文档

- [部署指南](DEPLOY.md) - 完整的部署和配置说明
- [开发计划](PLANmd) - 功能开发路线图

## 🛠️ 技术栈

### 前端
- **Vue 3** - 响应式前端框架
- **原生CSS** - 精美的修仙主题UI
- **Axios** - HTTP请求库

### 后端
- **PHP 8.1** - 服务端语言
- **MySQL 8.0** - 数据库
- **Apache** - Web服务器
- **JWT** - 身份认证

### 部署
- **Docker** - 容器化部署
- **Docker Compose** - 多容器编排

## 🎮 游戏截图

### 登录界面
- 精美的修仙主题设计
- 支持用户注册和登录

### 游戏主界面
- 实时状态显示（生命值、灵力值、修为）
- 多标签页布局，功能丰富

### 修炼系统
- 手动修炼：打坐冥想、阵法修炼
- 自动修炼：离线挂机，三种修炼方式

### 战斗系统
- 回合制战斗
- 多种技能和策略

## 🔧 开发和贡献

### 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd cultivation-game

# 2. 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 3. 访问开发环境
# 前端: http://localhost:8080
# API: http://localhost:8080/api/test
# 数据库: http://localhost:8081
```

### 项目结构

```
cultivation-game/
├── api/                 # PHP后端API
│   ├── auth.php        # 用户认证
│   ├── game.php        # 游戏数据
│   ├── chat.php        # 聊天系统
│   ├── cultivation.php # 自动修炼
│   ├── quests.php      # 任务系统
│   └── config.php      # 配置文件
├── index.html          # 前端主页面
├── game.js            # 游戏逻辑
├── style.css          # 样式文件
├── docker-compose.yml # Docker配置
└── DEPLOY.md          # 部署文档
```

## 📝 更新日志

### v1.0.0 (当前版本)
- ✅ 基础游戏系统
- ✅ 用户认证和数据持久化
- ✅ 自动修炼系统
- ✅ 任务系统
- ✅ Docker容器化部署

### 计划中功能
- 🔄 PVP对战系统
- 🔄 好友系统
- 🔄 移动端适配
- 🔄 更多修炼境界
- 🔄 大世界地图

## 📞 支持

如果遇到问题：

1. 查看 [部署指南](DEPLOY.md)
2. 检查Docker日志：`docker-compose logs -f`
3. 提交Issue或联系开发者

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**开始你的修仙之旅吧！** 🚀✨