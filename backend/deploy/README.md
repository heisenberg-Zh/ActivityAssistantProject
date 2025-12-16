# 部署脚本使用说明

本目录包含 ActivityAssistant 后端应用的部署脚本和相关文档。

## 📁 文件清单

| 文件 | 说明 | 用途 |
|------|------|------|
| `start-app-fixed.sh` | 启动脚本（修复版） | 启动 Spring Boot 应用 |
| `stop-app.sh` | 停止脚本 | 停止运行中的应用 |
| `check-env.sh` | 环境检查脚本 | 部署前检查环境是否满足要求 |
| `DEPLOYMENT_GUIDE.md` | 部署指南 | 详细的部署文档和故障排查 |

## 🚀 快速开始

### 1. 环境检查（首次部署必须执行）

```bash
# 上传 check-env.sh 到服务器
scp check-env.sh aap@your-server:/home/aap/

# SSH 到服务器
ssh aap@your-server

# 设置执行权限
chmod +x check-env.sh

# 运行环境检查
./check-env.sh
```

### 2. 上传文件到服务器

```bash
# 方式1: 使用 scp（推荐）
scp start-app-fixed.sh aap@your-server:/home/aap/start-app.sh
scp stop-app.sh aap@your-server:/home/aap/
scp ../target/activity-assistant-1.0.0.jar aap@your-server:/home/aap/

# 方式2: 使用 SFTP 工具（如 FileZilla、WinSCP）
# 将文件上传到 /home/aap/ 目录
```

### 3. 设置权限

```bash
# SSH 到服务器
ssh aap@your-server

# 设置脚本执行权限
chmod +x /home/aap/start-app.sh
chmod +x /home/aap/stop-app.sh
```

### 4. 启动应用

```bash
# 执行启动脚本
./start-app.sh
```

### 5. 查看日志

```bash
# 实时查看日志
tail -f /home/aap/logs/application.log

# 查看最近 100 行
tail -100 /home/aap/logs/application.log

# 查看错误日志
grep ERROR /home/aap/logs/application.log
```

### 6. 停止应用（如需）

```bash
./stop-app.sh
```

## ⚙️ 环境要求

### 必需
- **操作系统**: Linux（CentOS 7+、Ubuntu 18.04+）
- **Java**: JDK 17 或更高版本
- **内存**: 至少 1GB 可用内存
- **磁盘**: 至少 1GB 可用空间
- **数据库**: MySQL 8.0（阿里云 RDS）

### 可选
- `curl` - 用于健康检查
- `netstat` 或 `ss` - 用于端口检查
- `mysql-client` - 用于数据库连接测试

## 🔧 配置说明

### 数据库配置

启动脚本中已包含数据库配置（无需手动设置）：

```bash
# 数据库连接信息
DB_HOST: rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com
DB_PORT: 3306
DB_NAME: activity_assistant
DB_USERNAME: aapDBU
DB_PASSWORD: aapDBUP@sswrd!5678
```

### 应用配置

```bash
# Spring 环境
SPRING_PROFILES_ACTIVE: prod

# JWT 密钥
JWT_SECRET: HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG

# 微信小程序配置
WECHAT_APP_ID: wx92bf60c1218c0abc
WECHAT_APP_SECRET: 9830896ed8dc4314e44b2285a9c211e4
```

### JVM 配置

```bash
# 初始堆内存: 512MB
# 最大堆内存: 1024MB
# 垃圾回收器: G1GC
```

## 📊 验证部署

### 1. 检查进程

```bash
ps aux | grep activity-assistant
```

**预期输出**:
```
aap      12345  0.5 10.2 2234567 890123 ?  Sl   08:00   0:30 java -jar activity-assistant-1.0.0.jar
```

### 2. 检查端口

```bash
netstat -tuln | grep 8082
# 或
ss -tuln | grep 8082
```

**预期输出**:
```
tcp6       0      0 :::8082                 :::*                    LISTEN
```

### 3. 健康检查

```bash
curl http://localhost:8082/actuator/health
```

**预期输出**:
```json
{"status":"UP"}
```

### 4. 测试 API

```bash
# 测试登录接口
curl -X POST http://localhost:8082/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code"}'
```

## 🐛 故障排查

### 应用启动失败

**步骤1**: 查看日志
```bash
tail -100 /home/aap/logs/application.log
```

**步骤2**: 检查常见问题
- Java 版本是否 >= 17？
- 端口 8082 是否被占用？
- 数据库是否可访问？

### 数据库连接失败

**检查步骤**:
```bash
# 测试数据库连接
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant
```

**可能原因**:
- 数据库服务器防火墙未开放
- 用户名或密码错误
- 数据库不存在

### 端口被占用

**解决方案**:
```bash
# 查找占用进程
lsof -i :8082

# 停止占用进程
kill -9 <PID>
```

### 日志文件为空

**检查步骤**:
```bash
# 检查 nohup.out
cat /home/aap/nohup.out

# 手动启动应用查看错误
java -jar /home/aap/activity-assistant-1.0.0.jar --spring.profiles.active=prod
```

## 📝 常用命令

```bash
# 启动应用
./start-app.sh

# 停止应用
./stop-app.sh

# 环境检查
./check-env.sh

# 查看实时日志
tail -f /home/aap/logs/application.log

# 查看错误日志
grep ERROR /home/aap/logs/application.log

# 健康检查
curl http://localhost:8082/actuator/health

# 查看进程
ps aux | grep activity-assistant

# 查看端口
netstat -tuln | grep 8082
```

## 🔄 重新部署流程

### 1. 本地重新打包

```bash
# 在项目根目录
cd E:\project\ActivityAssistantProject\backend

# Maven 打包
mvnw.cmd clean package -DskipTests
# 或
mvn clean package -DskipTests
```

### 2. 上传新 JAR 包

```bash
scp target/activity-assistant-1.0.0.jar aap@your-server:/home/aap/
```

### 3. 重启应用

```bash
# SSH 到服务器
ssh aap@your-server

# 停止旧应用
./stop-app.sh

# 启动新应用
./start-app.sh
```

## 📖 详细文档

完整的部署指南请参阅：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## ⚠️ 重要提示

1. **首次部署必须执行数据库初始化**
   - 创建数据库: `activity_assistant`
   - 导入表结构（生产环境不会自动建表）

2. **配置文件修复**
   - 已修复 `application-prod.yml` 中的日志路径
   - 日志目录: `/home/aap/logs/`

3. **脚本格式错误已修复**
   - 原 `start-app.sh` 存在命令换行错误
   - 请使用 `start-app-fixed.sh`（上传后重命名为 `start-app.sh`）

4. **安全注意事项**
   - 密码等敏感信息已在脚本中硬编码
   - 生产环境建议使用环境变量或密钥管理服务
   - 部署后建议修改默认密码

## 📞 技术支持

如遇到问题，请提供以下信息：

1. **环境检查结果**: `./check-env.sh` 的完整输出
2. **启动日志**: `/home/aap/logs/application.log` 的内容
3. **启动脚本输出**: `./start-app.sh` 的完整输出
4. **系统信息**:
   ```bash
   uname -a
   java -version
   free -m
   df -h
   ```

---

**版本**: v1.0
**更新时间**: 2025-12-03
**适用环境**: Linux (CentOS/Ubuntu)
