# 📦 ActivityAssistant 项目打包部署完整指南

**版本:** 1.0
**最后更新:** 2025-01-30
**适用工具:** IntelliJ IDEA + 微信开发者工具

---

## 📋 目录

- [打包前准备](#打包前准备)
- [后端打包（Spring Boot）](#后端打包spring-boot)
- [前端打包（微信小程序）](#前端打包微信小程序)
- [部署流程](#部署流程)
- [验证测试](#验证测试)
- [常见问题](#常见问题)

---

## 打包前准备

### ✅ 检查清单

在开始打包前，请确认以下事项：

#### 1. 配置文件检查

- [x] **后端配置已更新**
  - `application-prod.yml` 中的数据库地址已配置为 `47.104.94.67`
  - 微信 AppID 已配置: `wx92bf60c1218c0abc`
  - 微信 AppSecret 已配置: `9830896ed8dc4314e44b2285a9c211e4`
  - JWT 密钥已配置: `HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG`

- [x] **前端配置已更新**
  - `utils/config.js` 中生产环境 API 地址: `http://47.104.94.67:8082`
  - 腾讯地图 Key 已配置: `56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ`
  - 小程序 AppID 已配置: `wx92bf60c1218c0abc`

#### 2. 环境检查

**后端环境:**
- [ ] JDK 17+ 已安装
- [ ] Maven 已配置（IDEA 内置或独立安装）

**前端环境:**
- [ ] 微信开发者工具已安装
- [ ] 已登录微信开发者账号

#### 3. 代码检查

- [ ] 所有代码已提交到 Git（推荐）
- [ ] 无编译错误
- [ ] 已完成本地测试

---

## 后端打包（Spring Boot）

### 方式一：使用 IntelliJ IDEA 图形界面（推荐）

#### 步骤 1: 打开 Maven 面板

1. 在 IDEA 右侧找到 **Maven** 工具窗口
2. 如果没有显示，点击 `View` → `Tool Windows` → `Maven`

#### 步骤 2: 执行打包命令

**方法 A: 使用 Maven 生命周期（推荐）**

1. 在 Maven 面板中展开项目结构
2. 找到 `Lifecycle` 节点
3. 依次执行（双击）：
   ```
   ① clean   （清理旧的构建文件）
   ② package （打包项目）
   ```

![Maven打包示例](https://img-blog.csdnimg.cn/img_convert/maven-package-idea.png)

**方法 B: 使用 Maven 命令**

1. 在 Maven 面板上方找到 `Execute Maven Goal` 图标（像命令行的图标）
2. 输入以下命令：
   ```bash
   clean package -DskipTests
   ```
3. 点击 `Execute` 执行

**参数说明:**
- `clean`: 清理 target 目录
- `package`: 打包项目
- `-DskipTests`: 跳过测试（加快打包速度）

#### 步骤 3: 查看打包进度

在 IDEA 底部的 **Build** 或 **Console** 窗口中可以看到打包进度：

```
[INFO] Building jar: E:\project\ActivityAssistantProject\backend\target\activity-assistant-1.0.0.jar
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

#### 步骤 4: 找到打包文件

打包成功后，JAR 文件位于：

```
backend/target/activity-assistant-1.0.0.jar
```

**文件位置:**
- 完整路径: `E:\project\ActivityAssistantProject\backend\target\activity-assistant-1.0.0.jar`
- 文件大小: 约 50-80 MB

**快速定位:**
1. 在 IDEA 中右键 `backend/target` 目录
2. 选择 `Show in Explorer` (Windows) 或 `Reveal in Finder` (macOS)

### 方式二：使用 IDEA 内置终端

#### 步骤 1: 打开终端

1. 在 IDEA 底部点击 **Terminal** 标签
2. 或使用快捷键: `Alt + F12` (Windows) / `Option + F12` (macOS)

#### 步骤 2: 进入后端目录

```bash
cd backend
```

#### 步骤 3: 执行打包命令

**Windows:**
```cmd
mvnw.cmd clean package -DskipTests
```

**Linux/macOS:**
```bash
./mvnw clean package -DskipTests
```

#### 步骤 4: 等待打包完成

看到以下输出表示成功：
```
[INFO] BUILD SUCCESS
[INFO] Total time: xx.xxx s
```

### 方式三：使用独立 Maven（如已安装）

如果系统已安装独立的 Maven：

```bash
cd backend
mvn clean package -DskipTests
```

### 打包配置说明

#### 指定 Spring 配置文件

打包时会自动包含所有配置文件，运行时通过参数指定：

```bash
# 使用生产环境配置
java -jar activity-assistant-1.0.0.jar --spring.profiles.active=prod
```

#### 打包优化选项

**跳过测试（推荐）:**
```bash
-DskipTests
```

**完整打包（包含测试）:**
```bash
clean package
```

**并行构建（加速）:**
```bash
clean package -T 4 -DskipTests
```
（`-T 4` 表示使用 4 个线程）

### 验证打包结果

#### 检查 JAR 文件

```bash
# 进入 target 目录
cd backend/target

# Windows
dir *.jar

# Linux/macOS
ls -lh *.jar
```

应该看到类似输出：
```
activity-assistant-1.0.0.jar        (约 60 MB)
activity-assistant-1.0.0.jar.original (约 500 KB，Spring Boot 原始文件)
```

#### 本地测试运行

```bash
# 进入 target 目录
cd backend/target

# 运行 JAR 包（使用开发配置测试）
java -jar activity-assistant-1.0.0.jar --spring.profiles.active=dev
```

看到以下输出表示启动成功：
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.1)

...
Started ActivityApplication in 3.456 seconds
```

按 `Ctrl+C` 停止测试。

---

## 前端打包（微信小程序）

### 步骤 1: 打开微信开发者工具

1. 启动 **微信开发者工具**
2. 打开项目：选择 `E:\project\ActivityAssistantProject`

### 步骤 2: 切换到生产环境

**重要：修改环境配置**

编辑 `utils/config.js`，将第 11 行修改为：

```javascript
const CURRENT_ENV = 'production'; // 切换到生产环境
```

**修改前:**
```javascript
const CURRENT_ENV = 'development'; // 开发环境
```

**修改后:**
```javascript
const CURRENT_ENV = 'production'; // 生产环境
```

### 步骤 3: 编译小程序

#### 方法 A: 正式上传（推荐）

**适用场景:** 准备提交审核上线

1. 点击工具栏的 **上传** 按钮
2. 填写版本号和项目备注：
   ```
   版本号: 1.0.0
   项目备注: 初始版本，包含活动创建、报名、签到、评价等核心功能
   ```
3. 点击 **上传** 开始编译上传

**上传进度:**
```
[1/3] 编译代码...
[2/3] 压缩代码...
[3/3] 上传代码...
上传成功！
```

**上传后:**
- 代码会自动提交到微信公众平台
- 可以在微信公众平台管理后台查看版本
- 可以设置为体验版供测试

#### 方法 B: 预览模式（测试用）

**适用场景:** 真机测试

1. 点击工具栏的 **预览** 按钮
2. 会生成一个二维码
3. 用手机微信扫码即可在真机上测试

**预览特点:**
- 可以在真机上测试功能
- 不会提交到微信平台
- 有效期 24 小时

#### 方法 C: 本地编译（调试用）

**适用场景:** 检查编译错误

1. 点击菜单 `工具` → `构建 npm`（如使用了 npm 包）
2. 查看控制台的编译输出
3. 确认无错误

### 步骤 4: 配置域名校验

#### 开发/测试阶段

在微信开发者工具中：

1. 点击右上角 **详情**
2. 进入 **本地设置** 选项卡
3. ✅ 勾选 **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**

**原因:** 目前使用的是 HTTP + IP 地址，需要禁用校验

#### 正式发布阶段

⚠️ **重要提示:** 微信小程序正式发布要求：

1. **必须使用 HTTPS**（不能是 HTTP）
2. **必须使用已备案的域名**（不能是 IP 地址）
3. **必须在微信公众平台配置服务器域名**

**配置步骤:**

1. 登录微信公众平台: https://mp.weixin.qq.com
2. 进入 **开发** → **开发管理** → **开发设置**
3. 在 **服务器域名** 中配置：
   ```
   request合法域名: https://yourdomain.com
   uploadFile合法域名: https://yourdomain.com
   downloadFile合法域名: https://yourdomain.com
   ```

**建议:**
- 尽快申请域名（如 `activity.yourdomain.com`）
- 配置 SSL 证书（推荐免费的 Let's Encrypt）
- 配置 Nginx 反向代理
- 更新配置文件中的域名

### 步骤 5: 检查编译结果

#### 查看编译信息

在微信开发者工具的 **控制台** 中查看：

```
[代码依赖分析]
代码包总大小: 1.2 MB / 2 MB (限制)
分包情况: 主包 1.2 MB
```

#### 性能检查

点击 **调试器** → **性能** 标签，检查：
- [ ] 启动时间 < 3 秒
- [ ] 首屏渲染 < 2 秒
- [ ] 内存占用合理

#### 体验评分

点击 **调试器** → **Audits** 运行体验评分：
- 目标：得分 > 80 分
- 查看优化建议

### 步骤 6: 提交审核（可选）

如果准备正式上线：

1. 登录微信公众平台: https://mp.weixin.qq.com
2. 进入 **管理** → **版本管理**
3. 找到刚上传的版本
4. 点击 **提交审核**
5. 填写审核信息：
   - 选择服务类目
   - 填写功能说明
   - 上传截图/视频
   - 提交审核

**审核时间:** 通常 1-7 个工作日

---

## 部署流程

### 准备服务器

#### 1. 服务器环境要求

**操作系统:**
- Linux (推荐 Ubuntu 20.04+ / CentOS 8+)
- 或 Windows Server 2019+

**软件要求:**
- Java 17+
- MySQL 8.0+
- Redis 6.0+ (可选)
- Nginx (推荐，用于反向代理)

#### 2. 安装 Java 环境

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
java -version
```

**CentOS/RHEL:**
```bash
sudo dnf install java-17-openjdk
java -version
```

**Windows:**
下载并安装 JDK 17: https://adoptium.net/

#### 3. 安装 MySQL

参考之前生成的文档：
```
backend/sql/DATABASE_DEPLOYMENT.md
```

执行数据库初始化：
```bash
mysql -u root -p < backend/sql/init_all.sql
```

### 部署后端

#### 1. 上传 JAR 包

**使用 SCP (Linux/macOS):**
```bash
scp backend/target/activity-assistant-1.0.0.jar user@47.104.94.67:/app/
```

**使用 WinSCP (Windows):**
1. 打开 WinSCP
2. 连接到服务器 `47.104.94.67`
3. 上传 JAR 包到 `/app/` 目录

#### 2. 上传配置文件

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
# 上传到服务器
scp backend/sql/.env user@47.104.94.67:/app/
```

#### 3. 设置环境变量

在服务器上创建启动脚本 `/app/start.sh`:

```bash
#!/bin/bash

# 加载环境变量
export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=47.104.94.67
export DB_USERNAME=activity_user
export DB_PASSWORD=你的数据库密码
export JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG
export WECHAT_APP_ID=wx92bf60c1218c0abc
export WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4
export REDIS_HOST=47.104.94.67
export REDIS_PASSWORD=
export ALLOWED_ORIGINS=http://47.104.94.67,https://servicewechat.com

# 运行应用
java -jar /app/activity-assistant-1.0.0.jar \
  --server.port=8082 \
  >> /var/log/activity-assistant/app.log 2>&1 &

echo "应用已启动，PID: $!"
```

设置执行权限：
```bash
chmod +x /app/start.sh
```

#### 4. 启动应用

```bash
# 启动应用
/app/start.sh

# 查看日志
tail -f /var/log/activity-assistant/app.log
```

#### 5. 验证启动

```bash
# 检查进程
ps aux | grep activity-assistant

# 检查端口
netstat -tlnp | grep 8082

# 测试 API
curl http://localhost:8082/actuator/health
```

应该看到：
```json
{"status":"UP"}
```

### 配置系统服务（推荐）

创建 systemd 服务文件 `/etc/systemd/system/activity-assistant.service`:

```ini
[Unit]
Description=Activity Assistant Application
After=syslog.target network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/app
ExecStart=/usr/bin/java -jar /app/activity-assistant-1.0.0.jar --spring.profiles.active=prod
SuccessExitStatus=143
Restart=always
RestartSec=10

# 环境变量
Environment="DB_HOST=47.104.94.67"
Environment="DB_USERNAME=activity_user"
Environment="DB_PASSWORD=你的数据库密码"
Environment="JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG"
Environment="WECHAT_APP_ID=wx92bf60c1218c0abc"
Environment="WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4"

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start activity-assistant

# 设置开机自启
sudo systemctl enable activity-assistant

# 查看状态
sudo systemctl status activity-assistant

# 查看日志
journalctl -u activity-assistant -f
```

### 配置 Nginx 反向代理（可选）

创建 Nginx 配置文件 `/etc/nginx/sites-available/activity-assistant`:

```nginx
server {
    listen 80;
    server_name 47.104.94.67;

    # 日志配置
    access_log /var/log/nginx/activity-assistant-access.log;
    error_log /var/log/nginx/activity-assistant-error.log;

    # API 反向代理
    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket 支持（如需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

启用配置：
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/activity-assistant /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 验证测试

### 后端测试

#### 1. 健康检查

```bash
curl http://47.104.94.67:8082/actuator/health
```

期望响应：
```json
{"status":"UP"}
```

#### 2. API 测试

```bash
# 测试登录接口
curl -X POST http://47.104.94.67:8082/api/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code"}'
```

#### 3. 数据库连接测试

检查日志中是否有数据库连接成功的信息：
```
HikariPool-1 - Start completed.
```

### 前端测试

#### 1. 体验版测试

1. 在微信公众平台设置体验版
2. 添加体验成员
3. 扫码进入小程序测试

#### 2. 功能测试清单

- [ ] 微信登录功能正常
- [ ] 可以浏览活动列表
- [ ] 可以查看活动详情
- [ ] 可以创建活动
- [ ] 可以报名活动
- [ ] 地图功能正常显示
- [ ] 签到功能正常
- [ ] 评价功能正常
- [ ] 消息通知正常

#### 3. 性能测试

- [ ] 首屏加载时间 < 3 秒
- [ ] 页面切换流畅
- [ ] 列表滚动流畅
- [ ] 图片加载正常

---

## 常见问题

### 后端打包问题

**Q1: Maven 打包失败，提示找不到依赖**

**解决方案:**
```bash
# 清理 Maven 缓存
mvn clean
mvn dependency:purge-local-repository

# 重新下载依赖并打包
mvn clean package -U
```

**Q2: 提示 Java 版本不匹配**

**解决方案:**
检查 IDEA 的 JDK 配置：
1. `File` → `Project Structure` → `Project`
2. 设置 `SDK` 为 `17` 或更高
3. 设置 `Language Level` 为 `17`

**Q3: 打包成功但 JAR 文件很小（< 10MB）**

**解决方案:**
这是 Spring Boot 的 "thin jar"，缺少依赖。检查 `pom.xml` 中是否配置了：
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

### 前端打包问题

**Q1: 上传失败，提示"代码包超过大小限制"**

**解决方案:**
1. 删除不必要的图片和文件
2. 压缩图片资源
3. 清理无用代码
4. 考虑使用分包

**Q2: 上传后真机无法访问 API**

**解决方案:**
1. 检查 `utils/config.js` 是否切换到 `production` 环境
2. 在微信开发者工具中禁用域名校验
3. 检查服务器防火墙是否开放 8082 端口

**Q3: 地图功能无法使用**

**解决方案:**
1. 检查腾讯地图 Key 是否正确配置
2. 检查微信公众平台是否开通位置权限
3. 在真机上测试时需要允许位置权限

### 部署问题

**Q1: JAR 包运行后立即退出**

**解决方案:**
查看日志：
```bash
java -jar activity-assistant-1.0.0.jar --spring.profiles.active=prod
```

常见原因：
- 数据库连接失败
- 端口被占用
- 配置文件错误

**Q2: 无法连接数据库**

**解决方案:**
1. 检查数据库是否启动：`systemctl status mysql`
2. 检查防火墙规则：`sudo ufw status`
3. 测试连接：`mysql -h 47.104.94.67 -u activity_user -p`

**Q3: 内存不足**

**解决方案:**
限制 JVM 内存：
```bash
java -Xms512m -Xmx1024m -jar activity-assistant-1.0.0.jar
```

---

## 📋 打包检查清单

### 打包前

- [ ] 代码已全部提交到 Git
- [ ] 配置文件已更新为生产环境配置
- [ ] 本地测试通过
- [ ] 数据库脚本已准备
- [ ] 环境变量已配置

### 后端打包

- [ ] Maven 打包成功
- [ ] JAR 文件大小正常（50-80MB）
- [ ] 本地测试运行成功
- [ ] 打包文件已备份

### 前端打包

- [ ] 已切换到 production 环境
- [ ] 编译无错误
- [ ] 代码包大小 < 2MB
- [ ] 真机预览测试通过

### 部署

- [ ] 服务器环境已准备
- [ ] 数据库已初始化
- [ ] JAR 包已上传
- [ ] 环境变量已配置
- [ ] 应用启动成功
- [ ] API 测试通过
- [ ] 小程序连接正常

---

**文档版本:** 1.0
**最后更新:** 2025-01-30

祝您打包部署顺利！ 🚀
