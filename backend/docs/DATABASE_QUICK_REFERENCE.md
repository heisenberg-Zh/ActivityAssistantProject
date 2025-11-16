# 数据库快速参考手册

## 📋 表结构速查

### activities (活动表) - 30条
```
id, title, description, organizer_id, type, status,
start_time, end_time, register_deadline, place, address,
latitude, longitude, checkin_radius, total, joined,
min_participants, fee, fee_type, need_review,
is_public, is_deleted, groups, administrators,
whitelist, blacklist, custom_fields,
scheduled_publish_time, actual_publish_time,
is_recurring, recurring_group_id, recurring_config,
created_at, updated_at
```

### users (用户表) - 7条
```
id, open_id, union_id, nickname, avatar, mobile, role,
created_at, updated_at
```

### registrations (报名表) - 28条
```
id, activity_id, group_id, user_id, name, mobile,
custom_data, status, registered_at, approved_at,
checkin_status, checkin_time
```

### checkins (签到表) - 19条
```
id, activity_id, user_id, registration_id,
latitude, longitude, address, distance,
checkin_time, is_late, is_valid, note
```

### messages (消息表) - 3条
```
id, user_id, activity_id, type, title, content,
is_read, created_at
```

---

## 🔗 关系速查

```
users (1) ──> (N) activities      [organizer_id]
users (1) ──> (N) registrations   [user_id]
users (1) ──> (N) checkins        [user_id]
users (1) ──> (N) messages        [user_id]

activities (1) ──> (N) registrations [activity_id]
activities (1) ──> (N) checkins      [activity_id]
activities (1) ──> (N) messages      [activity_id]

registrations (1) ──> (1) checkins   [registration_id]
```

---

## ⚡ 常用查询

### 1. 查看所有活动
```sql
SELECT id, title, status, start_time, joined, total
FROM activities
WHERE is_deleted = 0
ORDER BY start_time DESC
LIMIT 20;
```

### 2. 查看某活动详情
```sql
SELECT * FROM activities WHERE id = 'a1'\G
```

### 3. 查看某活动的报名列表
```sql
SELECT r.name, r.mobile, r.status, r.registered_at, u.nickname
FROM registrations r
LEFT JOIN users u ON r.user_id = u.id
WHERE r.activity_id = 'a1'
ORDER BY r.registered_at DESC;
```

### 4. 查看某活动的签到情况
```sql
SELECT u.nickname, c.checkin_time, c.is_late, c.distance
FROM checkins c
INNER JOIN users u ON c.user_id = u.id
WHERE c.activity_id = 'a1'
ORDER BY c.checkin_time;
```

### 5. 查看某用户的活动
```sql
-- 我创建的
SELECT id, title, status, start_time
FROM activities
WHERE organizer_id = 'u1' AND is_deleted = 0;

-- 我参加的
SELECT a.title, r.status, r.registered_at
FROM registrations r
INNER JOIN activities a ON r.activity_id = a.id
WHERE r.user_id = 'u1';
```

### 6. 统计查询
```sql
-- 活动统计
SELECT
  status,
  COUNT(*) as count,
  SUM(joined) as total_participants
FROM activities
WHERE is_deleted = 0
GROUP BY status;

-- 用户统计
SELECT
  u.nickname,
  COUNT(DISTINCT a.id) as created,
  COUNT(DISTINCT r.id) as joined
FROM users u
LEFT JOIN activities a ON u.id = a.organizer_id
LEFT JOIN registrations r ON u.id = r.user_id
GROUP BY u.id;
```

---

## 🎯 测试数据速查

### 测试用户
| ID | 昵称 | 手机号 |
|----|------|--------|
| u1 | 张小北 | 138****1234 |
| u2 | 李小雅 | 139****5678 |
| u3 | 王小文 | 136****9012 |

### 测试活动
| ID | 标题 | 状态 | 可报名 |
|----|------|------|--------|
| a1 | 周末网球活动 | ongoing | ✅ |
| a1b | 周末聚餐活动 | published | ✅ |
| a0 | 周六羽毛球联赛 | published | ✅ |
| scheduled1 | 周一网球活动 | pending | ❌ |

---

## 🔧 快捷命令

### 连接数据库
```bash
mysql -u activity_user -pActivity@2025 activity_assistant
```

### 查看表
```sql
SHOW TABLES;
DESC table_name;
SELECT COUNT(*) FROM table_name;
```

### 清空测试数据
```sql
DELETE FROM checkins;
DELETE FROM registrations;
DELETE FROM messages;
DELETE FROM activities WHERE id LIKE 'test%';
```

---

## 📊 枚举值速查

### activities.status
- `pending` - 待发布
- `published` - 已发布 ✅可报名
- `ongoing` - 进行中 ✅可报名
- `finished` - 已结束
- `cancelled` - 已取消

### registrations.status
- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝
- `cancelled` - 已取消

### registrations.checkin_status
- `pending` - 未签到
- `checked` - 已签到
- `late` - 迟到
- `absent` - 缺席

---

详细文档请参考：[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
