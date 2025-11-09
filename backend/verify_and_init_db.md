# 数据库初始化验证和执行指南

## 第一步：验证 MySQL 安装和服务状态

### 1.1 检查 MySQL 服务是否运行

**方法1：Windows 服务管理器**
1. 按 `Win + R`，输入 `services.msc`，回车
2. 查找 `MySQL80` 服务
3. 确认状态为"正在运行"
4. 如果未运行，右键点击"启动"

**方法2：命令行检查**
```cmd
sc query MySQL80
```
期望输出包含 `STATE: RUNNING`

### 1.2 测试 MySQL 连接

打开**命令提示符（CMD）**或**PowerShell**：

```cmd
# 方法1：使用完整路径（推荐）
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p

# 方法2：如果 MySQL 在 PATH 中
mysql -u root -p
```

输入 root 密码后，应该看到：
```
Welcome to the MySQL monitor...
mysql>
```

**如果提示"命令不存在"**，说明 MySQL 未添加到环境变量，使用完整路径即可。

---

## 第二步：检查数据库是否已创建

在 MySQL 命令行中执行：

```sql
-- 查看所有数据库
SHOW DATABASES;

-- 检查 activity_assistant 是否存在
SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'activity_assistant';
```

**情况A：数据库已存在**
- 跳到"第三步"检查表结构

**情况B：数据库不存在**
- 继续执行以下命令创建数据库和用户

---

## 第三步：创建数据库和用户（如果不存在）

```sql
-- 创建数据库
CREATE DATABASE activity_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 创建应用用户
CREATE USER 'activity_user'@'localhost' IDENTIFIED BY 'Activity@2025';

-- 授予权限
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'activity_user';

-- 退出
exit;
```

---

## 第四步：执行建表脚本

### 4.1 使用命令行执行（推荐）

**退出 MySQL 后**，在 CMD/PowerShell 中执行：

```cmd
cd D:\Project\ActivityAssistantProject\backend\scripts

# 使用完整路径
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u activity_user -p activity_assistant < init-schema.sql
```

输入密码：`Activity@2025`

**期望结果**：无错误输出，静默完成

### 4.2 使用 MySQL Workbench 执行（备选）

1. 打开 MySQL Workbench
2. 连接到本地数据库（用户：activity_user，密码：Activity@2025）
3. **File** → **Open SQL Script**
4. 选择 `D:\Project\ActivityAssistantProject\backend\scripts\init-schema.sql`
5. 点击闪电图标 ⚡ 执行
6. 检查输出窗口，确认无错误

### 4.3 验证表结构

重新登录 MySQL：
```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u activity_user -p activity_assistant
```

执行验证：
```sql
-- 查看所有表
SHOW TABLES;

-- 期望输出 5 张表
-- +---------------------------+
-- | Tables_in_activity_assistant |
-- +---------------------------+
-- | activities                |
-- | checkins                  |
-- | messages                  |
-- | registrations             |
-- | users                     |
-- +---------------------------+

-- 查看 activities 表结构（验证 groups 字段）
DESCRIBE activities;

-- 确认 groups 字段存在且类型为 JSON
```

---

## 第五步：导入测试数据

### 5.1 执行数据导入脚本

**退出 MySQL 后**，执行：

```cmd
cd D:\Project\ActivityAssistantProject\backend\scripts

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u activity_user -p activity_assistant < init-data.sql
```

输入密码：`Activity@2025`

### 5.2 验证数据

重新登录并查询：
```sql
mysql -u activity_user -p activity_assistant
```

执行：
```sql
-- 查看用户数量
SELECT COUNT(*) AS user_count FROM users;
-- 期望：6

-- 查看活动数量
SELECT COUNT(*) AS activity_count FROM activities;
-- 期望：30（或更多，取决于脚本内容）

-- 查看活动列表
SELECT id, title, type, status, organizer_id FROM activities LIMIT 5;

-- 退出
exit;
```

---

## 第六步：更新配置文件（最后确认）

编辑 `backend/src/main/resources/application-dev.yml`，确认数据库配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/activity_assistant?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=GMT%2B8&useSSL=false&allowPublicKeyRetrieval=true
    username: activity_user
    password: Activity@2025
    driver-class-name: com.mysql.cj.jdbc.Driver
```

---

## ⚠️ 常见问题和解决方案

### Q1: `groups` 字段语法错误

**错误信息**：
```
Error Code: 1064 - You have an error in your SQL syntax near 'groups JSON'
```

**解决方案**：
确认 `init-schema.sql` 和 `init-data.sql` 中的 `groups` 字段使用了反引号：
```sql
`groups` JSON DEFAULT NULL COMMENT '分组数据（JSON）',
```

✅ **您的脚本已修复此问题**

### Q2: 用户权限不足

**错误信息**：
```
ERROR 1045 (28000): Access denied for user 'activity_user'@'localhost'
```

**解决方案**：
重新授予权限：
```sql
mysql -u root -p
GRANT ALL PRIVILEGES ON activity_assistant.* TO 'activity_user'@'localhost';
FLUSH PRIVILEGES;
```

### Q3: 外键约束失败

**错误信息**：
```
ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails
```

**解决方案**：
确保 init-data.sql 中先插入 users 表数据，再插入 activities 表数据。
当前脚本顺序正确 ✅

### Q4: 表已存在

**错误信息**：
```
ERROR 1050 (42S01): Table 'users' already exists
```

**解决方案**：
脚本中已包含 `DROP TABLE IF EXISTS` 语句，会自动删除旧表。
如果仍有问题，手动删除：
```sql
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS messages, checkins, registrations, activities, users;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## ✅ 完成检查清单

数据库初始化完成后，请确认：

- [ ] MySQL 服务正在运行
- [ ] 数据库 `activity_assistant` 已创建
- [ ] 用户 `activity_user` 已创建并授权
- [ ] 5 张表已创建（users, activities, registrations, checkins, messages）
- [ ] users 表有 6 条测试数据
- [ ] activities 表有测试数据
- [ ] `application-dev.yml` 数据库配置正确
- [ ] 可以使用 activity_user 登录数据库

---

## 🎯 完成后下一步

数据库初始化完成后，请继续：

1. **选择开发工具**：IntelliJ IDEA 或 Cursor
2. **导入项目**：打开 `backend` 文件夹
3. **等待 Maven 依赖下载**：首次打开需要 5-10 分钟
4. **启动项目**：运行 `ActivityApplication.java`
5. **验证启动**：访问 http://localhost:8080/swagger-ui.html

---

**文档创建时间**：2025-01-09
**维护者**：Claude
