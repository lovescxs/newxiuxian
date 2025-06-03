# 修仙世界游戏 - Docker部署指南

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB RAM
- 至少 5GB 磁盘空间

## 快速部署

### 1. 克隆项目到VPS

```bash
# 上传项目文件到VPS
scp -r . user@your-vps-ip:/path/to/cultivation-game/
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（重要：修改密码和密钥）
nano .env
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用

- **游戏主页**: http://your-vps-ip:8080
- **数据库管理**: http://your-vps-ip:8081 (phpMyAdmin)
- **API测试**: http://your-vps-ip:8080/api/test

## 默认账户

- **管理员账户**: admin / password
- **数据库**: cultivation_user / cultivation_pass_2024

## 服务管理

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f web
docker-compose logs -f db
```

### 备份数据库
```bash
# 创建数据库备份
docker-compose exec db mysqldump -u cultivation_user -p cultivation_game > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据库
```bash
# 恢复数据库
docker-compose exec -T db mysql -u cultivation_user -p cultivation_game < backup_file.sql
```

## 生产环境配置

### 1. 安全配置

**修改默认密码和密钥**:
```bash
# 编辑 .env 文件
nano .env

# 修改以下配置
DB_PASS=your_secure_password
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_password
API_SECRET_KEY=your_secure_api_key
JWT_SECRET=your_secure_jwt_secret
```

### 2. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 8080/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 3. 反向代理 (推荐)

使用Nginx作为反向代理:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL证书 (推荐)

使用Let's Encrypt获取免费SSL证书:

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 监控和维护

### 1. 系统监控

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h
```

### 2. 日志管理

```bash
# 清理Docker日志
docker system prune -f

# 设置日志轮转
# 编辑 docker-compose.yml 添加日志配置
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 定期备份

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T db mysqldump -u cultivation_user -p$MYSQL_PASSWORD cultivation_game > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

设置定时任务:
```bash
# 编辑crontab
crontab -e

# 添加每日备份任务（每天凌晨2点）
0 2 * * * /path/to/backup.sh
```

## 故障排除

### 1. 容器无法启动

```bash
# 查看详细错误信息
docker-compose logs web
docker-compose logs db

# 检查端口占用
netstat -tlnp | grep :8080
```

### 2. 数据库连接失败

```bash
# 检查数据库容器状态
docker-compose ps db

# 进入数据库容器
docker-compose exec db mysql -u root -p

# 检查用户权限
SHOW GRANTS FOR 'cultivation_user'@'%';
```

### 3. API请求失败

```bash
# 测试API连接
curl http://localhost:8080/api/test

# 检查Apache错误日志
docker-compose logs web | grep error
```

### 4. 性能优化

```bash
# 增加PHP内存限制
# 在Dockerfile中添加:
RUN echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/docker-php-memlimit.ini

# 优化MySQL配置
# 在docker-compose.yml中添加:
command: --innodb-buffer-pool-size=128M --max-connections=100
```

## 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose up -d --build

# 如果有数据库更新，运行迁移
docker-compose exec web php api/migrate.php
```

## 联系支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本
2. 系统资源使用情况
3. 防火墙和网络配置
4. 日志文件中的错误信息
