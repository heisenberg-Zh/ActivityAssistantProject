# 🚨 紧急修复指南：报名功能500错误

## 问题描述

**现象**: 用户在活动详情页点击"确认报名"时，出现500服务器错误
- 错误提示: "服务器内部错误，请稍后重试"
- API请求: `POST https://aap.hnsgj.com/hdtj-api/api/registrations`
- HTTP状态码: 500

## 根本原因

后端代码新增了6个字段到Activity实体类，但生产环境数据库尚未执行Schema迁移，导致JPA实体映射失败。

**缺失的字段**:
1. `desc` - 活动简介 (VARCHAR(500))
2. `requirements` - 报名要求 (TEXT)
3. `organizer_phone` - 组织者联系电话 (VARCHAR(20))
4. `organizer_wechat` - 组织者微信号 (VARCHAR(50))
5. `image` - 活动封面图片URL (VARCHAR(500))
6. `has_groups` - 是否启用分组 (TINYINT(1))

## 解决方案

需要在生产环境执行以下操作:
1. 执行数据库Schema迁移脚本
2. 重启后端应用服务

---

## 🎯 快速修复步骤

### 方案一：使用自动化脚本（推荐）

#### Windows环境:

```cmd
REM 1. 进入部署目录
cd E:\project\ActivityAssistantProject\backend\deploy

REM 2. 执行数据库更新脚本
update-database-schema.bat

REM 3. 脚本将自动:
REM    - 连接生产数据库
REM    - 执行SQL迁移
REM    - 验证字段添加成功
```

#### Linux环境（生产服务器）:

```bash
# 1. SSH登录生产服务器
ssh root@47.104.94.67

# 2. 上传更新脚本
cd /app
# （需先通过SCP上传update-database-schema.sh）

# 3. 执行更新脚本
chmod +x update-database-schema.sh
./update-database-schema.sh

# 4. 脚本将自动完成所有操作
```

---

### 方案二：手动执行（详细步骤）

#### 步骤1: 连接生产数据库并执行SQL脚本

**使用MySQL客户端**:

```bash
# 连接数据库
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p \
      activity_assistant

# 输入密码: aapDBUP@sswrd!5678

# 然后在MySQL命令行中执行:
source /path/to/04_add_missing_activity_fields.sql;
```

**或使用MySQL Workbench GUI工具**:

1. 打开MySQL Workbench
2. 创建新连接:
   - Connection Name: Activity Assistant Production
   - Hostname: `rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com`
   - Port: `3306`
   - Username: `aapDBU`
   - Password: `aapDBUP@sswrd!5678`
   - Default Schema: `activity_assistant`
3. 连接成功后，打开SQL脚本文件 `backend/sql/04_add_missing_activity_fields.sql`
4. 点击"Execute"按钮执行脚本
5. 确认输出显示"数据库迁移完成"

#### 步骤2: 验证字段已添加

在MySQL命令行或Workbench中执行:

```sql
-- 查看activities表结构
DESCRIBE activities;

-- 验证新增字段
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'activity_assistant'
    AND TABLE_NAME = 'activities'
    AND COLUMN_NAME IN (
        'desc', 'requirements', 'organizer_phone',
        'organizer_wechat', 'image', 'has_groups'
    )
ORDER BY
    ORDINAL_POSITION;
```

**预期输出**: 应该看到6条记录，对应6个新增字段

#### 步骤3: 重启后端应用服务

**SSH登录生产服务器**:

```bash
ssh root@47.104.94.67
```

**重启应用服务**（使用systemd）:

```bash
# 重启服务
systemctl restart activity-assistant

# 查看服务状态
systemctl status activity-assistant

# 实时查看日志
journalctl -u activity-assistant -f
```

**或使用手动重启**（如果不是systemd管理）:

```bash
# 停止应用
PID=$(ps aux | grep activity-assistant | grep -v grep | awk '{print $2}')
kill -15 $PID

# 等待进程退出
sleep 5

# 强制停止（如果仍在运行）
kill -9 $PID 2>/dev/null

# 启动应用
cd /app
./start.sh
```

#### 步骤4: 验证应用启动成功

```bash
# 检查端口是否监听
netstat -tlnp | grep 8082

# 健康检查
curl http://localhost:8082/actuator/health

# 预期输出: {"status":"UP"}
```

#### 步骤5: 测试报名功能

1. 打开小程序
2. 进入任意活动详情页
3. 点击"确认报名"
4. 填写报名信息
5. 提交报名
6. **预期结果**: 报名成功，不再出现500错误

---

## 📋 SQL脚本说明

**脚本位置**: `backend/sql/04_add_missing_activity_fields.sql`

**脚本功能**:
- 使用存储过程安全地添加字段
- 自动检查字段是否已存在，避免重复添加
- 包含完整的字段定义和注释

**执行逻辑**:
1. 创建存储过程 `add_column_if_not_exists()`
2. 逐个检查并添加6个字段
3. 执行存储过程
4. 删除存储过程（清理）
5. 验证字段添加成功

---

## 🧪 测试验证清单

执行修复后，请验证以下功能:

### 1. 报名功能
- [ ] 可以成功提交报名
- [ ] 报名信息正确保存到数据库
- [ ] 报名后状态正确更新

### 2. 活动创建功能
- [ ] 可以填写活动简介(desc)
- [ ] 可以填写报名要求(requirements)
- [ ] 可以填写联系方式(phone/wechat)
- [ ] 可以上传活动封面图片(image)

### 3. 活动编辑功能
- [ ] 编辑页面正确显示所有已保存的字段
- [ ] 修改后可以成功保存
- [ ] 保存后数据正确更新

### 4. 活动显示功能
- [ ] 活动列表正确显示封面图片
- [ ] 活动详情页正确显示简介和要求
- [ ] 联系方式正确显示（未报名用户可能看不到完整信息）

---

## ⚠️ 注意事项

### 数据库备份
在执行迁移前，**强烈建议备份数据库**:

```bash
# 备份数据库
cd /path/to/backend/sql
./backup.sh

# 或手动备份
mysqldump -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
          -P 3306 \
          -u aapDBU \
          -p \
          activity_assistant \
          > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 执行时机
- **建议在低峰期执行**（如凌晨或用户访问量少的时段）
- 整个过程预计耗时: **5-10分钟**
- 其中应用重启时间约: **30-60秒**

### 服务中断
- 数据库迁移操作**不会中断服务**（ALTER TABLE通常很快）
- 应用重启期间会有**短暂的服务不可用**（30-60秒）
- 建议提前通知用户

### 回滚方案
如果迁移后出现问题，可以回滚字段:

```sql
-- 删除新增的字段（谨慎操作！）
ALTER TABLE activities DROP COLUMN `desc`;
ALTER TABLE activities DROP COLUMN `requirements`;
ALTER TABLE activities DROP COLUMN `organizer_phone`;
ALTER TABLE activities DROP COLUMN `organizer_wechat`;
ALTER TABLE activities DROP COLUMN `image`;
ALTER TABLE activities DROP COLUMN `has_groups`;
```

然后将后端代码回滚到之前的版本。

---

## 🔍 故障排查

### 问题1: 数据库连接失败

**错误提示**: "Can't connect to MySQL server"

**解决方法**:
1. 检查数据库地址是否正确
2. 检查数据库用户名和密码
3. 检查服务器防火墙规则
4. 确认阿里云RDS安全组配置允许访问

### 问题2: 字段添加失败

**错误提示**: "Duplicate column name"

**原因**: 字段可能已存在

**解决方法**:
```sql
-- 检查字段是否已存在
SELECT * FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA='activity_assistant'
AND TABLE_NAME='activities'
AND COLUMN_NAME='desc';
```

### 问题3: 应用重启失败

**现象**: 应用启动后立即退出

**排查步骤**:
```bash
# 查看应用日志
journalctl -u activity-assistant -n 100 --no-pager

# 或直接查看日志文件
tail -100 /var/log/activity-assistant/application.log
```

**常见原因**:
- 数据库连接配置错误
- 端口被占用
- JVM内存不足
- 配置文件格式错误

### 问题4: 迁移后仍然500错误

**排查步骤**:
1. 确认字段已添加: `DESCRIBE activities;`
2. 确认应用已重启: `systemctl status activity-assistant`
3. 查看应用日志中的详细错误信息
4. 检查前端配置是否正确（`utils/config.js` 应为 production 模式）

---

## 📞 技术支持

如果在执行过程中遇到问题:

1. **查看日志文件**:
   - 后端日志: `/var/log/activity-assistant/application.log`
   - 数据库错误日志: 在MySQL Workbench或命令行中查看

2. **收集错误信息**:
   - 错误提示截图
   - 完整的错误堆栈信息
   - 执行的命令和输出

3. **检查相关文档**:
   - `BUILD_AND_DEPLOYMENT_GUIDE.md` - 部署指南
   - `backend/sql/DATABASE_DEPLOYMENT.md` - 数据库部署指南

---

## ✅ 修复完成标志

当以下所有条件满足时，说明修复成功:

- [x] 数据库中activities表包含所有6个新字段
- [x] 后端应用成功重启并通过健康检查
- [x] 用户可以成功提交活动报名
- [x] 活动创建和编辑功能正常
- [x] 所有新字段数据可以正确保存和显示
- [x] 应用日志中无异常错误

---

**文档版本**: 1.0
**创建日期**: 2025-12-16
**适用场景**: 生产环境报名功能500错误紧急修复
