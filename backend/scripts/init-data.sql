-- ============================================
-- ActivityAssistant 测试数据脚本
-- 数据库：activity_assistant
-- 创建日期：2025-01-08
-- 说明：导入测试数据（基于前端mock.js）
-- ============================================

USE activity_assistant;

-- 清空现有数据（谨慎！）
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE messages;
TRUNCATE TABLE checkins;
TRUNCATE TABLE registrations;
TRUNCATE TABLE activities;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. 用户数据 (6个测试用户)
-- ============================================
INSERT INTO users (id, open_id, nickname, avatar, mobile, role, created_at) VALUES
('u1', 'openid_u1', '张小北', '/activityassistant_avatar_01.png', '138****1234', 'organizer', '2024-06-01 10:00:00'),
('u2', 'openid_u2', '李小雅', '/activityassistant_avatar_02.png', '139****5678', 'organizer', '2024-06-02 11:00:00'),
('u3', 'openid_u3', '王小文', '/activityassistant_avatar_03.png', '136****9012', 'user', '2024-06-03 12:00:00'),
('u4', 'openid_u4', '赵小海', '/activityassistant_avatar_04.png', '137****3456', 'user', '2024-06-04 13:00:00'),
('u5', 'openid_u5', '李晓峰', '/activityassistant_avatar_01.png', '135****7890', 'organizer', '2024-06-05 14:00:00'),
('u6', 'openid_u6', '王晨', '/activityassistant_avatar_02.png', '134****2345', 'organizer', '2024-06-06 15:00:00');

-- ============================================
-- 2. 活动数据（精选示例）
-- ============================================

-- 活动1：进行中的网球活动（有分组）
-- 活动1：进行中的网球活动（有分组）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    `groups`, created_at
) VALUES (
    'a1',
    '周末网球活动',
    '奥体中心网球场，分基础教学组和进阶比赛组，欢迎不同水平的球友参加。',
    'u1',
    '运动',
    'ongoing',
    '2025-12-15 14:00:00',
    '2025-12-15 18:00:00',
    '2025-12-15 12:00:00',
    '奥体中心网球场',
    '北京市朝阳区奥体中心',
    39.9928,
    116.3972,
    500,
    20,
    13,
    10,
    0,
    '免费',
    0,
    1,
    0,
    '[
        {
            "id": "g1",
            "name": "A组-基础教学",
            "total": 12,
            "joined": 8,
            "fee": 50,
            "feeType": "AA",
            "requirements": "适合初学者，在8号场地，需自带球拍",
            "description": "基础动作教学，适合零基础和初学者，教练现场指导。",
            "customFields": [
                {"id": "name", "label": "昵称", "required": true, "desc": "默认获取微信昵称，可修改", "isCustom": false},
                {"id": "mobile", "label": "手机号", "required": true, "desc": "用于联系参与者", "isCustom": false},
                {"id": "custom_1", "label": "网球经验", "required": false, "desc": "请简述您的网球经验", "isCustom": true}
            ]
        },
        {
            "id": "g2",
            "name": "B组-进阶比赛",
            "total": 8,
            "joined": 5,
            "fee": 80,
            "feeType": "AA",
            "requirements": "需有一定基础，在9号场地，需自带球拍和运动鞋",
            "description": "适合有一定基础的球友，进行实战对抗和技术提升。",
            "customFields": [
                {"id": "name", "label": "昵称", "required": true, "desc": "默认获取微信昵称，可修改", "isCustom": false},
                {"id": "mobile", "label": "手机号", "required": true, "desc": "用于联系参与者", "isCustom": false},
                {"id": "custom_1", "label": "技术水平", "required": true, "desc": "初级/中级/高级", "isCustom": true}
            ]
        }
    ]',
    '2025-12-10 10:00:00'
);

-- 活动2：即将开始的聚餐（无分组）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    custom_fields, created_at
) VALUES (
    'a1b',
    '周末聚餐活动',
    '邀约伙伴一起享受美食时光，畅聊生活与工作心得。',
    'u1',
    '聚会',
    'published',
    '2025-12-16 18:00:00',
    '2025-12-16 21:00:00',
    '2025-12-16 17:00:00',
    '海底捞火锅（朝阳店）',
    '北京市朝阳区三里屯太古里南区',
    39.9354,
    116.4481,
    500,
    12,
    8,
    5,
    100,
    'AA',
    0,
    1,
    0,
    '[
        {"id": "name", "label": "昵称", "required": true, "desc": "默认获取微信昵称，可修改", "isCustom": false},
        {"id": "mobile", "label": "手机号", "required": true, "desc": "用于联系参与者", "isCustom": false},
        {"id": "custom_1", "label": "饮食偏好", "required": false, "desc": "", "isCustom": true}
    ]',
    '2025-12-10 10:00:00'
);

-- 活动3：即将开始的培训活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    custom_fields, created_at
) VALUES (
    'a2',
    '产品设计沙龙',
    '学习最新的产品设计趋势和优秀案例分享。',
    'u5',
    '培训',
    'published',
    '2025-12-18 14:00:00',
    '2025-12-18 17:00:00',
    '2025-12-18 12:00:00',
    '创新大厅',
    '北京市海淀区知春路创新中心',
    39.9764,
    116.3252,
    300,
    20,
    15,
    10,
    0,
    '免费',
    1,
    1,
    0,
    '[
        {"id": "name", "label": "昵称", "required": true, "desc": "默认获取微信昵称，可修改", "isCustom": false},
        {"id": "mobile", "label": "手机号", "required": false, "desc": "用于联系参与者", "isCustom": false},
        {"id": "custom_1", "label": "公司名称", "required": false, "desc": "", "isCustom": true},
        {"id": "custom_2", "label": "职位", "required": false, "desc": "", "isCustom": true}
    ]',
    '2025-12-08 15:30:00'
);

-- 活动4：私密活动示例
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    administrators, whitelist, blacklist,
    custom_fields, created_at
) VALUES (
    'private1',
    '私密网球训练营',
    '仅限内部成员参加的网球训练营，专业教练指导，小班授课。',
    'u1',
    '运动',
    'published',
    '2025-12-18 14:00:00',
    '2025-12-18 17:00:00',
    '2025-12-17 20:00:00',
    '朝阳网球中心',
    '北京市朝阳区朝阳公园路1号',
    39.9280,
    116.4750,
    200,
    10,
    3,
    5,
    200,
    'AA',
    0,
    0,
    0,
    '[
        {"userId": "u2", "addedAt": "2025-12-12T10:00:00", "addedBy": "u1"}
    ]',
    '[
        {"phone": "138****1234", "userId": "u1", "addedAt": "2025-12-12T09:00:00", "addedBy": "u1"},
        {"phone": "139****5678", "userId": "u2", "addedAt": "2025-12-12T09:00:00", "addedBy": "u1"}
    ]',
    '[
        {"phone": "150****9999", "userId": null, "expiresAt": null, "isActive": true, "reason": "违反活动规则", "addedAt": "2025-12-13T10:00:00", "addedBy": "u1"}
    ]',
    '[
        {"id": "name", "label": "昵称", "required": true, "desc": "默认获取微信昵称，可修改", "isCustom": false},
        {"id": "mobile", "label": "手机号", "required": true, "desc": "用于联系参与者", "isCustom": false}
    ]',
    '2025-12-12 09:00:00'
);

-- ============================================
-- 3. 报名数据（部分示例）
-- ============================================
INSERT INTO registrations (
    id, activity_id, group_id, user_id, name, mobile,
    custom_data, status, registered_at, approved_at,
    checkin_status, checkin_time
) VALUES
-- 网球活动报名
('r1', 'a1', 'g1', 'u1', '张小北', '138****1234', '{"网球经验": "新手"}', 'approved', '2025-12-14 12:30:00', '2025-12-14 12:30:00', 'checked', '2025-12-15 14:05:00'),
('r2', 'a1', 'g1', 'u2', '李小雅', '139****5678', '{"网球经验": "有一定基础"}', 'approved', '2025-12-14 13:15:00', '2025-12-14 13:15:00', 'checked', '2025-12-15 14:12:00'),
('r3', 'a1', 'g2', 'u3', '王小文', '136****9012', '{"技术水平": "中级"}', 'approved', '2025-12-14 14:00:00', '2025-12-14 14:00:00', 'pending', NULL),

-- 聚餐活动报名
('r4', 'a1b', NULL, 'u4', '赵小海', '137****3456', '{"饮食偏好": "不吃辣"}', 'approved', '2025-12-15 10:00:00', '2025-12-15 10:00:00', 'pending', NULL);

-- ============================================
-- 4. 签到记录（部分示例）
-- ============================================
INSERT INTO checkins (
    id, activity_id, user_id, registration_id,
    latitude, longitude, address, distance,
    checkin_time, is_late, is_valid, note
) VALUES
('c1', 'a1', 'u1', 'r1', 39.9930, 116.3975, '北京市朝阳区奥体中心', 25, '2025-12-15 14:05:00', 0, 1, NULL),
('c2', 'a1', 'u2', 'r2', 39.9926, 116.3970, '北京市朝阳区奥体中心', 48, '2025-12-15 14:12:00', 0, 1, NULL);

-- ============================================
-- 5. 消息数据（部分示例）
-- ============================================
INSERT INTO messages (
    id, user_id, activity_id, type, title, content, is_read, created_at
) VALUES
('m1', 'u1', 'a1', 'registration', '报名成功', '您已成功报名"周末网球活动"', 1, '2025-12-14 12:30:00'),
('m2', 'u1', 'a1', 'reminder', '活动提醒', '"周末网球活动"将于明天14:00开始，请准时参加', 0, '2025-12-14 18:00:00'),
('m3', 'u2', 'a1', 'registration', '报名成功', '您已成功报名"周末网球活动"', 1, '2025-12-14 13:15:00');

-- ============================================
-- 完成提示
-- ============================================
SELECT '测试数据导入完成！' AS message;
SELECT
    CONCAT('用户数：', (SELECT COUNT(*) FROM users)) AS users,
    CONCAT('活动数：', (SELECT COUNT(*) FROM activities)) AS activities,
    CONCAT('报名数：', (SELECT COUNT(*) FROM registrations)) AS registrations,
    CONCAT('签到数：', (SELECT COUNT(*) FROM checkins)) AS checkins,
    CONCAT('消息数：', (SELECT COUNT(*) FROM messages)) AS messages;
