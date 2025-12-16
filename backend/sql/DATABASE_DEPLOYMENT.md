# ActivityAssistant 数据库部署文档

版本: 1.0
最后更新: 2025-01-30

---

## 📋 目录

- [数据库概述](#数据库概述)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [数据库表结构](#数据库表结构)
- [备份与恢复](#备份与恢复)
- [性能优化](#性能优化)
- [常见问题](#常见问题)
- [维护指南](#维护指南)

---

## 数据库概述

ActivityAssistant 使用 MySQL 8.0 作为主数据库，采用 InnoDB 存储引擎。数据库包含以下核心表:

- **users** - 用户表
- **activities** - 活动表
- **registrations** - 报名表
- **checkins** - 签到表
- **reviews** - 评价表
- **messages** - 消息表
- **favorites** - 收藏表
- **feedbacks** - 反馈表
- **sequence_generator** - 序列号生成器表

### 数据库特性

- ✅ 字符集: `utf8mb4_unicode_ci` (支持完整的 Unicode 字符，包括 Emoji)
- ✅ 存储引擎: InnoDB (支持事务、外键、行级锁)
- ✅ 时区: GMT+8 (东八区)
- ✅ JSON 字段支持: 用于存储动态配置数据
- ✅ 软删除机制: 重要数据不物理删除

---

## 环境要求

### 最低要求

- **MySQL 版本**: 8.0 或更高 (推荐 8.0.30+)
- **内存**: 至少 2GB RAM
- **磁盘空间**: 至少 10GB 可用空间
- **操作系统**: Linux / Windows / macOS

### 推荐配置

- **MySQL 版本**: 8.0.32+
- **内存**: 4GB+ RAM
- **磁盘**: SSD 存储
- **CPU**: 2核心+

---

## 快速开始

### 方法一: 一键初始化（推荐）

**Linux / macOS:**

```bash
cd backend/sql
mysql -u root -p < init_all.sql
```

**Windows:**

```cmd
cd backend\sql
mysql -u root -p < init_all.sql
```

输入数据库密码后，脚本会自动完成以下操作:
1. 创建数据库 `activity_assistant`
2. 创建所有表结构
3. 创建索引和视图
4. 执行性能优化

### 方法二: 分步执行

如果需要更精细的控制，可以分步执行:

```bash
# 1. 创建数据库和表
mysql -u root -p < 01_schema.sql

# 2. 插入初始配置数据（可选）
mysql -u root -p < 02_initial_data.sql

# 3. 创建索引和优化
mysql -u root -p < 03_optimization.sql
```

---

## 详细部署步骤

### 步骤 1: 安装 MySQL

#### Linux (Ubuntu/Debian)

```bash
# 更新包管理器
sudo apt update

# 安装 MySQL Server
sudo apt install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 运行安全配置
sudo mysql_secure_installation
```

#### macOS

```bash
# 使用 Homebrew 安装
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 运行安全配置
mysql_secure_installation
```

#### Windows

1. 下载 MySQL 安装程序: https://dev.mysql.com/downloads/installer/
2. 运行安装程序，选择 "Custom" 安装类型
3. 选择 MySQL Server 8.0
4. 设置 root 密码
5. 完成安装

### 步骤 2: 验证 MySQL 安装

```bash
# 检查 MySQL 版本
mysql --version

# 登录 MySQL
mysql -u root -p
```

### 步骤 3: 创建数据库用户（推荐）

为了安全起见，建议创建专用的数据库用户，而不是直接使用 root:

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库用户
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授予权限
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 步骤 4: 执行初始化脚本

```bash
# 使用新创建的用户登录并初始化
mysql -u activity_user -p < backend/sql/init_all.sql
```

### 步骤 5: 验证安装

```bash
# 登录数据库
mysql -u activity_user -p

# 切换到数据库
USE activity_assistant;

# 查看所有表
SHOW TABLES;

# 查看表结构示例
DESCRIBE users;
DESCRIBE activities;

# 退出
EXIT;
```

---

## 数据库表结构

### 1. users (用户表)

存储微信小程序用户信息。

**主要字段:**
- `id` - 用户ID (主键)
- `open_id` - 微信OpenID (唯一索引)
- `nickname` - 用户昵称
- `avatar` - 头像URL
- `mobile` - 手机号
- `role` - 用户角色 (user/admin)

**索引:**
- PRIMARY KEY: `id`
- UNIQUE KEY: `open_id`
- INDEX: `mobile`, `role`, `created_at`

### 2. activities (活动表)

存储所有活动信息，是系统的核心表。

**主要字段:**
- `id` - 活动ID (UUID)
- `title` - 活动标题
- `description` - 活动描述
- `organizer_id` - 组织者ID
- `type` - 活动类型
- `status` - 活动状态
- `start_time` / `end_time` - 开始/结束时间
- `place` / `address` - 地点信息
- `latitude` / `longitude` - 地理坐标
- `total` / `joined` - 人数限制/已报名人数
- `groups` - 分组数据 (JSON)
- `custom_fields` - 自定义字段 (JSON)

**索引:**
- PRIMARY KEY: `id`
- INDEX: `organizer_id`, `type`, `status`, `start_time`, `is_public`, `is_deleted`

### 3. registrations (报名表)

存储用户报名信息。

**主要字段:**
- `id` - 报名ID (UUID)
- `activity_id` - 活动ID
- `user_id` - 用户ID
- `name` - 报名姓名
- `mobile` - 联系电话
- `status` - 报名状态 (pending/approved/rejected/cancelled)
- `custom_data` - 自定义字段值 (JSON)
- `checkin_status` - 签到状态

**索引:**
- PRIMARY KEY: `id`
- INDEX: `activity_id`, `user_id`, `status`, `checkin_status`
- COMPOSITE INDEX: `(activity_id, user_id)`

### 4. checkins (签到表)

存储签到记录和位置信息。

**主要字段:**
- `id` - 签到ID (UUID)
- `activity_id` - 活动ID
- `user_id` - 用户ID
- `registration_id` - 报名记录ID
- `latitude` / `longitude` - 签到坐标
- `distance` - 距离活动地点的距离
- `is_late` - 是否迟到
- `is_valid` - 位置验证是否通过

**索引:**
- PRIMARY KEY: `id`
- INDEX: `activity_id`, `user_id`, `registration_id`, `checkin_time`

### 5. reviews (评价表)

存储活动评价。

**主要字段:**
- `id` - 评价ID (UUID)
- `activity_id` - 活动ID
- `user_id` - 评价人ID
- `rating` - 评分 (1-5星)
- `content` - 评价内容
- `is_deleted` - 软删除标记
- `delete_reason` - 删除原因

**索引:**
- PRIMARY KEY: `id`
- INDEX: `activity_id`, `user_id`, `created_at`, `rating`

### 6. messages (消息表)

存储系统通知消息。

**主要字段:**
- `id` - 消息ID
- `user_id` - 接收用户ID
- `type` - 消息类型
- `title` - 消息标题
- `content` - 消息内容
- `activity_id` - 关联活动ID (可选)
- `is_read` - 是否已读

**索引:**
- PRIMARY KEY: `id`
- INDEX: `user_id`, `type`, `is_read`, `activity_id`

### 7. favorites (收藏表)

存储用户收藏的活动。

**主要字段:**
- `id` - 收藏ID (自增)
- `user_id` - 用户ID
- `activity_id` - 活动ID

**索引:**
- PRIMARY KEY: `id`
- UNIQUE KEY: `(user_id, activity_id)`

### 8. feedbacks (反馈表)

存储用户反馈。

**主要字段:**
- `id` - 反馈ID (自增)
- `user_id` - 用户ID (可选，支持匿名)
- `content` - 反馈内容
- `type` - 反馈类型 (bug/suggestion/other)
- `status` - 处理状态

**索引:**
- PRIMARY KEY: `id`
- INDEX: `user_id`, `type`, `status`, `created_at`

### 9. sequence_generator (序列号生成器表)

用于生成业务ID的序列号。

**主要字段:**
- `id` - 主键ID (自增)
- `business_type` - 业务类型
- `date_key` - 日期键 (YYYYMMDD)
- `current_value` - 当前序列值

**索引:**
- PRIMARY KEY: `id`
- UNIQUE KEY: `(business_type, date_key)`

---

## 备份与恢复

### 自动备份脚本

项目提供了便捷的备份和恢复脚本:

**Linux / macOS:**

```bash
# 执行备份
cd backend/sql
chmod +x backup.sh
./backup.sh

# 执行恢复
chmod +x restore.sh
./restore.sh
```

**Windows:**

```cmd
# 执行备份
cd backend\sql
backup.bat

# 执行恢复
restore.bat
```

### 备份配置

备份脚本默认配置:
- 备份目录: `backend/sql/backups/`
- 备份格式: `activity_assistant_YYYYMMDD_HHMMSS.sql.gz`
- 保留期限: 30天 (自动清理)
- 压缩格式: gzip

### 手动备份

```bash
# 完整备份
mysqldump -u activity_user -p \
  --databases activity_assistant \
  --single-transaction \
  --routines --triggers --events \
  --result-file=backup_$(date +%Y%m%d).sql

# 压缩备份
gzip backup_$(date +%Y%m%d).sql
```

### 手动恢复

```bash
# 解压备份
gunzip backup_20250130.sql.gz

# 恢复数据库
mysql -u activity_user -p < backup_20250130.sql
```

### 定时备份（推荐）

**Linux (使用 cron):**

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨2点备份）
0 2 * * * /path/to/backend/sql/backup.sh >> /var/log/mysql_backup.log 2>&1
```

**Windows (使用任务计划程序):**

1. 打开 "任务计划程序"
2. 创建基本任务
3. 设置触发器（每天凌晨2点）
4. 操作: 启动程序 - `backend\sql\backup.bat`

---

## 性能优化

### 1. InnoDB 缓冲池配置

编辑 MySQL 配置文件 (`my.cnf` 或 `my.ini`):

```ini
[mysqld]
# InnoDB 缓冲池大小（建议设置为服务器内存的 50-75%）
innodb_buffer_pool_size = 2G

# InnoDB 日志文件大小
innodb_log_file_size = 256M

# InnoDB 刷新日志到磁盘的策略
innodb_flush_log_at_trx_commit = 2

# 最大连接数
max_connections = 200

# 查询缓存（MySQL 5.7 及以下）
# query_cache_type = 1
# query_cache_size = 64M
```

### 2. 索引使用建议

- ✅ 经常用于 WHERE 条件的字段应建立索引
- ✅ JOIN 操作的关联字段应建立索引
- ✅ ORDER BY 和 GROUP BY 的字段应建立索引
- ❌ 避免在小表上建立过多索引
- ❌ 避免在低基数字段上建立索引 (如性别、布尔值)

### 3. 查询优化

使用 `EXPLAIN` 分析查询计划:

```sql
-- 分析查询
EXPLAIN SELECT * FROM activities WHERE status = 'published' AND is_public = TRUE;

-- 查看慢查询
SHOW FULL PROCESSLIST;

-- 查看表索引使用情况
SHOW INDEX FROM activities;
```

### 4. 定期维护

```sql
-- 优化表（整理碎片）
OPTIMIZE TABLE activities;
OPTIMIZE TABLE registrations;

-- 分析表（更新统计信息）
ANALYZE TABLE activities;

-- 检查表
CHECK TABLE activities;
```

### 5. 启用慢查询日志

```ini
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2  # 超过2秒的查询记录为慢查询
```

---

## 常见问题

### Q1: 数据库连接失败

**问题:** `Access denied for user 'activity_user'@'localhost'`

**解决方案:**
1. 检查用户名和密码是否正确
2. 确认用户权限: `SHOW GRANTS FOR 'activity_user'@'localhost';`
3. 重新授权: `GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';`

### Q2: 字符集问题（乱码）

**问题:** 插入中文或 Emoji 出现乱码

**解决方案:**
```sql
-- 检查数据库字符集
SHOW VARIABLES LIKE 'character%';

-- 修改数据库字符集
ALTER DATABASE activity_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修改表字符集
ALTER TABLE activities CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Q3: 磁盘空间不足

**问题:** InnoDB 表空间占用过多磁盘空间

**解决方案:**
1. 清理旧数据: 执行 `sp_cleanup_old_data()` 存储过程
2. 优化表: `OPTIMIZE TABLE activities;`
3. 清理 binlog: `PURGE BINARY LOGS BEFORE NOW();`

### Q4: 性能下降

**问题:** 查询速度变慢

**解决方案:**
1. 检查慢查询日志: `/var/log/mysql/slow-query.log`
2. 分析表: `ANALYZE TABLE activities;`
3. 重建索引: `ALTER TABLE activities DROP INDEX idx_name, ADD INDEX idx_name (column);`
4. 增加缓冲池大小: 调整 `innodb_buffer_pool_size`

---

## 维护指南

### 日常维护

**每日检查:**
- 检查备份是否成功
- 查看错误日志: `/var/log/mysql/error.log`
- 监控磁盘空间使用情况

**每周维护:**
- 优化高频表: `OPTIMIZE TABLE activities, registrations;`
- 清理过期数据
- 检查慢查询日志

**每月维护:**
- 分析所有表: `ANALYZE TABLE ...;`
- 检查索引使用情况
- 更新统计信息

### 监控指标

建议监控以下指标:
- **连接数**: `SHOW STATUS LIKE 'Threads_connected';`
- **QPS**: `SHOW STATUS LIKE 'Questions';`
- **慢查询**: `SHOW STATUS LIKE 'Slow_queries';`
- **InnoDB 缓冲池命中率**: `SHOW STATUS LIKE 'Innodb_buffer_pool_read%';`
- **表锁等待**: `SHOW STATUS LIKE 'Table_locks_waited';`

### 数据清理

使用提供的存储过程清理旧数据:

```sql
-- 手动执行清理
CALL sp_cleanup_old_data();

-- 查看清理结果
SELECT '已清理数据' AS status;
```

---

## 安全建议

### 1. 用户权限管理

- ✅ 生产环境禁止使用 root 用户
- ✅ 创建专用的应用数据库用户
- ✅ 使用强密码 (至少16位，包含大小写字母、数字、特殊字符)
- ✅ 限制用户只能从特定IP访问

```sql
-- 创建用户（仅允许本地访问）
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'Strong_P@ssw0rd_2025';

-- 创建用户（允许特定IP访问）
CREATE USER 'activity_user'@'192.168.1.100' IDENTIFIED BY 'Strong_P@ssw0rd_2025';
```

### 2. 防火墙配置

```bash
# Linux: 只允许本地访问 MySQL
sudo ufw allow from 127.0.0.1 to any port 3306

# 允许特定IP访问
sudo ufw allow from 192.168.1.100 to any port 3306
```

### 3. SSL/TLS 加密

生产环境建议启用 SSL 连接:

```ini
[mysqld]
require_secure_transport = ON
ssl-ca=/path/to/ca.pem
ssl-cert=/path/to/server-cert.pem
ssl-key=/path/to/server-key.pem
```

### 4. 定期更新

- ✅ 定期更新 MySQL 到最新稳定版本
- ✅ 订阅安全公告
- ✅ 及时应用安全补丁

---

## 联系与支持

如有问题，请参考:
- 项目文档: `README.md`
- API 文档: `API_SECURITY_SPEC.md`
- 产品需求: `plan.md`

---

**文档版本:** 1.0
**最后更新:** 2025-01-30
