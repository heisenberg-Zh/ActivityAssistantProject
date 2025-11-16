# ActivityAssistant 数据库结构文档

## 📊 数据库概览

**数据库名称**: `activity_assistant`
**字符集**: `utf8mb4`
**排序规则**: `utf8mb4_unicode_ci`
**表总数**: 5
**数据总量**: 87条记录

### 📈 数据统计（当前）

| 表名 | 记录数 | 说明 |
|------|--------|------|
| activities | 30 | 活动信息表 |
| users | 7 | 用户信息表 |
| registrations | 28 | 报名记录表 |
| checkins | 19 | 签到记录表 |
| messages | 3 | 消息通知表 |

---

## 🗂️ 数据库表结构

### 1️⃣ users - 用户表

**表说明**: 存储用户基本信息，支持微信登录

**数据量**: 7条

| 字段名 | 类型 | 允许空 | 键 | 默认值 | 说明 |
|--------|------|--------|-----|--------|------|
| **id** | varchar(36) | NO | PRI | - | 用户ID（UUID） |
| **open_id** | varchar(100) | NO | UNI | - | 微信OpenID，用于登录 |
| union_id | varchar(100) | YES | - | NULL | 微信UnionID |
| nickname | varchar(100) | YES | - | NULL | 用户昵称 |
| avatar | varchar(500) | YES | - | NULL | 头像URL |
| mobile | varchar(20) | YES | MUL | NULL | 手机号（脱敏） |
| role | varchar(20) | NO | - | user | 角色：user/admin |
| **created_at** | datetime | NO | MUL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NO | - | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- 主键: `id`
- 唯一索引: `open_id`
- 普通索引: `mobile`, `created_at`

**示例数据**:
```sql
SELECT id, nickname, mobile, role, created_at FROM users LIMIT 3;
```

**关联关系**:
- 1:N → activities (组织者)
- 1:N → registrations (报名者)
- 1:N → checkins (签到者)
- 1:N → messages (消息接收者)

---

### 2️⃣ activities - 活动表

**表说明**: 存储活动的详细信息，支持分组、定时发布等高级功能

**数据量**: 30条

| 字段名 | 类型 | 允许空 | 键 | 默认值 | 说明 |
|--------|------|--------|-----|--------|------|
| **id** | varchar(36) | NO | PRI | - | 活动ID（UUID） |
| **title** | varchar(200) | NO | - | - | 活动标题 |
| description | text | YES | - | NULL | 活动描述 |
| **organizer_id** | varchar(36) | NO | MUL | - | 组织者ID（外键→users.id） |
| type | varchar(50) | YES | MUL | NULL | 活动类型：运动/聚会/培训/户外 |
| **status** | varchar(20) | NO | - | pending | 状态：pending/published/ongoing/finished/cancelled |
| **start_time** | datetime | NO | MUL | - | 开始时间 |
| **end_time** | datetime | NO | - | - | 结束时间 |
| register_deadline | datetime | YES | - | NULL | 报名截止时间 |
| place | varchar(200) | YES | - | NULL | 地点名称 |
| address | varchar(500) | YES | - | NULL | 详细地址 |
| latitude | decimal(10,7) | YES | - | NULL | 纬度 |
| longitude | decimal(10,7) | YES | - | NULL | 经度 |
| checkin_radius | int | NO | - | 500 | 签到范围（米） |
| **total** | int | NO | - | - | 人数上限 |
| joined | int | NO | - | 0 | 已报名人数 |
| min_participants | int | NO | - | 1 | 最低成行人数 |
| fee | decimal(10,2) | NO | - | 0.00 | 费用 |
| fee_type | varchar(20) | NO | - | free | 费用类型：free/AA/unified |
| need_review | tinyint(1) | NO | - | 0 | 是否需要审核：0否/1是 |
| **is_public** | tinyint(1) | NO | MUL | 1 | 是否公开：0私密/1公开 |
| **is_deleted** | tinyint(1) | NO | MUL | 0 | 软删除标记：0否/1是 |
| groups | json | YES | - | NULL | 分组信息（JSON数组） |
| administrators | json | YES | - | NULL | 管理员列表（JSON数组） |
| whitelist | json | YES | - | NULL | 白名单（JSON数组） |
| blacklist | json | YES | - | NULL | 黑名单（JSON数组） |
| custom_fields | json | YES | - | NULL | 自定义字段配置（JSON数组） |
| scheduled_publish_time | datetime | YES | - | NULL | 定时发布时间 |
| actual_publish_time | datetime | YES | - | NULL | 实际发布时间 |
| is_recurring | tinyint(1) | NO | - | 0 | 是否周期性活动 |
| recurring_group_id | varchar(36) | YES | - | NULL | 周期活动组ID |
| recurring_config | json | YES | - | NULL | 周期配置（JSON对象） |
| **created_at** | datetime | NO | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | NO | - | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- 主键: `id`
- 普通索引: `organizer_id`, `type`, `start_time`, `is_public`, `is_deleted`

**外键约束**:
- `organizer_id` → `users.id`

**状态枚举说明**:
| 状态值 | 中文名称 | 说明 | 是否可报名 |
|--------|---------|------|----------|
| pending | 待发布 | 草稿状态 | ❌ |
| published | 已发布 | 接受报名 | ✅ |
| ongoing | 进行中 | 活动进行中 | ✅ |
| finished | 已结束 | 活动结束 | ❌ |
| cancelled | 已取消 | 活动取消 | ❌ |

**示例查询**:
```sql
-- 查询进行中的公开活动
SELECT id, title, status, start_time, joined, total
FROM activities
WHERE status IN ('published', 'ongoing')
  AND is_public = 1
  AND is_deleted = 0
ORDER BY start_time;

-- 查询某用户创建的活动
SELECT id, title, status, created_at
FROM activities
WHERE organizer_id = 'u1'
  AND is_deleted = 0
ORDER BY created_at DESC;
```

---

### 3️⃣ registrations - 报名表

**表说明**: 记录用户对活动的报名信息

**数据量**: 28条

| 字段名 | 类型 | 允许空 | 键 | 默认值 | 说明 |
|--------|------|--------|-----|--------|------|
| **id** | varchar(36) | NO | PRI | - | 报名ID（UUID） |
| **activity_id** | varchar(36) | NO | MUL | - | 活动ID（外键→activities.id） |
| group_id | varchar(50) | YES | MUL | NULL | 分组ID（对应活动中的groups） |
| **user_id** | varchar(36) | NO | MUL | - | 用户ID（外键→users.id） |
| **name** | varchar(100) | NO | - | - | 报名姓名 |
| mobile | varchar(20) | YES | - | NULL | 联系电话 |
| custom_data | json | YES | - | NULL | 自定义字段数据（JSON对象） |
| **status** | varchar(20) | NO | MUL | pending | 报名状态：pending/approved/rejected/cancelled |
| **registered_at** | datetime | NO | MUL | CURRENT_TIMESTAMP | 报名时间 |
| approved_at | datetime | YES | - | NULL | 审核通过时间 |
| **checkin_status** | varchar(20) | NO | - | pending | 签到状态：pending/checked/late/absent |
| checkin_time | datetime | YES | - | NULL | 签到时间 |

**索引**:
- 主键: `id`
- 普通索引: `activity_id`, `group_id`, `user_id`, `status`, `registered_at`

**外键约束**:
- `activity_id` → `activities.id`
- `user_id` → `users.id`

**报名状态说明**:
| 状态值 | 中文名称 | 说明 |
|--------|---------|------|
| pending | 待审核 | 等待组织者审核 |
| approved | 已通过 | 审核通过，可参加活动 |
| rejected | 已拒绝 | 审核未通过 |
| cancelled | 已取消 | 用户主动取消报名 |

**签到状态说明**:
| 状态值 | 中文名称 | 说明 |
|--------|---------|------|
| pending | 未签到 | 尚未签到 |
| checked | 已签到 | 正常签到 |
| late | 迟到 | 迟到签到 |
| absent | 缺席 | 未签到且活动已结束 |

**示例查询**:
```sql
-- 查询某活动的报名列表
SELECT r.id, r.name, r.mobile, r.status, r.registered_at, u.nickname
FROM registrations r
LEFT JOIN users u ON r.user_id = u.id
WHERE r.activity_id = 'a1' AND r.status = 'approved'
ORDER BY r.registered_at;

-- 查询某用户的报名历史
SELECT r.id, a.title, r.status, r.registered_at, r.checkin_status
FROM registrations r
INNER JOIN activities a ON r.activity_id = a.id
WHERE r.user_id = 'u1'
ORDER BY r.registered_at DESC;

-- 统计某活动各分组报名情况
SELECT group_id, COUNT(*) as count
FROM registrations
WHERE activity_id = 'a0' AND status = 'approved'
GROUP BY group_id;
```

---

### 4️⃣ checkins - 签到表

**表说明**: 记录用户签到信息，包括GPS位置验证

**数据量**: 19条

| 字段名 | 类型 | 允许空 | 键 | 默认值 | 说明 |
|--------|------|--------|-----|--------|------|
| **id** | varchar(36) | NO | PRI | - | 签到ID（UUID） |
| **activity_id** | varchar(36) | NO | MUL | - | 活动ID（外键→activities.id） |
| **user_id** | varchar(36) | NO | MUL | - | 用户ID（外键→users.id） |
| **registration_id** | varchar(36) | NO | MUL | - | 报名ID（外键→registrations.id） |
| latitude | decimal(10,7) | YES | - | NULL | 签到位置纬度 |
| longitude | decimal(10,7) | YES | - | NULL | 签到位置经度 |
| address | varchar(500) | YES | - | NULL | 签到地址（逆地理编码） |
| distance | int | YES | - | NULL | 与活动地点距离（米） |
| **checkin_time** | datetime | NO | MUL | CURRENT_TIMESTAMP | 签到时间 |
| **is_late** | tinyint(1) | NO | - | 0 | 是否迟到：0否/1是 |
| **is_valid** | tinyint(1) | NO | - | 1 | 是否有效：0否/1是 |
| note | text | YES | - | NULL | 备注（如超出范围原因） |

**索引**:
- 主键: `id`
- 普通索引: `activity_id`, `user_id`, `registration_id`, `checkin_time`

**外键约束**:
- `activity_id` → `activities.id`
- `user_id` → `users.id`
- `registration_id` → `registrations.id`

**字段说明**:
- `is_late`: 签到时间晚于活动开始时间30分钟内为迟到
- `is_valid`: 签到位置超出活动签到范围则为无效签到
- `distance`: 用户签到位置与活动地点的实际距离

**示例查询**:
```sql
-- 查询某活动的签到情况
SELECT c.id, u.nickname, c.checkin_time, c.is_late, c.distance
FROM checkins c
INNER JOIN users u ON c.user_id = u.id
WHERE c.activity_id = 'a1'
ORDER BY c.checkin_time;

-- 统计某活动的签到率
SELECT
  COUNT(DISTINCT r.id) as total_registered,
  COUNT(DISTINCT c.id) as total_checkedin,
  ROUND(COUNT(DISTINCT c.id) * 100.0 / COUNT(DISTINCT r.id), 2) as checkin_rate
FROM registrations r
LEFT JOIN checkins c ON r.id = c.registration_id
WHERE r.activity_id = 'a1' AND r.status = 'approved';

-- 查询迟到签到记录
SELECT c.id, u.nickname, a.title, c.checkin_time, c.note
FROM checkins c
INNER JOIN users u ON c.user_id = u.id
INNER JOIN activities a ON c.activity_id = a.id
WHERE c.is_late = 1
ORDER BY c.checkin_time DESC;
```

---

### 5️⃣ messages - 消息表

**表说明**: 系统消息和通知

**数据量**: 3条

| 字段名 | 类型 | 允许空 | 键 | 默认值 | 说明 |
|--------|------|--------|-----|--------|------|
| **id** | varchar(36) | NO | PRI | - | 消息ID（UUID） |
| **user_id** | varchar(36) | NO | MUL | - | 接收用户ID（外键→users.id） |
| activity_id | varchar(36) | YES | MUL | NULL | 关联活动ID（外键→activities.id） |
| type | varchar(50) | YES | - | NULL | 消息类型 |
| title | varchar(200) | YES | - | NULL | 消息标题 |
| content | text | YES | - | NULL | 消息内容 |
| **is_read** | tinyint(1) | NO | - | 0 | 是否已读：0否/1是 |
| **created_at** | datetime | NO | MUL | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- 主键: `id`
- 普通索引: `user_id`, `activity_id`, `created_at`

**外键约束**:
- `user_id` → `users.id`
- `activity_id` → `activities.id`

**消息类型**:
- `registration_approved` - 报名通过
- `registration_rejected` - 报名拒绝
- `activity_cancelled` - 活动取消
- `activity_reminder` - 活动提醒
- `system_notice` - 系统通知

**示例查询**:
```sql
-- 查询用户未读消息
SELECT id, title, type, created_at
FROM messages
WHERE user_id = 'u1' AND is_read = 0
ORDER BY created_at DESC;

-- 标记消息为已读
UPDATE messages SET is_read = 1 WHERE id = 'msg_id';

-- 查询某活动相关的所有通知
SELECT m.id, u.nickname, m.title, m.type, m.created_at
FROM messages m
INNER JOIN users u ON m.user_id = u.id
WHERE m.activity_id = 'a1'
ORDER BY m.created_at DESC;
```

---

## 🔗 表关联关系图

```
┌─────────────────┐
│     users       │ (用户表)
│  - id (PK)      │
│  - open_id      │
│  - nickname     │
│  - mobile       │
└────────┬────────┘
         │
         │ 1:N (组织者)
         ├─────────────────────────────────────────┐
         │                                         │
         │ 1:N (报名者)                             │
         ├──────────────────────┐                  │
         │                      │                  │
         │ 1:N (签到者)          │                  │
         ├───────────┐          │                  │
         │           │          │                  │
         │ 1:N (消息接收)        │                  │
         │           │          │                  │
┌────────▼─────────┐ │          │         ┌────────▼──────────┐
│   messages       │ │          │         │   activities      │ (活动表)
│  - id (PK)       │ │          │         │  - id (PK)        │
│  - user_id (FK)  │ │          │         │  - organizer_id   │
│  - activity_id   │ │          │         │  - title          │
│  - title         │ │          │         │  - status         │
│  - is_read       │ │          │         │  - groups (JSON)  │
└──────────────────┘ │          │         └─────────┬─────────┘
         ▲           │          │                   │
         │           │          │                   │
         │ N:1       │          │                   │ 1:N (报名)
         │           │          │                   │
         │           │          │         ┌─────────▼──────────┐
         └───────────┼──────────┼─────────│  registrations     │ (报名表)
                     │          │         │  - id (PK)         │
                     │          │         │  - activity_id (FK)│
                     │          │         │  - user_id (FK)    │
                     │          │         │  - group_id        │
                     │          │         │  - status          │
                     │          │         │  - checkin_status  │
                     │          │         └─────────┬──────────┘
                     │          │                   │
                     │          │                   │ 1:1 (签到)
                     │          │                   │
                     │          │         ┌─────────▼──────────┐
                     │          │         │   checkins         │ (签到表)
                     │          └─────────│  - id (PK)         │
                     │                    │  - activity_id (FK)│
                     └────────────────────│  - user_id (FK)    │
                                          │  - registration_id │
                                          │  - latitude        │
                                          │  - is_late         │
                                          └────────────────────┘
```

### 关联关系说明

1. **users → activities** (1:N)
   - 一个用户可以创建多个活动
   - `activities.organizer_id` → `users.id`

2. **activities → registrations** (1:N)
   - 一个活动可以有多个报名记录
   - `registrations.activity_id` → `activities.id`

3. **users → registrations** (1:N)
   - 一个用户可以报名多个活动
   - `registrations.user_id` → `users.id`

4. **registrations → checkins** (1:1)
   - 一条报名记录对应一条签到记录
   - `checkins.registration_id` → `registrations.id`

5. **activities → checkins** (1:N)
   - 一个活动可以有多条签到记录
   - `checkins.activity_id` → `activities.id`

6. **users → checkins** (1:N)
   - 一个用户可以有多条签到记录
   - `checkins.user_id` → `users.id`

7. **users → messages** (1:N)
   - 一个用户可以接收多条消息
   - `messages.user_id` → `users.id`

8. **activities → messages** (1:N)
   - 一个活动可以生成多条消息通知
   - `messages.activity_id` → `activities.id`

---

## 📝 常用查询示例

### 1. 活动相关查询

```sql
-- 查询某用户创建的活动列表（含报名统计）
SELECT
  a.id,
  a.title,
  a.status,
  a.start_time,
  a.joined,
  a.total,
  COUNT(DISTINCT r.id) as registration_count,
  COUNT(DISTINCT c.id) as checkin_count
FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id AND r.status = 'approved'
LEFT JOIN checkins c ON a.id = c.activity_id
WHERE a.organizer_id = 'u1' AND a.is_deleted = 0
GROUP BY a.id
ORDER BY a.created_at DESC;

-- 查询即将开始的活动（24小时内）
SELECT id, title, start_time, place, joined, total
FROM activities
WHERE status = 'published'
  AND start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
  AND is_deleted = 0
ORDER BY start_time;

-- 查询热门活动（报名率高）
SELECT
  id,
  title,
  joined,
  total,
  ROUND(joined * 100.0 / total, 2) as fill_rate
FROM activities
WHERE status IN ('published', 'ongoing')
  AND is_public = 1
  AND is_deleted = 0
  AND total > 0
ORDER BY fill_rate DESC
LIMIT 10;
```

### 2. 报名相关查询

```sql
-- 查询待审核的报名列表
SELECT
  r.id,
  r.name,
  r.mobile,
  r.registered_at,
  a.title as activity_title,
  u.nickname as user_nickname
FROM registrations r
INNER JOIN activities a ON r.activity_id = a.id
INNER JOIN users u ON r.user_id = u.id
WHERE r.status = 'pending'
  AND a.organizer_id = 'u1'
ORDER BY r.registered_at;

-- 查询某用户的参与历史
SELECT
  a.title,
  a.type,
  r.status as registration_status,
  r.checkin_status,
  r.registered_at,
  a.start_time
FROM registrations r
INNER JOIN activities a ON r.activity_id = a.id
WHERE r.user_id = 'u1'
ORDER BY r.registered_at DESC;

-- 统计用户报名次数和签到率
SELECT
  u.id,
  u.nickname,
  COUNT(DISTINCT r.id) as total_registrations,
  COUNT(DISTINCT CASE WHEN r.checkin_status IN ('checked', 'late') THEN r.id END) as checkin_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN r.checkin_status IN ('checked', 'late') THEN r.id END) * 100.0 /
    COUNT(DISTINCT r.id),
    2
  ) as checkin_rate
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id AND r.status = 'approved'
GROUP BY u.id
HAVING total_registrations > 0
ORDER BY checkin_rate DESC;
```

### 3. 签到相关查询

```sql
-- 查询某活动的签到明细
SELECT
  u.nickname,
  c.checkin_time,
  c.distance,
  c.is_late,
  c.is_valid,
  TIMESTAMPDIFF(MINUTE, a.start_time, c.checkin_time) as minutes_diff
FROM checkins c
INNER JOIN users u ON c.user_id = u.id
INNER JOIN activities a ON c.activity_id = a.id
WHERE c.activity_id = 'a1'
ORDER BY c.checkin_time;

-- 查询未签到的已报名用户
SELECT
  r.id as registration_id,
  u.nickname,
  r.name,
  r.mobile,
  a.title as activity_title
FROM registrations r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN activities a ON r.activity_id = a.id
LEFT JOIN checkins c ON r.id = c.registration_id
WHERE r.activity_id = 'a1'
  AND r.status = 'approved'
  AND c.id IS NULL;

-- 统计活动签到情况
SELECT
  a.id,
  a.title,
  a.start_time,
  COUNT(DISTINCT r.id) as total_registered,
  COUNT(DISTINCT c.id) as total_checkedin,
  COUNT(DISTINCT CASE WHEN c.is_late = 1 THEN c.id END) as late_count,
  ROUND(COUNT(DISTINCT c.id) * 100.0 / COUNT(DISTINCT r.id), 2) as checkin_rate
FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id AND r.status = 'approved'
LEFT JOIN checkins c ON r.id = c.registration_id
WHERE a.status = 'finished'
  AND a.is_deleted = 0
GROUP BY a.id
ORDER BY a.start_time DESC
LIMIT 10;
```

### 4. 数据统计查询

```sql
-- 用户活跃度统计
SELECT
  u.id,
  u.nickname,
  COUNT(DISTINCT a.id) as created_activities,
  COUNT(DISTINCT r.id) as joined_activities,
  COUNT(DISTINCT c.id) as checkin_count,
  MAX(r.registered_at) as last_registration_time,
  MAX(c.checkin_time) as last_checkin_time
FROM users u
LEFT JOIN activities a ON u.id = a.organizer_id AND a.is_deleted = 0
LEFT JOIN registrations r ON u.id = r.user_id
LEFT JOIN checkins c ON u.id = c.user_id
GROUP BY u.id
ORDER BY (created_activities + joined_activities) DESC;

-- 活动类型统计
SELECT
  type,
  COUNT(*) as activity_count,
  SUM(joined) as total_participants,
  ROUND(AVG(joined * 100.0 / total), 2) as avg_fill_rate
FROM activities
WHERE is_deleted = 0 AND total > 0
GROUP BY type
ORDER BY activity_count DESC;

-- 月度活动趋势
SELECT
  DATE_FORMAT(start_time, '%Y-%m') as month,
  COUNT(*) as activity_count,
  SUM(joined) as total_participants,
  COUNT(DISTINCT organizer_id) as active_organizers
FROM activities
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
  AND is_deleted = 0
GROUP BY DATE_FORMAT(start_time, '%Y-%m')
ORDER BY month;
```

---

## 🛠️ 数据维护命令

### 查看表结构
```sql
-- 查看表结构
DESC table_name;

-- 查看建表语句
SHOW CREATE TABLE table_name;

-- 查看索引
SHOW INDEX FROM table_name;
```

### 数据备份
```bash
# 备份整个数据库
mysqldump -u activity_user -p activity_assistant > backup_$(date +%Y%m%d).sql

# 仅备份表结构
mysqldump -u activity_user -p --no-data activity_assistant > schema_$(date +%Y%m%d).sql

# 备份指定表
mysqldump -u activity_user -p activity_assistant activities users > backup_users_activities.sql
```

### 数据恢复
```bash
# 恢复数据库
mysql -u activity_user -p activity_assistant < backup.sql

# 恢复指定表
mysql -u activity_user -p activity_assistant < backup_users_activities.sql
```

### 清理测试数据
```sql
-- ⚠️ 谨慎使用，会删除所有数据

-- 清空表（保留结构，重置自增ID）
TRUNCATE TABLE messages;
TRUNCATE TABLE checkins;
TRUNCATE TABLE registrations;
TRUNCATE TABLE activities;
TRUNCATE TABLE users;

-- 或使用级联删除
DELETE FROM checkins;
DELETE FROM registrations;
DELETE FROM messages;
DELETE FROM activities;
DELETE FROM users;
```

---

## 📊 数据验证查询

### 检查数据完整性
```sql
-- 检查孤立的报名记录（活动不存在）
SELECT r.id, r.activity_id, r.user_id
FROM registrations r
LEFT JOIN activities a ON r.activity_id = a.id
WHERE a.id IS NULL;

-- 检查孤立的签到记录（报名不存在）
SELECT c.id, c.registration_id, c.activity_id
FROM checkins c
LEFT JOIN registrations r ON c.registration_id = r.id
WHERE r.id IS NULL;

-- 检查活动人数不一致
SELECT
  a.id,
  a.title,
  a.joined as activity_joined,
  COUNT(r.id) as actual_count,
  (a.joined - COUNT(r.id)) as diff
FROM activities a
LEFT JOIN registrations r ON a.id = r.activity_id AND r.status = 'approved'
GROUP BY a.id
HAVING diff != 0;

-- 检查重复报名
SELECT activity_id, user_id, COUNT(*) as count
FROM registrations
GROUP BY activity_id, user_id
HAVING count > 1;
```

### 性能优化建议
```sql
-- 查看表大小
SELECT
  TABLE_NAME,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS Size_MB,
  TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'activity_assistant'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- 分析慢查询（需开启慢查询日志）
-- my.ini 中设置：slow_query_log = 1
-- 查看慢查询日志文件

-- 优化表
OPTIMIZE TABLE activities;
OPTIMIZE TABLE registrations;
OPTIMIZE TABLE checkins;
```

---

## 📌 注意事项

### 1. 字段约束
- 所有主键字段 `id` 均为 UUID 格式（36位）
- 时间字段使用 `datetime` 类型，默认为当前时间
- 布尔类型使用 `tinyint(1)`，0表示false，1表示true
- JSON 字段用于存储动态结构数据，查询时需使用 JSON 函数

### 2. 外键关系
- 所有外键都设置了级联更新
- 删除操作建议使用软删除（`is_deleted`）而非物理删除
- 外键约束确保数据引用完整性

### 3. 索引优化
- 所有外键字段都建立了索引
- 查询频繁的字段（如 status, created_at）已建立索引
- 定期检查慢查询并优化索引

### 4. 数据安全
- 敏感字段（mobile）已脱敏存储
- 定期备份数据库
- 生产环境使用强密码和权限控制

---

## 🔍 快速查询工具

### Windows 命令行查询
```bash
# 连接数据库
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u activity_user -pActivity@2025 activity_assistant

# 执行单条SQL
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u activity_user -pActivity@2025 activity_assistant -e "SELECT * FROM users;"

# 执行SQL文件
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u activity_user -pActivity@2025 activity_assistant < query.sql
```

### 常用快捷命令
```sql
-- 查看所有表
SHOW TABLES;

-- 查看表行数
SELECT COUNT(*) FROM table_name;

-- 查看最新记录
SELECT * FROM table_name ORDER BY created_at DESC LIMIT 10;

-- 查看某个活动的完整信息
SELECT * FROM activities WHERE id = 'activity_id'\G

-- \G 表示垂直显示结果，便于查看长字段
```

---

**文档版本**: v1.0
**最后更新**: 2025-01-XX
**数据库版本**: MySQL 8.0
**维护人员**: 开发团队

**相关文档**:
- [API 接口文档](./API_DOCUMENTATION.md)
- [数据库设计文档](./DATABASE_DESIGN.md)
- [修复总结文档](./STATUS_FIX_SUMMARY.md)
