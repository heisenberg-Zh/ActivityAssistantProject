# 🚀 快速打包部署清单

**版本:** 1.0

---

## ✅ 打包前检查（2分钟）

### 1. 确认配置文件

- [x] **后端配置** - `backend/src/main/resources/application-prod.yml`
  - 数据库地址: `47.104.94.67`
  - 微信 AppID: `wx92bf60c1218c0abc`
  - 微信 AppSecret: `9830896ed8dc4314e44b2285a9c211e4`
  - JWT 密钥: `HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG`

- [x] **前端配置** - `utils/config.js`
  - API 地址: `http://47.104.94.67:8082`
  - 腾讯地图 Key: `56PBZ-QQ2KW-W4FRG-YP6XS-HBKXZ-5HFNZ`

### 2. 确认环境

- [ ] IDEA 已打开项目
- [ ] 微信开发者工具已打开项目

---

## 📦 后端打包（5分钟）

### 使用 IDEA（推荐）

#### 方式 A: Maven 面板

1. 打开右侧 **Maven** 工具窗口
2. 展开 `Lifecycle`
3. 双击 `clean`（清理）
4. 双击 `package`（打包）
5. 等待完成（看到 BUILD SUCCESS）

#### 方式 B: Maven 命令

1. 点击 Maven 面板上方的 `M` 图标（Execute Maven Goal）
2. 输入命令：
   ```bash
   clean package -DskipTests
   ```
3. 点击 Execute

### 打包结果

**文件位置:**
```
backend/target/activity-assistant-1.0.0.jar
```

**文件大小:** 约 50-80 MB

**快速测试:**
```bash
cd backend/target
java -jar activity-assistant-1.0.0.jar --spring.profiles.active=dev
```
（看到 Spring Boot 启动信息即可，按 Ctrl+C 停止）

---

## 📱 前端打包（3分钟）

### 步骤 1: 切换生产环境

**编辑** `utils/config.js` **第 11 行:**

```javascript
const CURRENT_ENV = 'production'; // 改为 production
```

### 步骤 2: 上传代码

在微信开发者工具中：

1. 点击工具栏 **上传** 按钮
2. 填写信息：
   ```
   版本号: 1.0.0
   项目备注: 初始版本
   ```
3. 点击 **上传**

**上传成功标志:**
```
[3/3] 上传代码...
上传成功！
```

### 步骤 3: 配置域名校验（开发测试）

1. 点击右上角 **详情**
2. 进入 **本地设置**
3. ✅ 勾选 **"不校验合法域名..."**

---

## 🚢 部署到服务器（10分钟）

### 1. 上传 JAR 包

**使用 WinSCP/FileZilla:**
- 上传 `backend/target/activity-assistant-1.0.0.jar` 到服务器 `/app/` 目录

**使用 SCP 命令:**
```bash
scp backend/target/activity-assistant-1.0.0.jar root@47.104.94.67:/app/
```

### 2. 初始化数据库

**上传 SQL 脚本:**
```bash
scp backend/sql/init_all.sql root@47.104.94.67:/tmp/
```

**在服务器上执行:**
```bash
# SSH 登录服务器
ssh root@47.104.94.67

# 执行数据库初始化
mysql -u root -p < /tmp/init_all.sql
```

### 3. 创建启动脚本

**在服务器上创建** `/app/start.sh`:

```bash
#!/bin/bash

export SPRING_PROFILES_ACTIVE=prod
export DB_HOST=47.104.94.67
export DB_USERNAME=activity_user
export DB_PASSWORD=你的数据库密码
export JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG
export WECHAT_APP_ID=wx92bf60c1218c0abc
export WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4

nohup java -jar /app/activity-assistant-1.0.0.jar \
  >> /var/log/activity-assistant.log 2>&1 &

echo "应用已启动"
```

**设置权限并启动:**
```bash
chmod +x /app/start.sh
/app/start.sh
```

### 4. 验证部署

**检查进程:**
```bash
ps aux | grep activity-assistant
```

**测试 API:**
```bash
curl http://47.104.94.67:8082/actuator/health
```

**应该返回:**
```json
{"status":"UP"}
```

---

## ✅ 验证清单

### 后端验证

- [ ] JAR 包大小正常（50-80MB）
- [ ] 本地可以运行
- [ ] 已上传到服务器
- [ ] 服务器上可以启动
- [ ] API 健康检查通过

### 前端验证

- [ ] 代码已上传到微信平台
- [ ] 可以生成体验版
- [ ] 真机可以访问
- [ ] 可以调用后端 API
- [ ] 地图功能正常

### 功能验证

- [ ] 微信登录功能正常
- [ ] 可以浏览活动
- [ ] 可以创建活动
- [ ] 可以报名活动
- [ ] 签到功能正常

---

## 🆘 快速故障排查

### 后端无法启动

```bash
# 查看日志
tail -f /var/log/activity-assistant.log

# 检查端口占用
netstat -tlnp | grep 8082

# 检查 Java 版本
java -version  # 需要 17+
```

### 前端无法访问 API

1. 检查 `utils/config.js` 是否为 `production`
2. 检查微信开发者工具是否禁用域名校验
3. 检查服务器防火墙：
   ```bash
   # 开放 8082 端口
   sudo ufw allow 8082
   ```

### 数据库连接失败

```bash
# 检查 MySQL 是否运行
systemctl status mysql

# 测试连接
mysql -h 47.104.94.67 -u activity_user -p

# 检查用户权限
SHOW GRANTS FOR 'activity_user'@'%';
```

---

## 📞 需要帮助？

详细文档请查看:
- **完整打包指南**: `BUILD_AND_DEPLOYMENT_GUIDE.md`
- **数据库部署**: `backend/sql/DATABASE_DEPLOYMENT.md`
- **配置清单**: `PRODUCTION_CONFIG_CHECKLIST.md`

---

**清单版本:** 1.0
**最后更新:** 2025-01-30

祝您部署顺利！ 🎉
