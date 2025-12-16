# ActivityAssistant 生产环境部署指南

## 问题诊断

### 原启动脚本存在的问题

1. **命令换行错误**：`nohup java -jar` 命令被错误换行，导致参数被当作独立命令执行
2. **脚本标记污染**：包含 `STARTSCRIPT`、`FIXSCRIPT` 等生成器标记
3. **未定义的变量**：`$START_SCRIPT` 未定义
4. **日志路径不一致**：脚本与配置文件中的日志路径不匹配

### 修复方案

已创建修复后的脚本：
- ✅ `start-app-fixed.sh` - 修复后的启动脚本
- ✅ `stop-app.sh` - 停止脚本
- ✅ 修复了 `application-prod.yml` 中的日志路径

---

## 快速部署步骤

### 1. 上传文件到服务器

将以下文件上传到服务器 `/home/aap/` 目录：

```bash
# 本地文件路径
backend/deploy/start-app-fixed.sh  → 上传到 /home/aap/start-app.sh
backend/deploy/stop-app.sh         → 上传到 /home/aap/stop-app.sh
backend/target/activity-assistant-1.0.0.jar → 上传到 /home/aap/
```

**上传命令示例**：
```bash
# 使用 scp 命令上传
scp backend/deploy/start-app-fixed.sh aap@your-server:/home/aap/start-app.sh
scp backend/deploy/stop-app.sh aap@your-server:/home/aap/
scp backend/target/activity-assistant-1.0.0.jar aap@your-server:/home/aap/
```

### 2. 在服务器上设置权限

```bash
# SSH 连接到服务器
ssh aap@your-server

# 设置脚本执行权限
chmod +x /home/aap/start-app.sh
chmod +x /home/aap/stop-app.sh
```

### 3. 启动应用

```bash
# 执行启动脚本
./start-app.sh
```

**预期输出**：
```
========================================
  ActivityAssistant 启动脚本
========================================

[步骤1] 检查并停止旧进程...
✓ 没有运行中的旧进程

[步骤2] 启动应用...
✓ 应用已启动 (PID: xxxxx)
日志文件: /home/aap/logs/application.log

等待应用启动（25秒）...

[步骤3] 验证部署...
✓ 应用进程运行中 (PID: xxxxx)
✓ 端口 8082 已监听

[步骤4] 日志分析...
✓ 数据库连接池启动成功
✓ 应用启动成功

[步骤5] 健康检查...
✓ 健康检查通过
响应: {"status":"UP"}

✓✓✓ 部署成功！应用正在运行 ✓✓✓
```

### 4. 验证部署

```bash
# 检查进程
ps aux | grep activity-assistant

# 检查端口
netstat -tuln | grep 8082
# 或
ss -tuln | grep 8082

# 健康检查
curl http://localhost:8082/actuator/health

# 查看实时日志
tail -f /home/aap/logs/application.log
```

### 5. 停止应用（如需）

```bash
./stop-app.sh
```

---

## 环境配置说明

### 必需的环境变量（已在脚本中配置）

脚本中已包含以下配置，无需手动设置：

```bash
# Spring 环境
SPRING_PROFILES_ACTIVE=prod

# 数据库配置
DB_USERNAME=aapDBU
DB_PASSWORD=aapDBUP@sswrd!5678

# 应用配置
JWT_SECRET=HLUKzIBeh1cai5lRu8bjrWVynSmMPQgG
WECHAT_APP_ID=wx92bf60c1218c0abc
WECHAT_APP_SECRET=9830896ed8dc4314e44b2285a9c211e4
```

### 数据库连接信息

- **地址**: `rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com:3306`
- **数据库**: `activity_assistant`
- **用户名**: `aapDBU`
- **密码**: `aapDBUP@sswrd!5678`

---

## 常见问题排查

### 问题 1: 应用启动失败

**检查步骤**：
```bash
# 查看最新日志
tail -100 /home/aap/logs/application.log

# 查看错误日志
grep ERROR /home/aap/logs/application.log

# 检查 Java 版本
java -version  # 需要 Java 17+
```

### 问题 2: 数据库连接失败

**可能原因**：
- 数据库服务器防火墙未开放
- 数据库用户名或密码错误
- 数据库不存在或未初始化

**检查命令**：
```bash
# 测试数据库连接（需要安装 mysql-client）
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant
```

### 问题 3: 端口被占用

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :8082
# 或
netstat -tuln | grep 8082

# 停止占用进程
kill -9 <PID>
```

### 问题 4: 日志文件为空

**可能原因**：
- 应用未成功启动
- 日志目录权限不足
- 启动命令中的输出重定向失败

**检查步骤**：
```bash
# 检查日志目录
ls -la /home/aap/logs/

# 检查 nohup.out（默认输出文件）
cat /home/aap/nohup.out

# 手动启动查看错误
java -jar /home/aap/activity-assistant-1.0.0.jar --spring.profiles.active=prod
```

---

## 重新打包和部署（如需修改代码）

如果需要修改代码并重新部署：

### 1. 本地打包

```bash
# 在项目 backend 目录下
cd E:\project\ActivityAssistantProject\backend

# Maven 打包（Windows）
mvnw.cmd clean package -DskipTests

# 或使用系统 Maven
mvn clean package -DskipTests
```

### 2. 上传新的 JAR 包

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

---

## 服务器端口配置

### 开放端口（需要在云服务器安全组配置）

- **8082**: Spring Boot 应用端口（HTTP）
- **3306**: MySQL 端口（如果是独立部署）
- **6379**: Redis 端口（如果需要）

### 防火墙配置（如需）

```bash
# CentOS/RHEL - firewalld
sudo firewall-cmd --permanent --add-port=8082/tcp
sudo firewall-cmd --reload

# Ubuntu/Debian - ufw
sudo ufw allow 8082/tcp
```

---

## 日志管理

### 日志文件位置
- **应用日志**: `/home/aap/logs/application.log`
- **启动临时日志**: `/home/aap/nohup.out`（如果存在）

### 日志轮转配置

日志文件已配置自动轮转：
- **单文件大小**: 100MB
- **保留时间**: 30天

### 常用日志命令

```bash
# 查看实时日志
tail -f /home/aap/logs/application.log

# 查看错误日志
grep ERROR /home/aap/logs/application.log

# 查看最近 100 行
tail -100 /home/aap/logs/application.log

# 查看数据库相关日志
grep -i "hikari\|mysql\|database" /home/aap/logs/application.log

# 查看启动日志
grep "Started ActivityApplication" /home/aap/logs/application.log
```

---

## 性能监控

### JVM 监控

```bash
# 查看 Java 进程
jps -l

# 查看 JVM 内存使用
jstat -gc <PID>

# 线程栈信息
jstack <PID>

# 堆内存 dump（如需排查内存问题）
jmap -dump:format=b,file=/tmp/heap.bin <PID>
```

### 系统资源监控

```bash
# CPU 和内存使用
top -p <PID>

# 磁盘使用
df -h

# 网络连接
netstat -antp | grep <PID>
```

---

## 数据库初始化（首次部署必须执行）

### 1. 连接数据库

```bash
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678'
```

### 2. 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS activity_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE activity_assistant;
```

### 3. 导入表结构

如果有 SQL 初始化脚本（如 `schema.sql`），执行：

```bash
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant < /path/to/schema.sql
```

**注意**：生产环境配置了 `ddl-auto: none`，不会自动建表，必须手动导入表结构。

---

## 附录：完整脚本内容

### start-app.sh 核心启动命令

```bash
# 单行完整命令，确保不换行
nohup java ${JVM_OPTS} -jar "${APP_JAR}" --spring.profiles.active=prod > "${LOG_FILE}" 2>&1 &
```

### 关键配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `-Xms` | 512m | 初始堆内存 |
| `-Xmx` | 1024m | 最大堆内存 |
| `--spring.profiles.active` | prod | 激活生产环境配置 |

---

## 技术支持

如遇到问题，请提供以下信息：

1. **日志文件**：`/home/aap/logs/application.log` 的完整内容
2. **启动输出**：执行 `./start-app.sh` 的完整输出
3. **进程状态**：`ps aux | grep activity-assistant` 的输出
4. **端口状态**：`netstat -tuln | grep 8082` 的输出
5. **Java 版本**：`java -version` 的输出

---

**文档版本**: v1.0
**更新时间**: 2025-12-03
**适用环境**: 生产环境（Linux/CentOS/Ubuntu）
