# 🚀 生产环境部署清单

使用本清单确保数据库部署顺利完成。

---

## 📋 部署前检查

- [ ] MySQL 8.0+ 已安装并运行
- [ ] 准备好数据库 root 密码
- [ ] 服务器有足够的磁盘空间 (至少 10GB)
- [ ] 服务器内存至少 2GB (推荐 4GB+)
- [ ] 已备份现有数据库 (如有)

---

## 🔧 步骤 1: 环境配置

### 1.1 验证 MySQL 安装

```bash
# 检查 MySQL 版本
mysql --version

# 应显示: mysql  Ver 8.0.xx
```

- [ ] MySQL 版本 ≥ 8.0

### 1.2 测试数据库连接

```bash
mysql -u root -p
```

- [ ] 能够成功登录 MySQL

### 1.3 检查字符集支持

```sql
SHOW VARIABLES LIKE 'character%';
```

- [ ] `character_set_server` 为 `utf8mb4`

---

## 🗄️ 步骤 2: 创建数据库用户

```sql
-- 创建专用用户（修改密码）
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';

-- 授予权限
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

**检查清单:**
- [ ] 用户创建成功
- [ ] 已设置强密码 (至少16位)
- [ ] 权限授予成功

**保存凭证:**
```
数据库用户: activity_user
数据库密码: ___________________
数据库名称: activity_assistant
```

---

## 📦 步骤 3: 执行初始化脚本

### 3.1 上传 SQL 脚本

将 `backend/sql/` 目录下的所有文件上传到服务器。

- [ ] 所有 SQL 文件已上传
- [ ] 备份脚本已上传

### 3.2 执行初始化

**方法 A: 一键初始化 (推荐)**

```bash
cd /path/to/backend/sql
mysql -u activity_user -p < init_all.sql
```

- [ ] 脚本执行成功，无错误

**方法 B: 分步执行**

```bash
mysql -u activity_user -p < 01_schema.sql
mysql -u activity_user -p < 02_initial_data.sql
mysql -u activity_user -p < 03_optimization.sql
```

- [ ] 建表脚本执行成功
- [ ] 初始数据脚本执行成功
- [ ] 优化脚本执行成功

### 3.3 验证表创建

```sql
USE activity_assistant;
SHOW TABLES;
```

应该看到 9 张表:
- [ ] users
- [ ] activities
- [ ] registrations
- [ ] checkins
- [ ] reviews
- [ ] messages
- [ ] favorites
- [ ] feedbacks
- [ ] sequence_generator

---

## ⚙️ 步骤 4: 配置应用连接

### 4.1 更新环境变量

在服务器上设置以下环境变量:

```bash
# Linux / macOS
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=activity_user
export DB_PASSWORD=YOUR_STRONG_PASSWORD
export DB_NAME=activity_assistant
```

```cmd
REM Windows
set DB_HOST=localhost
set DB_PORT=3306
set DB_USERNAME=activity_user
set DB_PASSWORD=YOUR_STRONG_PASSWORD
set DB_NAME=activity_assistant
```

- [ ] 环境变量已设置

### 4.2 更新 application-prod.yml

编辑 `backend/src/main/resources/application-prod.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=GMT%2B8&useSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

- [ ] 数据库连接配置已更新

---

## 🔐 步骤 5: 安全加固

### 5.1 配置防火墙

```bash
# 仅允许本地访问 MySQL
sudo ufw allow from 127.0.0.1 to any port 3306

# 或允许特定应用服务器访问
sudo ufw allow from 192.168.1.100 to any port 3306
```

- [ ] 防火墙规则已配置

### 5.2 禁用 root 远程登录

```sql
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

- [ ] root 远程登录已禁用

### 5.3 MySQL 配置优化

编辑 `/etc/mysql/my.cnf`:

```ini
[mysqld]
# 绑定本地地址
bind-address = 127.0.0.1

# InnoDB 缓冲池（根据服务器内存调整）
innodb_buffer_pool_size = 2G

# 最大连接数
max_connections = 200
```

- [ ] MySQL 配置已优化
- [ ] MySQL 服务已重启

---

## 💾 步骤 6: 配置自动备份

### 6.1 设置备份脚本权限 (Linux/macOS)

```bash
chmod +x backup.sh
chmod +x restore.sh
```

- [ ] 脚本权限已设置

### 6.2 测试备份

```bash
# Linux/macOS
./backup.sh

# Windows
backup.bat
```

- [ ] 备份执行成功
- [ ] 备份文件已生成在 `backups/` 目录

### 6.3 配置定时备份

**Linux (cron):**

```bash
crontab -e

# 添加: 每天凌晨2点备份
0 2 * * * /path/to/backend/sql/backup.sh >> /var/log/mysql_backup.log 2>&1
```

**Windows (任务计划程序):**

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器: 每天 02:00
4. 操作: `backup.bat`

- [ ] 定时备份已配置

---

## ✅ 步骤 7: 测试验证

### 7.1 测试数据库连接

```bash
# 使用应用用户登录
mysql -u activity_user -p activity_assistant
```

- [ ] 能够成功登录

### 7.2 插入测试数据

```sql
-- 插入测试用户
INSERT INTO users (id, open_id, nickname, role, created_at, updated_at)
VALUES ('test-user-001', 'test-openid-001', '测试用户', 'user', NOW(), NOW());

-- 验证
SELECT * FROM users WHERE id = 'test-user-001';

-- 清理测试数据
DELETE FROM users WHERE id = 'test-user-001';
```

- [ ] 数据插入成功
- [ ] 数据查询正常
- [ ] 中文显示正常

### 7.3 测试应用连接

启动后端应用，检查日志:

```bash
# 查看应用日志
tail -f /path/to/application.log
```

查找类似信息:
```
HikariPool-1 - Start completed.
```

- [ ] 应用连接数据库成功
- [ ] 无数据库相关错误

### 7.4 测试 API 接口

```bash
# 测试微信登录接口
curl -X POST http://localhost:8082/api/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{"code": "test-code"}'
```

- [ ] API 接口响应正常
- [ ] 数据库操作正常

---

## 📊 步骤 8: 监控配置

### 8.1 启用慢查询日志

编辑 MySQL 配置:

```ini
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

- [ ] 慢查询日志已启用

### 8.2 配置监控告警

设置以下监控指标:
- [ ] 磁盘空间使用率
- [ ] 数据库连接数
- [ ] 慢查询数量
- [ ] 备份成功率

---

## 🎉 步骤 9: 部署完成

### 最终检查清单

- [ ] 数据库已创建并初始化
- [ ] 所有表已创建 (9张表)
- [ ] 索引和视图已创建
- [ ] 数据库用户已创建
- [ ] 应用能够连接数据库
- [ ] 防火墙规则已配置
- [ ] 自动备份已设置
- [ ] 监控告警已配置
- [ ] 测试数据插入/查询正常
- [ ] 中文和 Emoji 显示正常

### 文档归档

将以下信息记录到安全的地方:

```
=== 数据库信息 ===
数据库主机: _______________
数据库端口: _______________
数据库名称: activity_assistant
数据库用户: activity_user
数据库密码: _______________
字符集: utf8mb4_unicode_ci
时区: GMT+8

=== 备份信息 ===
备份目录: /path/to/backups
备份时间: 每天 02:00
保留期限: 30天

=== 部署日期 ===
初始化时间: _______________
部署人员: _______________
```

---

## 🆘 故障排查

如果部署过程中遇到问题，请检查:

1. **初始化脚本失败**
   - 检查 MySQL 错误日志: `/var/log/mysql/error.log`
   - 确认用户权限是否充足
   - 检查 SQL 语法是否兼容

2. **应用无法连接数据库**
   - 检查环境变量是否正确
   - 确认防火墙规则
   - 测试用户名密码

3. **字符集问题**
   - 执行: `SHOW VARIABLES LIKE 'character%';`
   - 确认为 `utf8mb4`

详细的故障排除指南，请参考: `DATABASE_DEPLOYMENT.md`

---

**清单版本:** 1.0
**最后更新:** 2025-01-30
**适用版本:** ActivityAssistant v1.0

部署完成后，请妥善保管本清单和相关凭证! 🎊
