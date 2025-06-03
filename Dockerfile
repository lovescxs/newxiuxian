# 使用官方PHP Apache镜像
FROM php:8.1-apache

# 设置标签信息
LABEL maintainer="your-email@example.com"
LABEL description="修仙世界 - 网页修仙游戏"
LABEL version="1.0.0"

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    zip \
    unzip \
    git \
    curl \
    nano \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install pdo pdo_mysql mysqli zip mbstring \
    && a2enmod rewrite \
    && a2enmod headers \
    && rm -rf /var/lib/apt/lists/*

# 设置PHP配置
RUN echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/docker-php-memlimit.ini \
    && echo "upload_max_filesize = 64M" >> /usr/local/etc/php/conf.d/docker-php-uploads.ini \
    && echo "post_max_size = 64M" >> /usr/local/etc/php/conf.d/docker-php-uploads.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/docker-php-time.ini

# 设置工作目录
WORKDIR /var/www/html

# 复制项目文件（分层复制以优化缓存）
COPY api/ /var/www/html/api/
COPY *.html *.js *.css /var/www/html/
COPY .htaccess /var/www/html/

# 设置文件权限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod 644 /var/www/html/.htaccess

# 创建Apache配置
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    ServerName localhost\n\
    \n\
    <Directory /var/www/html>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    \n\
    # API路由重写\n\
    <Directory /var/www/html/api>\n\
        RewriteEngine On\n\
        RewriteCond %{REQUEST_FILENAME} !-f\n\
        RewriteCond %{REQUEST_FILENAME} !-d\n\
        RewriteRule ^(.*)$ index.php [QSA,L]\n\
    </Directory>\n\
    \n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# 暴露端口
EXPOSE 80

# 启动Apache
CMD ["apache2-foreground"]
