-- ============================================
-- ActivityAssistant 数据库建表脚本
-- 版本: 1.0
-- 创建日期: 2025-01-30
-- 说明: 生产环境数据库初始化脚本
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS activity_assistant
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE activity_assistant;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY COMMENT '用户ID',
    open_id VARCHAR(100) NOT NULL UNIQUE COMMENT '微信OpenID',
    union_id VARCHAR(100) COMMENT '微信UnionID',
    nickname VARCHAR(100) COMMENT '用户昵称',
    avatar VARCHAR(500) COMMENT '头像URL',
    mobile VARCHAR(20) COMMENT '手机号',
    role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '用户角色: user=普通用户, admin=管理员',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_open_id (open_id),
    INDEX idx_mobile (mobile),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 活动表 (activities)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(36) PRIMARY KEY COMMENT '活动ID (UUID)',
    title VARCHAR(200) NOT NULL COMMENT '活动标题',
    description TEXT COMMENT '活动描述',
    organizer_id VARCHAR(36) NOT NULL COMMENT '组织者ID',
    type VARCHAR(50) COMMENT '活动类型: 运动/聚会/培训/户外',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '活动状态: pending/published/ongoing/finished/cancelled',

    -- 时间相关
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    register_deadline DATETIME COMMENT '报名截止时间',
    scheduled_publish_time DATETIME COMMENT '定时发布时间',
    actual_publish_time DATETIME COMMENT '实际发布时间',

    -- 地点相关
    place VARCHAR(200) COMMENT '地点名称',
    address VARCHAR(500) COMMENT '详细地址',
    latitude DECIMAL(10, 7) COMMENT '纬度',
    longitude DECIMAL(10, 7) COMMENT '经度',
    checkin_radius INT NOT NULL DEFAULT 500 COMMENT '签到范围(米)',

    -- 人数相关
    total INT NOT NULL COMMENT '总人数上限',
    joined INT NOT NULL DEFAULT 0 COMMENT '已报名人数',
    min_participants INT NOT NULL DEFAULT 1 COMMENT '最小人数',

    -- 费用相关
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '费用',
    fee_type VARCHAR(20) NOT NULL DEFAULT 'free' COMMENT '费用类型: free/AA/uniform',

    -- 配置相关
    need_review BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否需要审核',
    is_public BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否公开',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否删除(软删除)',

    -- JSON字段
    `groups` JSON COMMENT '分组数据',
    administrators JSON COMMENT '管理员列表',
    whitelist JSON COMMENT '白名单',
    blacklist JSON COMMENT '黑名单',
    custom_fields JSON COMMENT '自定义字段',

    -- 周期性活动
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否周期性活动',
    recurring_group_id VARCHAR(36) COMMENT '周期性活动组ID',
    recurring_config JSON COMMENT '周期配置',

    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_organizer_id (organizer_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX idx_created_at (created_at),
    INDEX idx_is_public (is_public),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_scheduled_publish_time (scheduled_publish_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- ============================================
-- 3. 报名表 (registrations)
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(36) PRIMARY KEY COMMENT '报名ID (UUID)',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    group_id VARCHAR(50) COMMENT '分组ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '报名姓名',
    mobile VARCHAR(20) COMMENT '联系电话',

    -- 自定义数据
    custom_data JSON COMMENT '自定义字段值',

    -- 报名状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '报名状态: pending/approved/rejected/cancelled',
    registered_at DATETIME NOT NULL COMMENT '报名时间',
    approved_at DATETIME COMMENT '审核通过时间',

    -- 签到相关
    checkin_status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '签到状态: pending/checked/late',
    checkin_time DATETIME COMMENT '签到时间',

    INDEX idx_activity_id (activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_checkin_status (checkin_status),
    INDEX idx_registered_at (registered_at),
    INDEX idx_activity_user (activity_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报名表';

-- ============================================
-- 4. 签到表 (checkins)
-- ============================================
CREATE TABLE IF NOT EXISTS checkins (
    id VARCHAR(36) PRIMARY KEY COMMENT '签到ID (UUID)',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    registration_id VARCHAR(36) NOT NULL COMMENT '报名记录ID',

    -- 位置信息
    latitude DECIMAL(10, 7) COMMENT '签到纬度',
    longitude DECIMAL(10, 7) COMMENT '签到经度',
    address VARCHAR(500) COMMENT '签到地址',
    distance INT COMMENT '距离活动地点的距离(米)',

    -- 签到状态
    checkin_time DATETIME NOT NULL COMMENT '签到时间',
    is_late BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否迟到',
    is_valid BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否有效(位置验证)',
    note TEXT COMMENT '备注',

    INDEX idx_activity_id (activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_registration_id (registration_id),
    INDEX idx_checkin_time (checkin_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到表';

-- ============================================
-- 5. 评价表 (reviews)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY COMMENT '评价ID (UUID)',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    user_id VARCHAR(36) NOT NULL COMMENT '评价人ID',
    user_name VARCHAR(100) COMMENT '评价人昵称(冗余存储)',
    user_avatar VARCHAR(500) COMMENT '评价人头像(冗余存储)',

    -- 评价内容
    rating INT NOT NULL COMMENT '评分(1-5星)',
    content TEXT COMMENT '评价内容',

    -- 软删除
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否被管理员删除',
    delete_reason VARCHAR(200) COMMENT '删除原因',
    deleted_by VARCHAR(36) COMMENT '删除操作人ID',
    deleted_at DATETIME COMMENT '删除时间',

    -- 时间戳
    created_at DATETIME NOT NULL COMMENT '创建时间',
    updated_at DATETIME COMMENT '更新时间',

    INDEX idx_activity_id (activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价表';

-- ============================================
-- 6. 消息表 (messages)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY COMMENT '消息ID',
    user_id VARCHAR(36) NOT NULL COMMENT '接收用户ID',
    type VARCHAR(50) NOT NULL COMMENT '消息类型: publish_success/publish_failed/activity_reminder/system',
    title VARCHAR(200) NOT NULL COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    activity_id VARCHAR(36) COMMENT '关联活动ID',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已读',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_activity_id (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ============================================
-- 7. 收藏表 (favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',

    UNIQUE KEY uk_user_activity (user_id, activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ============================================
-- 8. 反馈表 (feedbacks)
-- ============================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '反馈ID',
    user_id VARCHAR(36) COMMENT '用户ID(可选,允许匿名)',
    content TEXT NOT NULL COMMENT '反馈内容',
    contact_info VARCHAR(200) COMMENT '联系方式',
    type VARCHAR(50) COMMENT '反馈类型: bug/suggestion/other',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '处理状态: pending/processing/resolved/closed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反馈表';

-- ============================================
-- 9. 序列号生成器表 (sequence_generator)
-- ============================================
CREATE TABLE IF NOT EXISTS sequence_generator (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    business_type VARCHAR(20) NOT NULL COMMENT '业务类型: activity/registration/checkin/message',
    date_key VARCHAR(8) NOT NULL COMMENT '日期键(YYYYMMDD)',
    current_value INT NOT NULL DEFAULT 0 COMMENT '当前序列值',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY uk_business_date (business_type, date_key),
    INDEX idx_business_type (business_type),
    INDEX idx_date_key (date_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='序列号生成器表';

-- ============================================
-- 建表脚本执行完成
-- ============================================
