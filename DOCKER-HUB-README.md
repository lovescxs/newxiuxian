# 🏮 修仙世界 - 网页修仙游戏

[![Docker Pulls](https://img.shields.io/docker/pulls/your-dockerhub-username/cultivation-game)](https://hub.docker.com/r/your-dockerhub-username/cultivation-game)
[![Docker Image Size](https://img.shields.io/docker/image-size/your-dockerhub-username/cultivation-game)](https://hub.docker.com/r/your-dockerhub-username/cultivation-game)
[![Docker Image Version](https://img.shields.io/docker/v/your-dockerhub-username/cultivation-game)](https://hub.docker.com/r/your-dockerhub-username/cultivation-game)

一个基于Vue 3和PHP的现代化修仙主题网页游戏，支持多人在线、实时聊天、自动修炼等功能。

## ✨ 主要功能

- 🧘 **修炼系统**: 手动修炼 + 自动修炼（离线挂机）
- ⚔️ **战斗系统**: 回合制战斗，技能连招
- 🗺️ **探索系统**: 多地图探索，随机遭遇
- 💊 **炼丹系统**: 收集材料炼制丹药
- 📋 **任务系统**: 日常任务、周常任务
- 🏛️ **宗门系统**: 加入宗门，获得加成
- 💬 **聊天系统**: 实时江湖聊天
- 🏅 **排行榜**: 等级榜、财富榜、战力榜

## 🚀 快速开始

### 方法一：一键部署（推荐）

```bash
# 一键安装并启动
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/docker-hub-install.sh | bash
```

### 方法二：单容器运行

```bash
# 仅运行游戏容器（需要外部数据库）
docker run -d \
  --name cultivation-game \
  -p 8080:80 \
  -e DB_HOST=your-mysql-host \
  -e DB_NAME=cultivation_game \
  -e DB_USER=your-db-user \
  -e DB_PASS=your-db-password \
  your-dockerhub-username/cultivation-game:latest
```

### 方法三：使用docker-compose

1. **下载配置文件**：
```bash
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/docker-compose.hub.yml -o docker-compose.yml
```

2. **启动服务**：
```bash
docker-compose up -d
```

## 🔧 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DB_HOST` | `db` | 数据库主机 |
| `DB_NAME` | `cultivation_game` | 数据库名称 |
| `DB_USER` | `cultivation_user` | 数据库用户名 |
| `DB_PASS` | `cultivation_pass_2024` | 数据库密码 |
| `API_SECRET_KEY` | `cultivation_secret_key_2024` | API密钥 |
| `JWT_SECRET` | `cultivation_jwt_secret_2024` | JWT密钥 |

## 📋 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| `80` | Web服务 | 游戏主页面 |
| `3306` | MySQL | 数据库服务 |
| `8081` | phpMyAdmin | 数据库管理 |

## 🎯 默认账户

- **管理员**: `admin` / `password`
- **数据库**: `cultivation_user` / `cultivation_pass_2024`

⚠️ **生产环境请务必修改默认密码！**

## 📖 完整部署示例

```yaml
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
      - DB_PASS=your_secure_password
      - API_SECRET_KEY=your_secure_api_key
      - JWT_SECRET=your_secure_jwt_secret
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: cultivation_game_db
    environment:
      MYSQL_ROOT_PASSWORD: your_secure_root_password
      MYSQL_DATABASE: cultivation_game
      MYSQL_USER: cultivation_user
      MYSQL_PASSWORD: your_secure_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    environment:
      PMA_HOST: db
      PMA_USER: cultivation_user
      PMA_PASSWORD: your_secure_password
    ports:
      - "8081:80"
    depends_on:
      - db
    restart: unless-stopped

volumes:
  mysql_data:
```

## 🛠️ 技术栈

- **前端**: Vue 3, 原生CSS
- **后端**: PHP 8.1, Apache
- **数据库**: MySQL 8.0
- **容器**: Docker, Docker Compose

## 📱 访问地址

部署成功后访问：

- **游戏主页**: http://localhost:8080
- **数据库管理**: http://localhost:8081
- **API测试**: http://localhost:8080/api/test

## 🔧 管理命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f web
docker-compose logs -f db

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 备份数据库
docker-compose exec db mysqldump -u cultivation_user -p cultivation_game > backup.sql

# 进入容器
docker-compose exec web bash
docker-compose exec db mysql -u cultivation_user -p
```

## 🐛 故障排除

### 1. 容器启动失败
```bash
# 查看详细日志
docker-compose logs web
docker-compose logs db

# 检查端口占用
netstat -tlnp | grep :8080
```

### 2. 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"

# 重置数据库密码
docker-compose exec db mysql -u root -p -e "ALTER USER 'cultivation_user'@'%' IDENTIFIED BY 'new_password';"
```

### 3. 权限问题
```bash
# 修复文件权限
docker-compose exec web chown -R www-data:www-data /var/www/html
```

## 📚 相关链接

- **GitHub仓库**: https://github.com/your-username/cultivation-game
- **在线安装器**: https://your-domain.com/web-installer.html
- **部署文档**: https://github.com/your-username/cultivation-game/blob/main/DEPLOY.md
- **问题反馈**: https://github.com/your-username/cultivation-game/issues

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](https://github.com/your-username/cultivation-game/blob/main/LICENSE) 文件了解详情。

---

**开始你的修仙之旅吧！** 🚀✨
