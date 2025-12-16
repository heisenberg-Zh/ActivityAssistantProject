# 测试数据初始化说明

## 📋 脚本概述

**文件**: `insert_test_data.sql`

该脚本包含：
- **5个测试用户**（活动组织者）
- **10个测试活动**（所有标题包含"test"）

## 📊 测试数据详情

### 测试用户（5个）

| ID | 昵称 | 角色 |
|---|---|---|
| test_user_001 | Test运动达人 | 运动活动组织者 |
| test_user_002 | Test户外领队 | 户外活动组织者 |
| test_user_003 | Test文艺青年 | 文化娱乐活动组织者 |
| test_user_004 | Test社交达人 | 社交活动组织者 |
| test_user_005 | Test学习小组 | 教育活动组织者 |

### 测试活动（10个）

| 序号 | 活动标题 | 类型 | 人数 | 费用 | 开始时间 |
|---|---|---|---|---|---|
| 1 | Test周末羽毛球活动 | sports | 20人 | 免费 | 3天后 |
| 2 | Test周日爬山徒步活动 | outdoor | 30人 | 20元AA | 7天后 |
| 3 | Test周六电影观影活动 | entertainment | 15人 | 65元 | 5天后 |
| 4 | Test周五桌游聚会 | social | 12人 | 30元AA | 2天后 |
| 5 | Test周三读书分享会 | culture | 25人 | 免费 | 6天后 |
| 6 | Test周二瑜伽课程 | sports | 18人 | 50元 | 4天后 |
| 7 | Test周六露营活动 | outdoor | 25人 | 150元 | 9天后 |
| 8 | Test周四英语角活动 | education | 20人 | 免费 | 8天后 |
| 9 | Test周日篮球友谊赛 | sports | 24人 | 30元AA | 11天后 |
| 10 | Test周六摄影外拍活动 | art | 22人 | 20元 | 12天后 |

## 🚀 使用方法

### 方法1：在服务器上直接执行（推荐）

#### 步骤1：上传SQL文件到服务器

```bash
# 在本地（Windows）执行
cd E:\project\ActivityAssistantProject\backend\deploy
scp insert_test_data.sql aap@47.104.94.67:/home/aap/
```

#### 步骤2：在服务器上执行SQL

```bash
# SSH 连接到服务器
ssh aap@47.104.94.67

# 执行SQL脚本
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant < /home/aap/insert_test_data.sql
```

#### 步骤3：验证结果

```bash
# 查看测试数据数量
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant << 'EOFSQL'

-- 查看用户数量
SELECT COUNT(*) as '测试用户' FROM users WHERE id LIKE 'test_user_%';

-- 查看活动数量
SELECT COUNT(*) as '测试活动' FROM activities WHERE id LIKE 'test_act_%';

-- 查看活动列表
SELECT id, title, type, status, start_time, place
FROM activities
WHERE id LIKE 'test_act_%'
ORDER BY start_time;

EOFSQL
```

### 方法2：使用MySQL客户端交互式执行

```bash
# 连接数据库
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant

# 在MySQL命令行中执行
mysql> source /home/aap/insert_test_data.sql
```

## ✅ 验证测试数据

### 1. 查看数据库中的测试数据

```sql
-- 查看所有测试活动
SELECT id, title, status, is_public, total, joined, start_time
FROM activities
WHERE id LIKE 'test_act_%';

-- 查看已发布的公开活动（前端会显示这些）
SELECT id, title, type, start_time, place
FROM activities
WHERE status = 'published' AND is_public = true
ORDER BY start_time;
```

### 2. 测试后端API

```bash
# 在服务器上测试
curl "http://localhost:8082/api/activities?status=published&isPublic=true&page=0&size=50"

# 从外部测试（在本地执行）
curl "http://47.104.94.67:8082/api/activities?status=published&isPublic=true&page=0&size=50"
```

### 3. 前端测试

在微信开发者工具中：
1. 打开小程序首页
2. 下拉刷新
3. 应该能看到10个测试活动

## 🔄 重新初始化

如果需要清除并重新插入测试数据：

```bash
# 删除测试数据
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant << 'EOFSQL'

DELETE FROM activities WHERE id LIKE 'test_act_%';
DELETE FROM users WHERE id LIKE 'test_user_%';

SELECT '测试数据已清除' as Status;
EOFSQL

# 重新执行插入脚本
mysql -h rm-2ze1a0954348xj6i6mo.mysql.rds.aliyuncs.com \
      -P 3306 \
      -u aapDBU \
      -p'aapDBUP@sswrd!5678' \
      activity_assistant < /home/aap/insert_test_data.sql
```

## 📝 注意事项

1. **所有活动都是公开的**：`is_public = true`，前端可以看到
2. **所有活动状态为已发布**：`status = 'published'`
3. **活动时间设置为未来**：从今天起2-12天后
4. **已包含部分报名数据**：每个活动都有一些已报名人数
5. **地点坐标真实**：使用北京市真实地点的经纬度
6. **费用类型多样**：免费、AA制、统一收费都有

## 🗑️ 清理测试数据

生产环境上线前，记得清理测试数据：

```sql
-- 清理测试活动
DELETE FROM activities WHERE id LIKE 'test_act_%' OR title LIKE '%test%';

-- 清理测试用户
DELETE FROM users WHERE id LIKE 'test_user_%';

-- 清理相关的报名记录（如果有）
DELETE FROM registrations WHERE activity_id LIKE 'test_act_%';

-- 确认清理结果
SELECT 'Test数据已清理' as Status;
```

## 🎯 预期结果

执行成功后，你应该看到：

```
✓ 测试数据初始化完成！
- 已创建 5 个测试用户
- 已创建 10 个测试活动
- 所有活动标题都包含 "test"
- 所有活动状态为 published 且公开可见
```

## 🐛 常见问题

### Q1: 执行时报错"Duplicate entry"

**原因**：数据库中已存在相同ID的记录

**解决**：
```sql
-- 先删除旧的测试数据
DELETE FROM activities WHERE id LIKE 'test_act_%';
DELETE FROM users WHERE id LIKE 'test_user_%';

-- 然后重新执行脚本
```

### Q2: 前端看不到活动

**检查清单**：
1. 确认活动status = 'published'
2. 确认活动is_public = true
3. 确认start_time是未来时间
4. 检查后端API是否正常返回数据
5. 检查前端API配置是否正确

### Q3: 活动时间显示异常

**原因**：时区问题或时间格式问题

**解决**：脚本使用`DATE_ADD(NOW(), INTERVAL X DAY)`动态生成未来时间，应该不会有问题。

---

**创建时间**: 2025-12-03
**适用版本**: ActivityAssistant v1.0
**数据库**: MySQL 8.0+
