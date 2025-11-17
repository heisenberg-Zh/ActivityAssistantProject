-- 完整测试数据插入脚本（根据实际表结构）
USE activity_assistant;

-- 清理旧数据
DELETE FROM checkins WHERE activity_id LIKE 'TEST_%';
DELETE FROM registrations WHERE activity_id LIKE 'TEST_%';
DELETE FROM activities WHERE id LIKE 'TEST_%';

-- ========== 插入测试活动 ==========

-- 1. 公开活动-即将开始（可以编辑、报名、管理）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants,
    fee, fee_type, need_review, is_public, is_deleted
) VALUES (
    'TEST_PUBLIC_UPCOMING',
    '周末篮球友谊赛',
    '欢迎所有篮球爱好者参加，不限水平，重在参与！',
    'u7d3f31690438',
    '运动',
    'published',
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR,
    DATE_ADD(NOW(), INTERVAL 2 DAY),
    '朝阳公园篮球场',
    '北京市朝阳区朝阳公园南路1号',
    39.9289,
    116.4833,
    500,
    20,
    5,
    10,
    0,
    'free',
    false,
    true,
    false
);

-- 2. 公开活动-进行中（可以签到）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants,
    fee, fee_type, need_review, is_public, is_deleted
) VALUES (
    'TEST_PUBLIC_ONGOING',
    '编程技术分享会',
    '分享最新的前端开发技术和经验',
    'u7d3f31690438',
    '培训',
    'ongoing',
    DATE_SUB(NOW(), INTERVAL 1 HOUR),
    DATE_ADD(NOW(), INTERVAL 2 HOUR),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    '中关村创业大街3W咖啡',
    '北京市海淀区中关村大街3号',
    39.9833,
    116.3167,
    300,
    30,
    7,
    10,
    0,
    'free',
    false,
    true,
    false
);

-- 3. 公开活动-已结束（可以查看统计、评价）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants,
    fee, fee_type, need_review, is_public, is_deleted
) VALUES (
    'TEST_PUBLIC_FINISHED',
    '上周羽毛球活动',
    '羽毛球爱好者聚会，已圆满结束',
    'u7d3f31690438',
    '运动',
    'finished',
    DATE_SUB(NOW(), INTERVAL 7 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR,
    DATE_SUB(NOW(), INTERVAL 8 DAY),
    '奥林匹克体育中心',
    '北京市朝阳区国家体育场南路1号',
    39.9928,
    116.3972,
    500,
    24,
    4,
    10,
    50,
    'AA',
    false,
    true,
    false
);

-- 4. 私密活动-需要审核（测试权限和审核功能）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants,
    fee, fee_type, need_review, is_public, is_deleted
) VALUES (
    'TEST_PRIVATE_REVIEW',
    '公司内部培训-产品发布会',
    '仅限公司员工参加，需要审核',
    'u7d3f31690438',
    '会议',
    'published',
    DATE_ADD(NOW(), INTERVAL 5 DAY),
    DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR,
    DATE_ADD(NOW(), INTERVAL 4 DAY),
    '公司会议室A',
    '北京市海淀区中关村软件园',
    39.9833,
    116.3167,
    200,
    50,
    7,
    20,
    0,
    'free',
    true,
    false,
    false
);

-- 5. 有分组的活动（测试分组功能）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants,
    fee, fee_type, need_review, is_public, is_deleted,
    `groups`
) VALUES (
    'TEST_WITH_GROUPS',
    '户外徒步活动-分难度分组',
    '根据个人体能选择不同难度的路线',
    'u7d3f31690438',
    '户外',
    'published',
    DATE_ADD(NOW(), INTERVAL 10 DAY),
    DATE_ADD(NOW(), INTERVAL 10 DAY) + INTERVAL 6 HOUR,
    DATE_ADD(NOW(), INTERVAL 8 DAY),
    '香山公园',
    '北京市海淀区香山买卖街40号',
    39.9956,
    116.1906,
    500,
    60,
    5,
    20,
    100,
    'AA',
    false,
    true,
    false,
    '[{"id":"g1","name":"初级组","total":30,"joined":3,"fee":50,"feeType":"AA","description":"适合初次参加户外活动的朋友","requirements":"无特殊要求"},{"id":"g2","name":"进阶组","total":20,"joined":1,"fee":80,"feeType":"AA","description":"适合有一定户外经验的朋友","requirements":"需要有登山经验"},{"id":"g3","name":"高级组","total":10,"joined":1,"fee":150,"feeType":"AA","description":"适合资深户外爱好者","requirements":"需要提供户外装备清单"}]'
);

-- 6. 别人创建的公开活动（用于测试"我参加的"功能）
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants,
    fee, fee_type, need_review, is_public, is_deleted
) VALUES (
    'TEST_OTHERS_PUBLIC',
    '周末聚餐活动',
    '朋友聚会，欢迎新朋友加入',
    'u1',
    '聚会',
    'published',
    DATE_ADD(NOW(), INTERVAL 6 DAY),
    DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 3 HOUR,
    DATE_ADD(NOW(), INTERVAL 5 DAY),
    '三里屯某餐厅',
    '北京市朝阳区三里屯路11号',
    39.9389,
    116.4556,
    300,
    15,
    1,
    5,
    150,
    'AA',
    false,
    true,
    false
);

-- ========== 插入报名记录 ==========

-- 篮球友谊赛的报名（5人已通过）
INSERT INTO registrations (id, activity_id, user_id, name, mobile, status, registered_at) VALUES
('REG_TEST_001', 'TEST_PUBLIC_UPCOMING', 'u7d3f31690438', '用户7d3f31', '138****1234', 'approved', NOW()),
('REG_TEST_002', 'TEST_PUBLIC_UPCOMING', 'u1', '张小明', '138****1234', 'approved', NOW()),
('REG_TEST_003', 'TEST_PUBLIC_UPCOMING', 'u2', '李小红', '139****5678', 'approved', NOW()),
('REG_TEST_004', 'TEST_PUBLIC_UPCOMING', 'u3', '王小刚', '136****9012', 'approved', NOW()),
('REG_TEST_005', 'TEST_PUBLIC_UPCOMING', 'u4', '赵小美', '137****3456', 'approved', NOW());

-- 编程分享会的报名（7人已通过，部分已签到）
INSERT INTO registrations (id, activity_id, user_id, name, mobile, status, registered_at, approved_at) VALUES
('REG_TEST_006', 'TEST_PUBLIC_ONGOING', 'u7d3f31690438', '用户7d3f31', '138****1234', 'approved', NOW(), NOW()),
('REG_TEST_007', 'TEST_PUBLIC_ONGOING', 'u1', '张小明', '138****1234', 'approved', NOW(), NOW()),
('REG_TEST_008', 'TEST_PUBLIC_ONGOING', 'u2', '李小红', '139****5678', 'approved', NOW(), NOW()),
('REG_TEST_009', 'TEST_PUBLIC_ONGOING', 'u3', '王小刚', '136****9012', 'approved', NOW(), NOW()),
('REG_TEST_010', 'TEST_PUBLIC_ONGOING', 'u4', '赵小美', '137****3456', 'approved', NOW(), NOW()),
('REG_TEST_011', 'TEST_PUBLIC_ONGOING', 'u5', '孙小强', '135****7890', 'approved', NOW(), NOW()),
('REG_TEST_012', 'TEST_PUBLIC_ONGOING', 'u6', '周小芳', '134****2345', 'approved', NOW(), NOW());

-- 羽毛球活动的报名（4人已通过，活动已结束）
INSERT INTO registrations (id, activity_id, user_id, name, mobile, status, registered_at, approved_at) VALUES
('REG_TEST_013', 'TEST_PUBLIC_FINISHED', 'u7d3f31690438', '用户7d3f31', '138****1234', 'approved', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
('REG_TEST_014', 'TEST_PUBLIC_FINISHED', 'u1', '张小明', '138****1234', 'approved', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
('REG_TEST_015', 'TEST_PUBLIC_FINISHED', 'u2', '李小红', '139****5678', 'approved', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
('REG_TEST_016', 'TEST_PUBLIC_FINISHED', 'u3', '王小刚', '136****9012', 'approved', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY));

-- 私密活动的报名（待审核、已通过、已拒绝）
INSERT INTO registrations (id, activity_id, user_id, name, mobile, status, registered_at, approved_at) VALUES
('REG_TEST_017', 'TEST_PRIVATE_REVIEW', 'u1', '张小明', '138****1234', 'pending', NOW(), NULL),
('REG_TEST_018', 'TEST_PRIVATE_REVIEW', 'u2', '李小红', '139****5678', 'approved', NOW(), NOW()),
('REG_TEST_019', 'TEST_PRIVATE_REVIEW', 'u3', '王小刚', '136****9012', 'rejected', NOW(), NOW()),
('REG_TEST_020', 'TEST_PRIVATE_REVIEW', 'u4', '赵小美', '137****3456', 'pending', NOW(), NULL),
('REG_TEST_021', 'TEST_PRIVATE_REVIEW', 'u5', '孙小强', '135****7890', 'approved', NOW(), NOW()),
('REG_TEST_022', 'TEST_PRIVATE_REVIEW', 'u6', '周小芳', '134****2345', 'pending', NOW(), NULL),
('REG_TEST_023', 'TEST_PRIVATE_REVIEW', 'u7d3f31690438', '用户7d3f31', '138****1234', 'approved', NOW(), NOW());

-- 分组活动的报名（分配到不同组）
INSERT INTO registrations (id, activity_id, user_id, name, mobile, status, group_id, registered_at, approved_at) VALUES
('REG_TEST_024', 'TEST_WITH_GROUPS', 'u1', '张小明', '138****1234', 'approved', 'g1', NOW(), NOW()),
('REG_TEST_025', 'TEST_WITH_GROUPS', 'u2', '李小红', '139****5678', 'approved', 'g1', NOW(), NOW()),
('REG_TEST_026', 'TEST_WITH_GROUPS', 'u3', '王小刚', '136****9012', 'approved', 'g2', NOW(), NOW()),
('REG_TEST_027', 'TEST_WITH_GROUPS', 'u4', '赵小美', '137****3456', 'approved', 'g3', NOW(), NOW()),
('REG_TEST_028', 'TEST_WITH_GROUPS', 'u7d3f31690438', '用户7d3f31', '138****1234', 'approved', 'g1', NOW(), NOW());

-- 当前用户报名别人的活动（已通过）
INSERT INTO registrations (id, activity_id, user_id, name, mobile, status, registered_at, approved_at) VALUES
('REG_TEST_029', 'TEST_OTHERS_PUBLIC', 'u7d3f31690438', '用户7d3f31', '138****1234', 'approved', NOW(), NOW());

-- ========== 插入签到记录 ==========

-- 编程分享会的签到（4人已签到）
INSERT INTO checkins (id, activity_id, user_id, registration_id, checkin_time, latitude, longitude, address, is_valid) VALUES
('CHECKIN_TEST_001', 'TEST_PUBLIC_ONGOING', 'u7d3f31690438', 'REG_TEST_006', DATE_SUB(NOW(), INTERVAL 30 MINUTE), 39.9833, 116.3167, '北京市海淀区中关村大街3号', true),
('CHECKIN_TEST_002', 'TEST_PUBLIC_ONGOING', 'u1', 'REG_TEST_007', DATE_SUB(NOW(), INTERVAL 40 MINUTE), 39.9833, 116.3167, '北京市海淀区中关村大街3号', true),
('CHECKIN_TEST_003', 'TEST_PUBLIC_ONGOING', 'u2', 'REG_TEST_008', DATE_SUB(NOW(), INTERVAL 35 MINUTE), 39.9833, 116.3167, '北京市海淀区中关村大街3号', true),
('CHECKIN_TEST_004', 'TEST_PUBLIC_ONGOING', 'u3', 'REG_TEST_009', DATE_SUB(NOW(), INTERVAL 25 MINUTE), 39.9833, 116.3167, '北京市海淀区中关村大街3号', true);

-- 羽毛球活动的签到（3人已签到，活动已结束）
INSERT INTO checkins (id, activity_id, user_id, registration_id, checkin_time, latitude, longitude, address, is_valid) VALUES
('CHECKIN_TEST_005', 'TEST_PUBLIC_FINISHED', 'u7d3f31690438', 'REG_TEST_013', DATE_SUB(NOW(), INTERVAL 7 DAY), 39.9928, 116.3972, '北京市朝阳区国家体育场南路1号', true),
('CHECKIN_TEST_006', 'TEST_PUBLIC_FINISHED', 'u1', 'REG_TEST_014', DATE_SUB(NOW(), INTERVAL 7 DAY), 39.9928, 116.3972, '北京市朝阳区国家体育场南路1号', true),
('CHECKIN_TEST_007', 'TEST_PUBLIC_FINISHED', 'u2', 'REG_TEST_015', DATE_SUB(NOW(), INTERVAL 7 DAY), 39.9928, 116.3972, '北京市朝阳区国家体育场南路1号', true);

-- ========== 验证数据插入 ==========
SELECT '========== 测试数据插入完成 ==========' AS message;
SELECT CONCAT('插入了 ', COUNT(*), ' 条活动记录') AS result FROM activities WHERE id LIKE 'TEST_%';
SELECT CONCAT('插入了 ', COUNT(*), ' 条报名记录') AS result FROM registrations WHERE id LIKE 'REG_TEST_%';
SELECT CONCAT('插入了 ', COUNT(*), ' 条签到记录') AS result FROM checkins WHERE id LIKE 'CHECKIN_TEST_%';
