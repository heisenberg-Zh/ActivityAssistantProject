-- ============================================
-- ActivityAssistant 数据库初始化脚本
-- 数据库：activity_assistant
-- 字符集：utf8mb4
-- 创建日期：2025-01-08
-- 说明：创建所有表结构和索引
-- ============================================

-- 使用数据库
USE activity_assistant;

-- 删除已存在的表（谨慎！会删除所有数据）
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS checkins;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS users;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
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

-- ============================================
-- 2. 活动表 (activities)
-- ============================================
CREATE TABLE activities (
    id VARCHAR(36) PRIMARY KEY COMMENT '活动ID（UUID）',
    title VARCHAR(200) NOT NULL COMMENT '活动标题',
    description TEXT COMMENT '活动描述',
    organizer_id VARCHAR(36) NOT NULL COMMENT '组织者ID',

    -- 分类和状态
    type VARCHAR(50) DEFAULT NULL COMMENT '活动类型：运动/聚会/培训/户外',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/published/ongoing/finished/cancelled',

    -- 时间信息
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    register_deadline DATETIME DEFAULT NULL COMMENT '报名截止时间',

    -- 位置信息
    place VARCHAR(200) DEFAULT NULL COMMENT '地点名称',
    address VARCHAR(500) DEFAULT NULL COMMENT '详细地址',
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    checkin_radius INT NOT NULL DEFAULT 500 COMMENT '签到范围（米）',

    -- 人数信息
    total INT NOT NULL COMMENT '总人数上限',
    joined INT NOT NULL DEFAULT 0 COMMENT '已报名人数',
    min_participants INT NOT NULL DEFAULT 1 COMMENT '最小人数',

    -- 费用信息
    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '费用',
    fee_type VARCHAR(20) NOT NULL DEFAULT 'free' COMMENT '费用类型：free/AA/uniform',

    -- 设置
    need_review TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要审核',
    is_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公开（0=私密活动）',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（软删除）',

    -- JSON字段（存储动态数据）
    groups JSON DEFAULT NULL COMMENT '分组数据（JSON）',
    administrators JSON DEFAULT NULL COMMENT '管理员列表（JSON）',
    whitelist JSON DEFAULT NULL COMMENT '白名单（JSON）',
    blacklist JSON DEFAULT NULL COMMENT '黑名单（JSON）',
    custom_fields JSON DEFAULT NULL COMMENT '活动级自定义字段（JSON）',

    -- 定时发布和周期性活动
    scheduled_publish_time DATETIME DEFAULT NULL COMMENT '定时发布时间',
    actual_publish_time DATETIME DEFAULT NULL COMMENT '实际发布时间',
    is_recurring TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否周期性活动',
    recurring_group_id VARCHAR(36) DEFAULT NULL COMMENT '周期性活动组ID',
    recurring_config JSON DEFAULT NULL COMMENT '周期配置（JSON）',

    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    -- 外键和索引
    FOREIGN KEY (organizer_id) REFERENCES users(id),
    INDEX idx_organizer (organizer_id),
    INDEX idx_type_status (type, status),
    INDEX idx_start_time (start_time),
    INDEX idx_is_public (is_public),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- ============================================
-- 3. 报名表 (registrations)
-- ============================================
CREATE TABLE registrations (
    id VARCHAR(36) PRIMARY KEY COMMENT '报名ID（UUID）',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    group_id VARCHAR(50) DEFAULT NULL COMMENT '分组ID（如果活动有分组）',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',

    -- 报名信息
    name VARCHAR(100) NOT NULL COMMENT '报名姓名',
    mobile VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    custom_data JSON DEFAULT NULL COMMENT '自定义字段值（JSON）',

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/approved/rejected/cancelled',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    approved_at DATETIME DEFAULT NULL COMMENT '审核通过时间',

    -- 签到状态
    checkin_status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '签到状态：pending/checked/late',
    checkin_time DATETIME DEFAULT NULL COMMENT '签到时间',

    -- 外键和索引
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_activity_user (activity_id, user_id),
    INDEX idx_status (status),
    INDEX idx_group (group_id),
    INDEX idx_user (user_id),
    INDEX idx_registered (registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报名表';

-- ============================================
-- 4. 签到记录表 (checkins)
-- ============================================
CREATE TABLE checkins (
    id VARCHAR(36) PRIMARY KEY COMMENT '签到ID（UUID）',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    registration_id VARCHAR(36) NOT NULL COMMENT '报名记录ID',

    -- 位置信息
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '签到纬度',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '签到经度',
    address VARCHAR(500) DEFAULT NULL COMMENT '签到地址',
    distance INT DEFAULT NULL COMMENT '距离活动地点的距离（米）',

    -- 时间和状态
    checkin_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '签到时间',
    is_late TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否迟到',
    is_valid TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否有效（位置验证）',
    note TEXT DEFAULT NULL COMMENT '备注（如：距离超出范围）',

    -- 外键和索引
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    INDEX idx_activity (activity_id),
    INDEX idx_user (user_id),
    INDEX idx_checkin_time (checkin_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';

-- ============================================
-- 5. 消息表 (messages)
-- ============================================
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY COMMENT '消息ID（UUID）',
    user_id VARCHAR(36) NOT NULL COMMENT '接收用户ID',
    activity_id VARCHAR(36) DEFAULT NULL COMMENT '关联活动ID',

    -- 消息内容
    type VARCHAR(50) DEFAULT NULL COMMENT '消息类型：registration/approval/reminder/update/system',
    title VARCHAR(200) DEFAULT NULL COMMENT '消息标题',
    content TEXT DEFAULT NULL COMMENT '消息内容',

    -- 状态
    is_read TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    -- 外键和索引
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ============================================
-- 完成提示
-- ============================================
SELECT '数据库表结构创建完成！' AS message;
SELECT CONCAT('总共创建了 ', COUNT(*), ' 张表') AS summary
FROM information_schema.tables
WHERE table_schema = 'activity_assistant';
