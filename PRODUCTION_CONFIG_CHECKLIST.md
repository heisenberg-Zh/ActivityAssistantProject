# 🔧 生产环境配置清单

**更新时间:** 2025-01-30
**版本:** 1.0

---

## ✅ 已完成的配置更新

根据提供的信息，以下配置已自动更新为实际参数：

### 1. 小程序配置

**AppID:** `wx92bf60c1218c0abc`

**已更新文件:**
- ✅ `project.config.json` - 第36行（已是正确的AppID）
- ✅ `utils/config.js` - 第74行（已是正确的AppID）
- ✅ `backend/src/main/resources/application-dev.yml` - 第71行
- ✅ `backend/src/main/resources/application-prod.yml` - 第76行（设置默认值）

### 2. 腾讯地图配置

**地图Key:** `56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ`

**已更新文件:**
- ✅ `utils/config.js` - 第59行

### 3. 服务器域名配置

**域名/IP:** `47.104.94.67`
**端口:** `8082`

**已更新文件:**
- ✅ `utils/config.js` - 第21行（生产环境API地址：`http://47.104.94.67:8082`）
- ✅ `backend/src/main/resources/application-prod.yml` - 第9行（数据库地址）
- ✅ `backend/src/main/resources/application-prod.yml` - 第72行（CORS配置）
- ✅ `backend/sql/.env.example` - 第13行（数据库主机）
- ✅ `backend/sql/.env.example` - 第33行（Redis主机）
- ✅ `backend/sql/.env.example` - 第66行（CORS来源）

---

## ⚠️ 重要：还需要您配置的参数

以下配置需要您手动设置或提供信息：

### 1. 微信小程序 AppSecret

**状态:** ❌ 未配置（必需）

**说明:**
- 微信小程序的 AppSecret 是敏感信息，需要您从微信公众平台获取
- 登录 https://mp.weixin.qq.com
- 进入"开发" → "开发管理" → "开发设置"
- 查看"开发者ID"下的 AppSecret

**配置方式:**

**方式1: 通过环境变量（推荐）**
```bash
# Linux/macOS
export WECHAT_APP_SECRET=你的AppSecret

# Windows
set WECHAT_APP_SECRET=你的AppSecret
```

**方式2: 修改 .env 文件**
复制 `backend/sql/.env.example` 为 `backend/sql/.env`，然后修改：
```env
WECHAT_APP_SECRET=你的AppSecret
```

**位置:**
- `backend/src/main/resources/application-prod.yml` - 第77行

### 2. JWT 密钥

**状态:** ❌ 未配置（必需）

**说明:**
- JWT 密钥用于生成和验证用户登录Token
- 必须是强随机字符串，至少32位

**生成方式:**

**Linux/macOS:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**配置方式:**
```bash
# 设置环境变量
export JWT_SECRET=你生成的随机密钥

# 或在 .env 文件中配置
JWT_SECRET=你生成的随机密钥
```

**位置:**
- `backend/sql/.env.example` - 第58行
- `backend/src/main/resources/application-prod.yml` - 第68行

### 3. 数据库密码

**状态:** ⚠️ 需要修改

**说明:**
- 默认密码为 `Change_This_Strong_Password_2025!@#`
- 生产环境必须修改为强密码

**配置位置:**
- `backend/sql/.env.example` - 第23行

**推荐密码强度:**
- 至少16位
- 包含大小写字母、数字、特殊字符
- 不使用字典单词或常见密码

### 4. Redis 密码（如果启用了密码）

**状态:** ⚠️ 可选

**说明:**
- 如果您的Redis服务器设置了密码，需要配置

**配置位置:**
- `backend/sql/.env.example` - 第38行

```env
REDIS_PASSWORD=你的Redis密码
```

### 5. 文件上传路径

**状态:** ⚠️ 需要确认

**当前配置:** `/app/uploads`

**说明:**
- 确保该路径在服务器上存在且应用有写权限
- 或修改为实际的上传路径

**配置位置:**
- `backend/src/main/resources/application-prod.yml` - 第82行

---

## 📱 微信小程序域名配置

**重要提示:** 由于使用的是IP地址（`47.104.94.67`）而非域名，需要特别注意：

### 开发阶段

在微信开发者工具中，需要**禁用域名校验**：

1. 打开微信开发者工具
2. 点击右上角"详情"
3. 进入"本地设置"
4. ✅ 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

### 正式发布

**方案1: 使用域名（强烈推荐）**

为服务器申请域名并配置SSL证书，然后在微信公众平台配置：

1. 登录 https://mp.weixin.qq.com
2. 进入"开发" → "开发管理" → "开发设置"
3. 在"服务器域名"中配置：
   - request合法域名: `https://yourdomain.com`
   - uploadFile合法域名: `https://yourdomain.com`
   - downloadFile合法域名: `https://yourdomain.com`

**方案2: 使用IP（不推荐，有限制）**

如果必须使用IP地址：

1. ⚠️ 微信小程序要求request域名必须是HTTPS
2. ⚠️ 不能使用IP地址，必须是已备案的域名
3. **建议尽快申请域名并配置SSL证书**

---

## 🔒 SSL/HTTPS 配置（强烈建议）

**当前状态:** ❌ 使用HTTP（不安全）

**说明:**
- 微信小程序正式发布时要求使用HTTPS
- 当前配置使用HTTP仅适用于开发测试
- 生产环境必须配置SSL证书

**配置步骤:**

1. **申请SSL证书**
   - 免费证书: Let's Encrypt (https://letsencrypt.org)
   - 或使用云服务商提供的证书

2. **配置Nginx反向代理**

创建 `/etc/nginx/sites-available/activity-assistant`:

```nginx
server {
    listen 80;
    server_name 47.104.94.67;  # 替换为实际域名

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 47.104.94.67;  # 替换为实际域名

    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 反向代理到后端
    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **更新配置文件**

修改 `utils/config.js`:
```javascript
production: {
  baseUrl: 'https://yourdomain.com',  // 使用HTTPS和域名
  useMock: false,
  description: '生产环境'
},
```

---

## 🗄️ 数据库部署

**状态:** ⚠️ 需要初始化

**步骤:**

1. **在服务器上安装MySQL 8.0+**

2. **执行初始化脚本**

```bash
# 上传SQL脚本到服务器
cd backend/sql

# 执行初始化
mysql -u root -p < init_all.sql
```

3. **创建数据库用户**

```sql
-- 创建专用用户
CREATE USER 'activity_user'@'%' IDENTIFIED BY '你的强密码';

-- 授予权限
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

4. **配置环境变量**

```bash
export DB_HOST=47.104.94.67
export DB_USERNAME=activity_user
export DB_PASSWORD=你的强密码
```

详细步骤请参考: `backend/sql/DATABASE_DEPLOYMENT.md`

---

## 🚀 后端部署

**Spring Boot 运行配置:**

### 方式1: 使用环境变量（推荐）

```bash
# 设置所有必需的环境变量
export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=47.104.94.67
export DB_USERNAME=activity_user
export DB_PASSWORD=你的数据库密码
export JWT_SECRET=你生成的JWT密钥
export WECHAT_APP_ID=wx92bf60c1218c0abc
export WECHAT_APP_SECRET=你的微信AppSecret
export REDIS_HOST=47.104.94.67
export REDIS_PASSWORD=你的Redis密码(如有)
export ALLOWED_ORIGINS=http://47.104.94.67,https://servicewechat.com

# 运行应用
cd backend
./mvnw spring-boot:run
```

### 方式2: 使用 .env 文件

```bash
# 复制环境变量模板
cp backend/sql/.env.example backend/sql/.env

# 编辑 .env 文件，填入所有必需的配置
vim backend/sql/.env

# 加载环境变量
source backend/sql/.env

# 运行应用
cd backend
./mvnw spring-boot:run
```

### 方式3: 打包部署

```bash
# 打包
cd backend
./mvnw clean package -DskipTests

# 运行JAR包
java -jar \
  -Dspring.profiles.active=prod \
  -DDB_HOST=47.104.94.67 \
  -DDB_USERNAME=activity_user \
  -DDB_PASSWORD=你的数据库密码 \
  -DJWT_SECRET=你的JWT密钥 \
  -DWECHAT_APP_ID=wx92bf60c1218c0abc \
  -DWECHAT_APP_SECRET=你的微信AppSecret \
  target/activity-assistant-*.jar
```

---

## ✅ 部署检查清单

使用此清单确保所有配置正确：

### 前端配置

- [x] 小程序 AppID 已配置: `wx92bf60c1218c0abc`
- [x] 腾讯地图 Key 已配置: `56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ`
- [x] 生产环境 API 地址已配置: `http://47.104.94.67:8082`
- [ ] 微信开发者工具已禁用域名校验（开发阶段）
- [ ] 微信公众平台已配置服务器域名（正式发布需要）

### 后端配置

- [x] 数据库地址已配置: `47.104.94.67`
- [ ] 数据库用户名已配置（需要您设置）
- [ ] 数据库密码已配置（需要您设置）
- [ ] JWT 密钥已生成并配置（需要您设置）
- [ ] 微信 AppSecret 已配置（需要您提供）
- [x] CORS 来源已配置
- [ ] Redis 已安装并配置（可选）

### 数据库

- [ ] MySQL 8.0+ 已安装
- [ ] 数据库初始化脚本已执行
- [ ] 数据库用户已创建并授权
- [ ] 可以从应用服务器连接到数据库

### 安全配置

- [ ] 生产环境密码已修改为强密码
- [ ] JWT密钥已生成为随机字符串
- [ ] 防火墙已配置（仅开放必要端口）
- [ ] SSL证书已配置（如使用HTTPS）
- [ ] .env 文件权限已设置: `chmod 600 .env`

### 测试验证

- [ ] 后端应用可以启动
- [ ] 可以连接到数据库
- [ ] 小程序可以调用后端API
- [ ] 微信登录功能正常
- [ ] 地图功能正常显示

---

## 📞 需要反馈的问题

为了更好地完成配置，请您反馈以下信息：

### 1. 微信小程序 AppSecret

**问题:** 您的微信小程序 AppSecret 是什么？

**获取方式:**
- 登录微信公众平台: https://mp.weixin.qq.com
- 进入"开发" → "开发管理" → "开发设置"
- 查看"AppSecret"（如忘记可重置）

### 2. 数据库配置

**问题:**
- 数据库用户名是什么？（默认为 `activity_user`）
- 数据库密码是什么？

### 3. Redis配置

**问题:**
- 是否安装了Redis？
- Redis是否设置了密码？如果有，密码是什么？

### 4. 域名和SSL

**问题:**
- 是否有域名？如果有，域名是什么？
- 是否已申请SSL证书？

### 5. 服务器环境

**问题:**
- 服务器操作系统是什么？（Linux/Windows）
- 服务器是否已安装MySQL 8.0+？
- 服务器是否已安装Java 17+？

---

## 📋 配置文件汇总

| 文件路径 | 配置项 | 当前值 | 说明 |
|---------|--------|--------|------|
| `project.config.json` | appid | wx92bf60c1218c0abc | ✅ 已配置 |
| `utils/config.js` | baseUrl (production) | http://47.104.94.67:8082 | ✅ 已配置 |
| `utils/config.js` | MAP_CONFIG.key | 56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ | ✅ 已配置 |
| `utils/config.js` | WX_CONFIG.appId | wx92bf60c1218c0abc | ✅ 已配置 |
| `application-prod.yml` | datasource.url | jdbc:mysql://47.104.94.67:3306/... | ✅ 已配置 |
| `application-prod.yml` | wechat.app-id | wx92bf60c1218c0abc (默认) | ✅ 已配置 |
| `application-prod.yml` | wechat.app-secret | ${WECHAT_APP_SECRET} | ❌ 需要您配置 |
| `application-prod.yml` | jwt.secret | ${JWT_SECRET} | ❌ 需要您配置 |
| `.env.example` | DB_HOST | 47.104.94.67 | ✅ 已配置 |
| `.env.example` | REDIS_HOST | 47.104.94.67 | ✅ 已配置 |
| `.env.example` | ALLOWED_ORIGINS | http://47.104.94.67,... | ✅ 已配置 |

---

**配置清单版本:** 1.0
**最后更新:** 2025-01-30

请根据此清单逐项检查并配置，如有任何问题请及时反馈! 🚀
