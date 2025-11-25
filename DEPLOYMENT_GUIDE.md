# ActivityAssistant 小程序部署操作指南

> **文档版本**: v1.0
> **更新日期**: 2025-11-25
> **适用对象**: 项目部署人员
> **预计部署时间**: 15-30天（主要等待ICP备案）

---

## 📋 目录

1. [部署前准备](#1-部署前准备)
2. [服务器环境搭建](#2-服务器环境搭建)
3. [域名与证书配置](#3-域名与证书配置)
4. [数据库部署](#4-数据库部署)
5. [后端应用部署](#5-后端应用部署)
6. [前端配置与发布](#6-前端配置与发布)
7. [微信公众平台配置](#7-微信公众平台配置)
8. [测试与上线](#8-测试与上线)
9. [常见问题解决](#9-常见问题解决)

---

## 1. 部署前准备

### 1.1 账号注册

需要注册以下账号：

| 账号 | 用途 | 注册地址 | 费用 |
|------|------|----------|------|
| 云服务商账号 | 服务器、数据库 | 阿里云/腾讯云/AWS等 | 按需付费 |
| 域名注册商 | 购买域名 | 万网/新网/GoDaddy等 | ￥50-200/年 |
| 微信公众平台 | 小程序管理 | https://mp.weixin.qq.com | 免费 |
| 腾讯地图平台 | 地图API | https://lbs.qq.com | 免费额度 |

### 1.2 材料准备

准备以下材料（用于ICP备案）：

- [ ] 企业营业执照扫描件（或个人身份证）
- [ ] 法人身份证正反面照片
- [ ] 手机号码和邮箱
- [ ] 企业公章（企业备案需要）

### 1.3 预算评估

| 项目 | 推荐配置 | 预算（年） |
|------|----------|-----------|
| 云服务器 | 2核4G内存40G硬盘 | ￥500-1200 |
| 域名 | .com/.cn | ￥50-200 |
| SSL证书 | 免费证书 | ￥0 |
| 云数据库（可选） | MySQL 1核1G | ￥200-800 |
| **合计** | - | **￥750-2200** |

> 💡 **提示**: 建议购买1-3年套餐，优惠幅度更大

---

## 2. 服务器环境搭建

### 2.1 购买云服务器

**推荐配置**：
```
CPU: 2核或以上
内存: 4GB或以上
硬盘: 40GB SSD
带宽: 1-5Mbps
操作系统: Ubuntu 20.04 LTS 或 CentOS 7+
```

**购买步骤**（以阿里云为例）：
1. 登录阿里云控制台
2. 进入"云服务器ECS" > "实例" > "创建实例"
3. 选择配置：
   - 地域：选择离用户最近的区域
   - 实例规格：计算型 c6 或 s6
   - 操作系统：Ubuntu 20.04 64位
4. 设置安全组规则（开放端口）：
   - 22端口（SSH）
   - 80端口（HTTP）
   - 443端口（HTTPS）
   - 8082端口（临时调试用）
5. 设置root密码，记录保存

### 2.2 连接服务器

**Windows用户**：
```bash
# 使用 PuTTY 或 Xshell 连接
# 或使用 PowerShell
ssh root@your-server-ip
```

**Mac/Linux用户**：
```bash
ssh root@your-server-ip
```

### 2.3 安装基础环境

登录服务器后，执行以下命令：

#### a. 更新系统
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

#### b. 安装 JDK 17
```bash
# Ubuntu/Debian
apt install openjdk-17-jdk -y

# CentOS/RHEL
yum install java-17-openjdk java-17-openjdk-devel -y

# 验证安装
java -version
# 应显示 openjdk version "17.x.x"
```

#### c. 安装 Nginx
```bash
# Ubuntu/Debian
apt install nginx -y

# CentOS/RHEL
yum install nginx -y

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx

# 验证安装
nginx -v
```

#### d. 安装 MySQL 8.0
```bash
# Ubuntu/Debian
apt install mysql-server -y

# CentOS/RHEL
# 先添加 MySQL 官方仓库
wget https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm
yum localinstall mysql80-community-release-el7-3.noarch.rpm -y
yum install mysql-community-server -y

# 启动并设置开机自启
systemctl start mysql
systemctl enable mysql

# 安全配置（设置root密码）
mysql_secure_installation
# 按提示操作：
# - 设置 root 密码（强密码，记录保存）
# - 移除匿名用户：Yes
# - 禁止 root 远程登录：Yes
# - 移除测试数据库：Yes
# - 重新加载权限表：Yes
```

#### e. 安装 Redis（可选，用于缓存）
```bash
# Ubuntu/Debian
apt install redis-server -y

# CentOS/RHEL
yum install redis -y

# 启动并设置开机自启
systemctl start redis
systemctl enable redis

# 设置Redis密码
redis-cli
# 在 redis-cli 中执行：
CONFIG SET requirepass your_redis_password
CONFIG REWRITE
EXIT
```

#### f. 安装 Git
```bash
# Ubuntu/Debian
apt install git -y

# CentOS/RHEL
yum install git -y

# 验证安装
git --version
```

---

## 3. 域名与证书配置

### 3.1 购买域名

1. 访问域名注册商（如阿里云万网）
2. 搜索并购买域名（建议选择 .com 或 .cn）
3. 完成实名认证

### 3.2 ICP备案

> ⚠️ **重要**: 域名备案是关键瓶颈，需要10-20天，建议尽早启动

**备案步骤**（以阿里云为例）：

1. 登录阿里云备案系统：https://beian.aliyun.com
2. 点击"开始备案"
3. 填写主体信息（企业或个人）
4. 填写网站信息：
   - 网站名称：ActivityAssistant活动助手
   - 网站内容：活动管理工具
   - 服务类型：小程序
5. 上传材料：
   - 营业执照/身份证
   - 法人身份证
   - 网站备案承诺书（系统生成）
6. 提交初审（1-2个工作日）
7. 现场核验（部分地区需要）
8. 管局审核（7-20个工作日）
9. 备案成功，获得备案号

### 3.3 域名解析

备案通过后，配置域名解析：

1. 登录域名控制台
2. 找到你的域名 > "解析设置"
3. 添加A记录：
   ```
   记录类型: A
   主机记录: @
   记录值: 你的服务器公网IP
   TTL: 600
   ```
4. 添加www记录：
   ```
   记录类型: A
   主机记录: www
   记录值: 你的服务器公网IP
   TTL: 600
   ```
5. 等待解析生效（5-10分钟）
6. 验证解析：
   ```bash
   ping yourdomain.com
   # 应返回你的服务器IP
   ```

### 3.4 申请SSL证书

**方式一：使用免费证书（推荐）**

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y  # Ubuntu
# 或
yum install certbot python3-certbot-nginx -y  # CentOS

# 申请证书（自动配置Nginx）
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 按提示输入：
# - 邮箱地址（用于续期通知）
# - 同意服务条款：Yes
# - 是否接收邮件：根据需要选择
# - 选择：2 (Redirect - 强制HTTPS)

# 验证证书
certbot certificates

# 设置自动续期（Let's Encrypt证书3个月有效）
crontab -e
# 添加以下行：
0 0 1 * * certbot renew --quiet
```

**方式二：使用云服务商证书**

1. 登录云服务商控制台（阿里云/腾讯云）
2. 搜索"SSL证书"服务
3. 申请免费证书（DV单域名）
4. 填写域名并验证（DNS验证或文件验证）
5. 下载证书（选择Nginx格式）
6. 上传到服务器：
   ```bash
   mkdir -p /etc/nginx/ssl
   # 将证书文件上传到这个目录
   # - yourdomain.pem（证书文件）
   # - yourdomain.key（私钥文件）
   ```

---

## 4. 数据库部署

### 4.1 创建数据库和用户

```bash
# 登录 MySQL
mysql -u root -p
# 输入之前设置的root密码
```

在MySQL中执行：

```sql
-- 创建数据库
CREATE DATABASE activity_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 创建应用用户（生产环境不要使用root）
CREATE USER 'activity_user'@'localhost'
  IDENTIFIED BY 'your_strong_password_here';

-- 授予权限
GRANT ALL PRIVILEGES ON activity_assistant.*
  TO 'activity_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

**记录以下信息（稍后配置环境变量时使用）**：
```
数据库地址: localhost
数据库端口: 3306
数据库名: activity_assistant
用户名: activity_user
密码: [你设置的密码]
```

### 4.2 导入数据库结构

```bash
# 创建工作目录
mkdir -p /opt/activity-assistant
cd /opt/activity-assistant

# 从项目获取SQL脚本（假设已经通过Git克隆或上传）
# 如果还没有代码，先上传项目代码到服务器

# 执行SQL脚本
mysql -u activity_user -p activity_assistant < backend/scripts/create-tables.sql
mysql -u activity_user -p activity_assistant < backend/scripts/create-favorites-table.sql

# 验证表创建
mysql -u activity_user -p activity_assistant -e "SHOW TABLES;"
```

### 4.3 数据库优化（可选）

编辑MySQL配置文件：

```bash
# 编辑配置
nano /etc/mysql/mysql.conf.d/mysqld.cnf  # Ubuntu
# 或
nano /etc/my.cnf  # CentOS

# 在 [mysqld] 部分添加以下优化：
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 0
query_cache_type = 0

# 保存后重启MySQL
systemctl restart mysql
```

---

## 5. 后端应用部署

### 5.1 上传代码

**方式一：使用Git（推荐）**

```bash
cd /opt/activity-assistant

# 如果代码在GitHub/Gitee
git clone your-repository-url .

# 或者如果已有代码，拉取最新
git pull origin main
```

**方式二：使用SFTP工具**

使用 FileZilla 或 WinSCP 将本地 `backend` 目录上传到服务器 `/opt/activity-assistant/backend`

### 5.2 配置环境变量

创建环境变量文件：

```bash
# 创建环境变量文件
nano /opt/activity-assistant/backend/.env.prod
```

填写以下内容（**请替换所有 `your_xxx` 为实际值**）：

```bash
# ==========================================
# ActivityAssistant 生产环境变量配置
# ==========================================

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=activity_assistant
DB_USERNAME=activity_user
DB_PASSWORD=your_strong_password_here

# Redis 配置（如果安装了Redis）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT 配置（必须使用强随机密钥）
# 生成方法：openssl rand -base64 48
JWT_SECRET=your_random_jwt_secret_at_least_64_characters_long

# 微信小程序配置
WECHAT_APP_ID=your_wechat_appid
WECHAT_APP_SECRET=your_wechat_appsecret

# CORS 配置（多个域名用逗号分隔）
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
```

**生成强密钥**：

```bash
# 生成JWT Secret（64字符）
openssl rand -base64 48

# 生成数据库密码（32字符）
openssl rand -base64 24

# 将生成的密钥填入上面的配置文件
```

### 5.3 编译打包

```bash
cd /opt/activity-assistant/backend

# 使用Maven打包（跳过测试以加快速度）
./mvnw clean package -DskipTests

# 或者如果没有Maven Wrapper
mvn clean package -DskipTests

# 打包完成后，JAR文件位于：
# target/activity-assistant-1.0.0.jar
```

如果打包失败，检查：
- JDK版本是否为17
- 网络是否能访问Maven仓库
- 查看错误日志

### 5.4 创建Systemd服务

创建服务配置文件：

```bash
nano /etc/systemd/system/activity-assistant.service
```

填写以下内容：

```ini
[Unit]
Description=ActivityAssistant Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/activity-assistant/backend
EnvironmentFile=/opt/activity-assistant/backend/.env.prod
ExecStart=/usr/bin/java -jar target/activity-assistant-1.0.0.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/activity-assistant/application.log
StandardError=append:/var/log/activity-assistant/error.log

[Install]
WantedBy=multi-user.target
```

创建日志目录并启动服务：

```bash
# 创建日志目录
mkdir -p /var/log/activity-assistant

# 重新加载systemd配置
systemctl daemon-reload

# 启动服务
systemctl start activity-assistant

# 设置开机自启
systemctl enable activity-assistant

# 检查服务状态
systemctl status activity-assistant

# 查看日志
tail -f /var/log/activity-assistant/application.log
```

**验证后端运行**：

```bash
# 检查端口是否监听
netstat -tlnp | grep 8082

# 测试健康检查接口
curl http://localhost:8082/api/health

# 应返回类似：
# {"status":"UP"}
```

### 5.5 配置Nginx反向代理

创建Nginx配置文件：

```bash
nano /etc/nginx/sites-available/activity-assistant
```

填写以下内容（**替换 yourdomain.com 为你的实际域名**）：

```nginx
# ActivityAssistant Nginx 配置

# HTTP 跳转到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 其他请求跳转HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 如果使用云服务商证书，路径改为：
    # ssl_certificate /etc/nginx/ssl/yourdomain.pem;
    # ssl_certificate_key /etc/nginx/ssl/yourdomain.key;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 日志
    access_log /var/log/nginx/activity-assistant-access.log;
    error_log /var/log/nginx/activity-assistant-error.log;

    # 反向代理后端API
    location /api/ {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket 支持（如果需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Swagger文档（生产环境建议关闭）
    # location /swagger-ui/ {
    #     proxy_pass http://localhost:8082;
    # }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

启用配置并重启Nginx：

```bash
# 创建软链接（启用站点）
ln -s /etc/nginx/sites-available/activity-assistant /etc/nginx/sites-enabled/

# 测试配置语法
nginx -t

# 应显示：
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 重启Nginx
systemctl reload nginx

# 或
systemctl restart nginx
```

**验证HTTPS访问**：

```bash
# 测试HTTPS API
curl https://yourdomain.com/api/health

# 应返回：
# {"status":"UP"}
```

---

## 6. 前端配置与发布

### 6.1 更新前端配置

在本地修改前端配置文件：

**文件**: `utils/config.js`

```javascript
// 修改第11行，将生产环境API地址改为你的域名
const CONFIG = {
  development: {
    baseUrl: 'http://localhost:8082',
    useMock: false
  },
  production: {
    baseUrl: 'https://yourdomain.com',  // ← 修改为你的实际域名
    useMock: false
  },
  mock: {
    baseUrl: '',
    useMock: true
  }
};

// 修改第59行，填入腾讯地图Key
const TENCENT_MAP_CONFIG = {
  key: 'your_tencent_map_key',  // ← 填入你申请的Key
  referer: 'ActivityAssistant'
};
```

**文件**: `project.config.json`

```json
{
  "appid": "your_wechat_appid",  // ← 替换为你的小程序AppID
  "projectname": "ActivityAssistant",
  ...
}
```

### 6.2 申请腾讯地图Key

1. 访问腾讯位置服务：https://lbs.qq.com
2. 注册并登录
3. 进入控制台 > "应用管理" > "创建应用"
4. 填写信息：
   - 应用名称：ActivityAssistant
   - 应用类型：微信小程序
5. 添加Key：
   - Key名称：ActivityAssistant
   - 绑定小程序AppID：填入你的AppID
6. 保存并复制Key，填入上面的配置文件

### 6.3 上传代码到微信开发者工具

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目路径：选择本地项目目录
4. AppID：填入你的小程序AppID
5. 检查配置：
   - 右上角 "详情" > "本地设置"
   - ✅ 确保"不校验合法域名..."已**取消勾选**
6. 点击右上角 "上传"
7. 填写版本号和备注：
   - 版本号：1.0.0
   - 备注：初始版本
8. 点击"上传"
9. 上传完成后，在微信公众平台可以看到

---

## 7. 微信公众平台配置

### 7.1 配置服务器域名

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入"开发" > "开发管理" > "开发设置"
3. 向下滚动到"服务器域名"
4. 点击"修改"
5. 配置以下域名（**全部使用HTTPS**）：

```
request合法域名：
https://yourdomain.com

uploadFile合法域名：
https://yourdomain.com

downloadFile合法域名：
https://yourdomain.com
```

6. 点击"保存并提交"
7. 扫码验证（使用管理员微信）

### 7.2 配置业务域名

1. 在同一页面，向下滚动到"业务域名"
2. 点击"修改"
3. 添加：`yourdomain.com`
4. 下载校验文件
5. 将校验文件上传到服务器：
   ```bash
   # 上传到 Nginx 静态文件目录
   mv downloaded-file.txt /var/www/html/
   ```
6. 点击"保存并提交"

### 7.3 开启接口权限

1. 进入"开发" > "接口设置"
2. 确保以下权限已开启：
   - ✅ 获取当前位置
   - ✅ 获取用户信息
   - ✅ 发送模板消息（可选）

---

## 8. 测试与上线

### 8.1 体验版测试

1. 在微信公众平台 > "管理" > "版本管理"
2. 找到刚上传的版本
3. 点击"设为体验版"
4. 扫码生成体验版二维码
5. 添加体验成员：
   - "成员管理" > "体验成员"
   - 添加微信号（最多15人）
6. 体验成员扫码测试

**测试清单**：

- [ ] 登录功能
- [ ] 浏览活动列表
- [ ] 创建活动
- [ ] 报名活动
- [ ] 签到功能（测试定位）
- [ ] 收藏功能
- [ ] 消息通知
- [ ] 统计页面
- [ ] 评价功能

### 8.2 提交审核

确认体验版测试通过后：

1. 返回"版本管理"
2. 点击"提交审核"
3. 填写审核信息：
   - 功能页面：选择至少2个主要页面
   - 测试账号：提供测试账号密码
   - 补充说明：
     ```
     ActivityAssistant是一款活动管理工具小程序，
     主要功能包括：
     1. 活动创建与管理
     2. 活动报名与签到
     3. 数据统计与分析
     4. 用户互动与评价
     ```
4. 上传演示视频（可选但推荐）
5. 提交审核
6. 等待审核（通常1-7天）

### 8.3 发布上线

审核通过后：

1. 进入"版本管理"
2. 找到审核通过的版本
3. 点击"发布"
4. 确认发布

**发布后建议**：

- 在首页配置"附近的小程序"
- 生成小程序码推广
- 关注用户反馈
- 准备应急回滚方案

### 8.4 灰度发布（可选）

如果想先小范围测试：

1. 发布前点击"全量发布" 旁的下拉菜单
2. 选择"分阶段发布"
3. 设置发布比例（如5%、20%、50%）
4. 观察数据和反馈
5. 逐步扩大发布范围
6. 最终全量发布

---

## 9. 常见问题解决

### 9.1 服务器问题

**Q: 无法连接服务器SSH**
```bash
# 检查安全组是否开放22端口
# 检查密码是否正确
# 尝试重置密码
```

**Q: Nginx启动失败**
```bash
# 查看错误日志
journalctl -xe
nginx -t  # 检查配置语法

# 检查端口占用
netstat -tlnp | grep :80
```

**Q: 后端应用启动失败**
```bash
# 查看日志
journalctl -u activity-assistant -f
tail -f /var/log/activity-assistant/application.log

# 检查Java版本
java -version  # 必须是17

# 检查环境变量
cat /opt/activity-assistant/backend/.env.prod

# 检查数据库连接
mysql -u activity_user -p activity_assistant
```

### 9.2 数据库问题

**Q: 连接数据库失败**
```bash
# 检查MySQL是否运行
systemctl status mysql

# 检查用户权限
mysql -u root -p
SHOW GRANTS FOR 'activity_user'@'localhost';

# 重置用户密码
ALTER USER 'activity_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

**Q: 数据库表不存在**
```bash
# 重新执行SQL脚本
mysql -u activity_user -p activity_assistant < backend/scripts/create-tables.sql
```

### 9.3 域名与证书问题

**Q: 域名无法访问**
```bash
# 检查DNS解析
ping yourdomain.com
nslookup yourdomain.com

# 检查Nginx配置
nginx -t
systemctl status nginx
```

**Q: SSL证书错误**
```bash
# 检查证书文件权限
ls -l /etc/letsencrypt/live/yourdomain.com/

# 手动续期证书
certbot renew

# 查看证书有效期
certbot certificates
```

### 9.4 微信小程序问题

**Q: 请求失败 "不在合法域名列表中"**
- 检查微信公众平台是否配置了服务器域名
- 确保使用HTTPS（不能用HTTP）
- 域名必须已备案
- 重新打开小程序（清除缓存）

**Q: 定位功能失败**
- 检查是否开启"获取当前位置"权限
- 检查腾讯地图Key是否正确
- 检查Key是否绑定了小程序AppID

**Q: 登录失败**
- 检查AppID和AppSecret是否正确
- 检查服务器环境变量配置
- 查看后端日志

### 9.5 性能优化

**数据库优化**：
```sql
-- 添加索引
ALTER TABLE activities ADD INDEX idx_start_time (start_time);
ALTER TABLE registrations ADD INDEX idx_created_at (created_at);

-- 分析慢查询
SHOW VARIABLES LIKE 'slow_query%';
SET GLOBAL slow_query_log = 'ON';
```

**服务器优化**：
```bash
# 调整文件描述符限制
ulimit -n 65535

# 优化内核参数
sysctl -w net.core.somaxconn=1024
sysctl -w net.ipv4.tcp_max_syn_backlog=2048
```

---

## 10. 监控与运维

### 10.1 日志管理

**查看后端日志**：
```bash
# 实时查看
tail -f /var/log/activity-assistant/application.log

# 查看错误日志
tail -f /var/log/activity-assistant/error.log

# 查看最近100行
tail -n 100 /var/log/activity-assistant/application.log

# 搜索关键字
grep "ERROR" /var/log/activity-assistant/application.log
```

**查看Nginx日志**：
```bash
# 访问日志
tail -f /var/log/nginx/activity-assistant-access.log

# 错误日志
tail -f /var/log/nginx/activity-assistant-error.log
```

**日志轮转**：
```bash
# 编辑日志轮转配置
nano /etc/logrotate.d/activity-assistant
```

```
/var/log/activity-assistant/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 root root
    sharedscripts
    postrotate
        systemctl reload activity-assistant > /dev/null 2>&1 || true
    endscript
}
```

### 10.2 备份策略

**数据库备份**：
```bash
# 创建备份脚本
nano /opt/scripts/backup-database.sh
```

```bash
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="activity_assistant"
DB_USER="activity_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# 压缩备份文件
gzip $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "数据库备份完成: ${DB_NAME}_${DATE}.sql.gz"
```

```bash
# 设置执行权限
chmod +x /opt/scripts/backup-database.sh

# 设置定时任务（每天凌晨2点备份）
crontab -e
# 添加：
0 2 * * * /opt/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

**代码备份**：
```bash
# 使用Git管理代码
cd /opt/activity-assistant
git add .
git commit -m "生产环境配置"
git push origin main
```

### 10.3 监控告警

**使用系统自带工具**：
```bash
# 安装监控工具
apt install htop iotop -y

# 查看系统资源
htop

# 查看磁盘IO
iotop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

**设置告警邮件**（可选）：
```bash
# 安装邮件工具
apt install mailutils -y

# 测试发送
echo "测试邮件" | mail -s "测试" your@email.com
```

---

## 11. 应急预案

### 11.1 服务异常处理

**后端服务宕机**：
```bash
# 查看服务状态
systemctl status activity-assistant

# 重启服务
systemctl restart activity-assistant

# 查看最近日志
journalctl -u activity-assistant -n 100

# 如果无法启动，回滚到上一版本
cd /opt/activity-assistant/backend
git log --oneline  # 查看提交历史
git checkout <上一个版本的commit-id>
./mvnw clean package -DskipTests
systemctl restart activity-assistant
```

**数据库连接问题**：
```bash
# 检查MySQL状态
systemctl status mysql

# 重启MySQL
systemctl restart mysql

# 检查连接数
mysql -u root -p -e "SHOW PROCESSLIST;"

# 如果连接数过多，增加最大连接数
mysql -u root -p
SET GLOBAL max_connections = 500;
```

### 11.2 紧急联系方式

建议准备以下联系方式列表：

- 云服务商客服电话
- 域名服务商客服电话
- 微信小程序客服
- 技术支持人员电话

---

## 12. 总结检查清单

在正式上线前，请确认以下所有项目：

### 服务器环境
- [ ] 服务器已购买并配置
- [ ] JDK 17已安装
- [ ] MySQL 8.0已安装并配置
- [ ] Nginx已安装并配置
- [ ] Redis已安装（可选）
- [ ] 防火墙规则已正确配置

### 域名与证书
- [ ] 域名已购买
- [ ] ICP备案已通过
- [ ] DNS解析已配置
- [ ] SSL证书已申请并配置
- [ ] HTTPS强制跳转已启用

### 数据库
- [ ] 数据库已创建
- [ ] 用户权限已配置
- [ ] 表结构已导入
- [ ] 数据库备份策略已设置

### 后端应用
- [ ] 代码已上传到服务器
- [ ] 环境变量已正确配置
- [ ] 应用已成功编译打包
- [ ] Systemd服务已配置
- [ ] 应用已启动并正常运行
- [ ] Nginx反向代理已配置
- [ ] HTTPS访问正常

### 前端配置
- [ ] API地址已更新为生产域名
- [ ] 腾讯地图Key已配置
- [ ] AppID已更新
- [ ] 代码已上传到微信开发者工具

### 微信平台
- [ ] 服务器域名已配置
- [ ] 业务域名已配置
- [ ] 接口权限已开启
- [ ] 体验版已测试通过
- [ ] 已提交审核

### 安全
- [ ] 所有密码均为强密码
- [ ] JWT Secret已使用随机密钥
- [ ] 数据库仅允许本地访问
- [ ] 敏感端口已关闭
- [ ] CORS配置正确

### 监控与运维
- [ ] 日志轮转已配置
- [ ] 数据库备份已设置
- [ ] 监控工具已安装
- [ ] 应急预案已准备

---

## 13. 获取帮助

如果在部署过程中遇到问题，可以通过以下方式获取帮助：

1. **查看项目文档**：
   - CLAUDE.md - 项目开发指南
   - README.md - 快速开始指南
   - API_SECURITY_SPEC.md - API安全规范

2. **查看日志**：
   - 后端日志：`/var/log/activity-assistant/application.log`
   - Nginx日志：`/var/log/nginx/activity-assistant-error.log`

3. **云服务商支持**：
   - 阿里云工单：https://workorder.console.aliyun.com
   - 腾讯云工单：https://console.cloud.tencent.com/workorder

4. **微信开放社区**：
   - https://developers.weixin.qq.com/community/

---

**祝部署顺利！🚀**

如有任何问题，请及时记录并寻求技术支持。
