# 数据库设计文档

**数据库名称**：`activity_assistant`
**数据库类型**：MySQL 8.0+
**字符集**：utf8mb4
**排序规则**：utf8mb4_unicode_ci

---

## 📋 目录

- [一、数据库概览](#一数据库概览)
- [二、表结构设计](#二表结构设计)
  - [2.1 用户表 (users)](#21-用户表-users)
  - [2.2 活动表 (activities)](#22-活动表-activities)
  - [2.3 报名表 (registrations)](#23-报名表-registrations)
  - [2.4 签到记录表 (checkins)](#24-签到记录表-checkins)
  - [2.5 消息表 (messages)](#25-消息表-messages)
- [三、JSON字段说明](#三json字段说明)
- [四、索引设计](#四索引设计)
- [五、建表SQL](#五建表sql)
- [六、ER图](#六er图)

---

## 一、数据库概览

### 1.1 设计原则

- **混合存储策略**：固定字段用普通列，动态字段用JSON
- **读写分离友好**：主要查询字段建立索引
- **扩展性优先**：使用JSON字段支持灵活的业务需求
- **性能优化**：热点数据可使用Redis缓存

### 1.2 表清单

| 表名 | 说明 | 行数估算 | 增长速度 |
|-----|------|---------|---------|
| users | 用户表 | 10K | 中 |
| activities | 活动表 | 5K | 中 |
| registrations | 报名表 | 100K | 高 |
| checkins | 签到记录表 | 80K | 高 |
| messages | 消息表 | 50K | 高 |

---

## 二、表结构设计

### 2.1 用户表 (users)

**表名**：`users`
**说明**：存储用户基本信息，通过微信登录创建

| 字段名 | 类型 | 长度 | 空 | 默认值 | 说明 |
|-------|------|-----|---|--------|------|
| id | VARCHAR | 36 | NO | - | 主键，UUID |
| open_id | VARCHAR | 100 | NO | - | 微信OpenID，唯一 |
| union_id | VARCHAR | 100 | YES | NULL | 微信UnionID |
| nickname | VARCHAR | 100 | YES | NULL | 昵称 |
| avatar | VARCHAR | 500 | YES | NULL | 头像URL |
| mobile | VARCHAR | 20 | YES | NULL | 手机号（脱敏存储） |
| role | VARCHAR | 20 | NO | 'user' | 角色：user/organizer/admin/super_admin |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY (`id`)
- UNIQUE KEY `uk_open_id` (`open_id`)
- INDEX `idx_mobile` (`mobile`)
- INDEX `idx_created` (`created_at`)

**业务规则**：
- `open_id` 必须唯一，用于微信登录
- `mobile` 存储脱敏后的手机号（138****1234）
- `role` 默认为 `user`，创建活动后自动升级为 `organizer`

---

### 2.2 活动表 (activities)

**表名**：`activities`
**说明**：存储活动信息，使用JSON字段存储分组、白名单等动态数据

| 字段名 | 类型 | 长度 | 空 | 默认值 | 说明 |
|-------|------|-----|---|--------|------|
| id | VARCHAR | 36 | NO | - | 主键，UUID |
| title | VARCHAR | 200 | NO | - | 活动标题 |
| description | TEXT | - | YES | NULL | 活动描述 |
| organizer_id | VARCHAR | 36 | NO | - | 组织者ID |
| type | VARCHAR | 50 | YES | NULL | 活动类型：运动/聚会/培训/户外 |
| status | VARCHAR | 20 | NO | 'pending' | 状态：pending/published/ongoing/finished/cancelled |
| start_time | DATETIME | - | NO | - | 开始时间 |
| end_time | DATETIME | - | NO | - | 结束时间 |
| register_deadline | DATETIME | YES | NULL | 开始前1小时 | 报名截止时间 |
| place | VARCHAR | 200 | YES | NULL | 地点名称 |
| address | VARCHAR | 500 | YES | NULL | 详细地址 |
| latitude | DECIMAL | 10,7 | YES | NULL | 纬度 |
| longitude | DECIMAL | 10,7 | YES | NULL | 经度 |
| checkin_radius | INT | - | NO | 500 | 签到范围（米） |
| total | INT | - | NO | - | 总人数上限 |
| joined | INT | - | NO | 0 | 已报名人数 |
| min_participants | INT | - | NO | 1 | 最小人数 |
| fee | DECIMAL | 10,2 | NO | 0.00 | 费用 |
| fee_type | VARCHAR | 20 | NO | 'free' | 费用类型：free/AA/uniform |
| need_review | TINYINT | 1 | NO | 0 | 是否需要审核 |
| is_public | TINYINT | 1 | NO | 1 | 是否公开（0=私密活动） |
| is_deleted | TINYINT | 1 | NO | 0 | 是否删除（软删除） |
| **groups** | JSON | - | YES | NULL | **分组数据（JSON）** |
| **administrators** | JSON | - | YES | NULL | **管理员列表（JSON）** |
| **whitelist** | JSON | - | YES | NULL | **白名单（JSON）** |
| **blacklist** | JSON | - | YES | NULL | **黑名单（JSON）** |
| **custom_fields** | JSON | - | YES | NULL | **活动级自定义字段（JSON）** |
| scheduled_publish_time | DATETIME | YES | NULL | 定时发布时间 |
| actual_publish_time | DATETIME | YES | NULL | 实际发布时间 |
| is_recurring | TINYINT | 1 | NO | 0 | 是否周期性活动 |
| recurring_group_id | VARCHAR | 36 | YES | NULL | 周期性活动组ID |
| recurring_config | JSON | - | YES | NULL | 周期配置（JSON） |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- PRIMARY KEY (`id`)
- FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`)
- INDEX `idx_organizer` (`organizer_id`)
- INDEX `idx_type_status` (`type`, `status`)
- INDEX `idx_start_time` (`start_time`)
- INDEX `idx_is_public` (`is_public`)
- INDEX `idx_is_deleted` (`is_deleted`)

**JSON字段结构**（详见第三章）

---

### 2.3 报名表 (registrations)

**表名**：`registrations`
**说明**：存储报名记录，支持分组报名和自定义字段

| 字段名 | 类型 | 长度 | 空 | 默认值 | 说明 |
|-------|------|-----|---|--------|------|
| id | VARCHAR | 36 | NO | - | 主键，UUID |
| activity_id | VARCHAR | 36 | NO | - | 活动ID |
| group_id | VARCHAR | 50 | YES | NULL | 分组ID（如果活动有分组） |
| user_id | VARCHAR | 36 | NO | - | 用户ID |
| name | VARCHAR | 100 | NO | - | 报名姓名 |
| mobile | VARCHAR | 20 | YES | NULL | 联系电话 |
| **custom_data** | JSON | - | YES | NULL | **自定义字段值（JSON）** |
| status | VARCHAR | 20 | NO | 'pending' | 状态：pending/approved/rejected/cancelled |
| registered_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 报名时间 |
| approved_at | DATETIME | YES | NULL | 审核通过时间 |
| checkin_status | VARCHAR | 20 | NO | 'pending' | 签到状态：pending/checked/late |
| checkin_time | DATETIME | YES | NULL | 签到时间 |

**索引**：
- PRIMARY KEY (`id`)
- FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE
- FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
- UNIQUE KEY `uk_activity_user` (`activity_id`, `user_id`)
- INDEX `idx_status` (`status`)
- INDEX `idx_group` (`group_id`)
- INDEX `idx_user` (`user_id`)
- INDEX `idx_registered` (`registered_at`)

**业务规则**：
- `activity_id` + `user_id` 唯一，防止重复报名
- `custom_data` 存储用户填写的自定义字段值（JSON格式）
- 删除活动时自动删除相关报名记录（CASCADE）

---

### 2.4 签到记录表 (checkins)

**表名**：`checkins`
**说明**：记录用户签到信息，包含GPS位置验证

| 字段名 | 类型 | 长度 | 空 | 默认值 | 说明 |
|-------|------|-----|---|--------|------|
| id | VARCHAR | 36 | NO | - | 主键，UUID |
| activity_id | VARCHAR | 36 | NO | - | 活动ID |
| user_id | VARCHAR | 36 | NO | - | 用户ID |
| registration_id | VARCHAR | 36 | NO | - | 报名记录ID |
| latitude | DECIMAL | 10,7 | YES | NULL | 签到纬度 |
| longitude | DECIMAL | 10,7 | YES | NULL | 签到经度 |
| address | VARCHAR | 500 | YES | NULL | 签到地址 |
| distance | INT | - | YES | NULL | 距离活动地点的距离（米） |
| checkin_time | DATETIME | - | NO | CURRENT_TIMESTAMP | 签到时间 |
| is_late | TINYINT | 1 | NO | 0 | 是否迟到 |
| is_valid | TINYINT | 1 | NO | 1 | 是否有效（位置验证） |
| note | TEXT | - | YES | NULL | 备注（如：距离超出范围） |

**索引**：
- PRIMARY KEY (`id`)
- FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE
- FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
- FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON DELETE CASCADE
- INDEX `idx_activity` (`activity_id`)
- INDEX `idx_user` (`user_id`)
- INDEX `idx_checkin_time` (`checkin_time`)

**业务规则**：
- 签到前必须先报名（`registration_id` 关联）
- `distance` > `activity.checkin_radius` 时，`is_valid` = 0
- `checkin_time` 晚于 `activity.start_time` 30分钟，`is_late` = 1

---

### 2.5 消息表 (messages)

**表名**：`messages`
**说明**：系统消息通知记录

| 字段名 | 类型 | 长度 | 空 | 默认值 | 说明 |
|-------|------|-----|---|--------|------|
| id | VARCHAR | 36 | NO | - | 主键，UUID |
| user_id | VARCHAR | 36 | NO | - | 接收用户ID |
| activity_id | VARCHAR | 36 | YES | NULL | 关联活动ID |
| type | VARCHAR | 50 | YES | NULL | 消息类型：registration/approval/reminder/update/system |
| title | VARCHAR | 200 | YES | NULL | 消息标题 |
| content | TEXT | - | YES | NULL | 消息内容 |
| is_read | TINYINT | 1 | NO | 0 | 是否已读 |
| created_at | DATETIME | - | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引**：
- PRIMARY KEY (`id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
- FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE SET NULL
- INDEX `idx_user_read` (`user_id`, `is_read`)
- INDEX `idx_created` (`created_at`)

**消息类型说明**：
- `registration`: 报名成功通知
- `approval`: 审核结果通知
- `reminder`: 活动提醒
- `update`: 活动变更通知
- `system`: 系统通知

---

## 三、JSON字段说明

### 3.1 activities.groups (分组数据)

**用途**：存储活动的分组信息及每个分组的自定义字段

**结构**：
```json
[
  {
    "id": "g1",
    "name": "A组-新手入门",
    "total": 12,
    "joined": 8,
    "fee": 30.00,
    "feeType": "AA",
    "requirements": "适合初学者，提供基础教学",
    "description": "专门为新手设计的入门课程",
    "customFields": [
      {
        "id": "name",
        "label": "昵称",
        "required": true,
        "desc": "默认获取微信昵称，可修改",
        "isCustom": false
      },
      {
        "id": "custom_1",
        "label": "球龄",
        "required": true,
        "desc": "请填写您打羽毛球的时长",
        "isCustom": true
      }
    ],
    "descriptionFields": [
      {
        "id": "desc_1",
        "label": "携带物品",
        "value": "运动服、运动鞋、毛巾、水杯",
        "isCustom": true
      }
    ]
  },
  {
    "id": "g2",
    "name": "B组-进阶提高",
    "total": 10,
    "joined": 5,
    "fee": 50.00,
    "feeType": "AA",
    "customFields": [
      {
        "id": "custom_1",
        "label": "技术水平",
        "required": true,
        "desc": "初级/中级/高级",
        "isCustom": true
      }
    ]
  }
]
```

**字段说明**：
- `id`: 分组ID（活动内唯一）
- `name`: 分组名称
- `total`: 分组人数上限
- `joined`: 已报名人数
- `fee`: 分组费用
- `customFields`: 该分组的自定义报名字段
- `descriptionFields`: 该分组的描述性字段

---

### 3.2 activities.administrators (管理员列表)

**用途**：存储活动的协助管理员

**结构**：
```json
[
  {
    "userId": "u2",
    "addedAt": "2025-12-12T10:00:00",
    "addedBy": "u1"
  },
  {
    "userId": "u3",
    "addedAt": "2025-12-13T15:30:00",
    "addedBy": "u1"
  }
]
```

**业务规则**：
- 管理员可以审核报名、管理活动
- 仅组织者可以添加/移除管理员

---

### 3.3 activities.whitelist (白名单)

**用途**：私密活动的可访问用户列表

**结构**：
```json
[
  {
    "phone": "138****1234",
    "userId": "u1",
    "addedAt": "2025-12-12T09:00:00",
    "addedBy": "u1"
  },
  {
    "phone": "139****5678",
    "userId": "u2",
    "addedAt": "2025-12-12T09:00:00",
    "addedBy": "u1"
  }
]
```

**业务规则**：
- 私密活动（`is_public` = 0）只有白名单用户能查看
- 白名单用户报名时自动通过审核

---

### 3.4 activities.blacklist (黑名单)

**用途**：禁止报名的用户列表

**结构**：
```json
[
  {
    "phone": "150****9999",
    "userId": null,
    "expiresAt": null,
    "isActive": true,
    "reason": "违反活动规则",
    "addedAt": "2025-12-13T10:00:00",
    "addedBy": "u1"
  }
]
```

**业务规则**：
- 黑名单用户无法报名该活动
- 支持永久拉黑（`expiresAt` = null）或临时拉黑

---

### 3.5 registrations.custom_data (自定义字段值)

**用途**：存储用户填写的自定义字段值

**结构**：
```json
{
  "球龄": "3个月",
  "是否需要借用球拍": "需要",
  "T恤尺码": "L"
}
```

**说明**：
- Key: 字段label（来自 `activities.groups.customFields`）
- Value: 用户填写的值

---

## 四、索引设计

### 4.1 高频查询场景

| 查询场景 | 索引 | 说明 |
|---------|------|------|
| 查询公开活动列表 | `idx_is_public`, `idx_start_time` | 按时间排序 |
| 查询用户创建的活动 | `idx_organizer`, `idx_is_deleted` | 排除已删除 |
| 查询活动的报名列表 | `idx_status` on registrations | 按状态筛选 |
| 查询用户的报名记录 | `idx_user` on registrations | 用户维度 |
| 防止重复报名 | `uk_activity_user` | 唯一约束 |

### 4.2 性能优化建议

1. **热点数据缓存**
   - 活动列表（Redis，TTL=5分钟）
   - 活动详情（Redis，TTL=10分钟）

2. **分页查询**
   - 使用 `LIMIT` + `OFFSET`
   - 避免查询总记录数（估算即可）

3. **JSON字段优化**
   - 不在JSON字段上建立索引（性能差）
   - 可搜索字段提取为普通列

---

## 五、建表SQL

**完整建表脚本**：`backend/scripts/init-schema.sql`

```sql
-- ============================================
-- ActivityAssistant 数据库初始化脚本
-- 数据库：activity_assistant
-- 字符集：utf8mb4
-- ============================================

-- 1. 用户表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户ID（UUID）',
    open_id VARCHAR(100) NOT NULL UNIQUE COMMENT '微信OpenID',
    union_id VARCHAR(100) DEFAULT NULL COMMENT '微信UnionID',
    nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    mobile VARCHAR(20) DEFAULT NULL COMMENT '手机号（脱敏）',
    role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色：user/organizer/admin/super_admin',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_open_id (open_id),
    INDEX idx_mobile (mobile),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 活动表
CREATE TABLE activities (
    id VARCHAR(36) PRIMARY KEY COMMENT '活动ID（UUID）',
    title VARCHAR(200) NOT NULL COMMENT '活动标题',
    description TEXT COMMENT '活动描述',
    organizer_id VARCHAR(36) NOT NULL COMMENT '组织者ID',

    type VARCHAR(50) DEFAULT NULL COMMENT '活动类型：运动/聚会/培训/户外',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/published/ongoing/finished/cancelled',

    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    register_deadline DATETIME DEFAULT NULL COMMENT '报名截止时间',

    place VARCHAR(200) DEFAULT NULL COMMENT '地点名称',
    address VARCHAR(500) DEFAULT NULL COMMENT '详细地址',
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    checkin_radius INT NOT NULL DEFAULT 500 COMMENT '签到范围（米）',

    total INT NOT NULL COMMENT '总人数上限',
    joined INT NOT NULL DEFAULT 0 COMMENT '已报名人数',
    min_participants INT NOT NULL DEFAULT 1 COMMENT '最小人数',

    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '费用',
    fee_type VARCHAR(20) NOT NULL DEFAULT 'free' COMMENT '费用类型：free/AA/uniform',

    need_review TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要审核',
    is_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开（0=私密活动）',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（软删除）',

    groups JSON DEFAULT NULL COMMENT '分组数据（JSON）',
    administrators JSON DEFAULT NULL COMMENT '管理员列表（JSON）',
    whitelist JSON DEFAULT NULL COMMENT '白名单（JSON）',
    blacklist JSON DEFAULT NULL COMMENT '黑名单（JSON）',
    custom_fields JSON DEFAULT NULL COMMENT '活动级自定义字段（JSON）',

    scheduled_publish_time DATETIME DEFAULT NULL COMMENT '定时发布时间',
    actual_publish_time DATETIME DEFAULT NULL COMMENT '实际发布时间',

    is_recurring TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否周期性活动',
    recurring_group_id VARCHAR(36) DEFAULT NULL COMMENT '周期性活动组ID',
    recurring_config JSON DEFAULT NULL COMMENT '周期配置（JSON）',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (organizer_id) REFERENCES users(id),
    INDEX idx_organizer (organizer_id),
    INDEX idx_type_status (type, status),
    INDEX idx_start_time (start_time),
    INDEX idx_is_public (is_public),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- 3. 报名表
CREATE TABLE registrations (
    id VARCHAR(36) PRIMARY KEY COMMENT '报名ID（UUID）',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    group_id VARCHAR(50) DEFAULT NULL COMMENT '分组ID（如果活动有分组）',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',

    name VARCHAR(100) NOT NULL COMMENT '报名姓名',
    mobile VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    custom_data JSON DEFAULT NULL COMMENT '自定义字段值（JSON）',

    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/approved/rejected/cancelled',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    approved_at DATETIME DEFAULT NULL COMMENT '审核通过时间',

    checkin_status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '签到状态：pending/checked/late',
    checkin_time DATETIME DEFAULT NULL COMMENT '签到时间',

    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_activity_user (activity_id, user_id),
    INDEX idx_status (status),
    INDEX idx_group (group_id),
    INDEX idx_user (user_id),
    INDEX idx_registered (registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报名表';

-- 4. 签到记录表
CREATE TABLE checkins (
    id VARCHAR(36) PRIMARY KEY COMMENT '签到ID（UUID）',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    registration_id VARCHAR(36) NOT NULL COMMENT '报名记录ID',

    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '签到纬度',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '签到经度',
    address VARCHAR(500) DEFAULT NULL COMMENT '签到地址',
    distance INT DEFAULT NULL COMMENT '距离活动地点的距离（米）',

    checkin_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '签到时间',
    is_late TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否迟到',
    is_valid TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否有效（位置验证）',
    note TEXT DEFAULT NULL COMMENT '备注（如：距离超出范围）',

    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    INDEX idx_activity (activity_id),
    INDEX idx_user (user_id),
    INDEX idx_checkin_time (checkin_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';

-- 5. 消息表
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY COMMENT '消息ID（UUID）',
    user_id VARCHAR(36) NOT NULL COMMENT '接收用户ID',
    activity_id VARCHAR(36) DEFAULT NULL COMMENT '关联活动ID',

    type VARCHAR(50) DEFAULT NULL COMMENT '消息类型：registration/approval/reminder/update/system',
    title VARCHAR(200) DEFAULT NULL COMMENT '消息标题',
    content TEXT DEFAULT NULL COMMENT '消息内容',

    is_read TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';
```

---

## 六、ER图

```
┌─────────────┐
│    users    │
│  (用户表)    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────────┐         ┌──────────────┐
│   activities        │ 1     N │ registrations│
│   (活动表)          ├─────────┤  (报名表)     │
│                     │         │              │
│ - groups (JSON)     │         │ - custom_data│
│ - administrators    │         │   (JSON)     │
│ - whitelist         │         └──────┬───────┘
│ - blacklist         │                │ 1
└──────┬──────────────┘                │
       │ 1                             │ N
       │                        ┌──────▼──────┐
       │ N                      │  checkins   │
┌──────▼──────┐                 │  (签到表)   │
│  messages   │                 └─────────────┘
│  (消息表)   │
└─────────────┘
```

---

**文档版本**：v1.0
**最后更新**：2025-01-08
**维护者**：Claude
