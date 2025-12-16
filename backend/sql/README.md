# 数据库脚本目录

本目录包含 ActivityAssistant 项目的所有数据库脚本和工具。

## 📁 文件说明

### SQL 脚本

| 文件名 | 说明 | 用途 |
|--------|------|------|
| `init_all.sql` | **一键初始化脚本** | 生产环境部署时执行，自动完成所有初始化 |
| `01_schema.sql` | 建表脚本 | 创建数据库和所有表结构 |
| `02_initial_data.sql` | 初始配置数据 | 插入系统必要的初始数据（当前为空） |
| `03_optimization.sql` | 性能优化脚本 | 创建索引、视图、存储过程等 |

### 备份/恢复脚本

| 文件名 | 说明 | 适用系统 |
|--------|------|---------|
| `backup.sh` | 数据库备份脚本 | Linux / macOS |
| `restore.sh` | 数据库恢复脚本 | Linux / macOS |
| `backup.bat` | 数据库备份脚本 | Windows |
| `restore.bat` | 数据库恢复脚本 | Windows |

### 文档

| 文件名 | 说明 |
|--------|------|
| `DATABASE_DEPLOYMENT.md` | **完整的数据库部署文档** |
| `README.md` | 本文件 - 快速参考 |

## 🚀 快速开始

### 初次部署

**一键初始化数据库:**

```bash
# Linux / macOS
mysql -u root -p < init_all.sql

# Windows
mysql -u root -p < init_all.sql
```

输入数据库密码后，脚本会自动完成所有初始化工作。

### 数据备份

**Linux / macOS:**

```bash
chmod +x backup.sh
./backup.sh
```

**Windows:**

```cmd
backup.bat
```

备份文件保存在 `backups/` 目录下。

### 数据恢复

**Linux / macOS:**

```bash
chmod +x restore.sh
./restore.sh
```

**Windows:**

```cmd
restore.bat
```

脚本会列出所有可用备份，选择要恢复的版本即可。

## 📊 数据库信息

- **数据库名称:** `activity_assistant`
- **字符集:** `utf8mb4_unicode_ci`
- **存储引擎:** InnoDB
- **MySQL 版本要求:** 8.0+

## 📝 表结构概览

| 表名 | 说明 | 主要用途 |
|------|------|---------|
| `users` | 用户表 | 存储微信用户信息 |
| `activities` | 活动表 | 存储活动详情、配置、状态 |
| `registrations` | 报名表 | 存储用户报名记录 |
| `checkins` | 签到表 | 存储签到记录和位置信息 |
| `reviews` | 评价表 | 存储活动评价 |
| `messages` | 消息表 | 存储系统通知消息 |
| `favorites` | 收藏表 | 存储用户收藏的活动 |
| `feedbacks` | 反馈表 | 存储用户反馈 |
| `sequence_generator` | 序列号生成器 | 生成业务ID序列号 |

## 🔧 常用命令

### 连接数据库

```bash
mysql -u activity_user -p
```

### 查看所有表

```sql
USE activity_assistant;
SHOW TABLES;
```

### 查看表结构

```sql
DESCRIBE activities;
```

### 查看索引

```sql
SHOW INDEX FROM activities;
```

### 优化表

```sql
OPTIMIZE TABLE activities;
```

### 清理旧数据

```sql
CALL sp_cleanup_old_data();
```

## 📖 详细文档

完整的部署指南、故障排除、性能优化等信息，请查看:

👉 **[DATABASE_DEPLOYMENT.md](DATABASE_DEPLOYMENT.md)**

## ⚠️ 注意事项

### 生产环境部署

1. **修改默认密码**: 不要使用默认的 root 密码
2. **创建专用用户**: 为应用创建专用的数据库用户
3. **配置防火墙**: 限制数据库访问来源
4. **定期备份**: 设置自动备份任务
5. **监控磁盘空间**: 确保有足够的存储空间

### 安全建议

- ✅ 使用强密码（至少16位）
- ✅ 限制用户权限（最小权限原则）
- ✅ 启用 SSL/TLS 加密连接
- ✅ 定期更新 MySQL 版本
- ✅ 备份文件加密存储

### 备份策略

- **每日备份**: 使用 `backup.sh` / `backup.bat`
- **保留期限**: 30天
- **异地备份**: 定期将备份文件同步到其他服务器
- **测试恢复**: 定期测试备份文件是否可用

## 🆘 故障排除

### 常见问题

**Q: 初始化脚本执行失败?**
```
A: 检查 MySQL 服务是否启动，用户权限是否正确
```

**Q: 备份脚本提示"找不到 mysqldump"?**
```
A: 确保 MySQL 客户端工具已安装，并添加到系统 PATH
```

**Q: 恢复数据后数据丢失?**
```
A: 确认选择了正确的备份文件，检查备份文件是否完整
```

**Q: 中文或 Emoji 显示乱码?**
```
A: 确认数据库字符集为 utf8mb4_unicode_ci
```

详细的故障排除指南，请参考 `DATABASE_DEPLOYMENT.md` 的"常见问题"章节。

## 📞 技术支持

如需更多帮助，请参考:
- 主项目文档: `../../README.md`
- API 安全规范: `../../API_SECURITY_SPEC.md`
- 产品需求文档: `../../plan.md`

---

**版本:** 1.0
**最后更新:** 2025-01-30
