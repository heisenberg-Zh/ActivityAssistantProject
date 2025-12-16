-- ============================================
-- ActivityAssistant 测试数据初始化脚本
-- 包含测试用户和10个测试活动
-- 所有活动名称都包含 "test"
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 步骤 1: 插入测试用户（活动组织者）
-- ============================================

-- 清理可能存在的测试数据
DELETE FROM users WHERE id LIKE 'test_user_%';

-- 插入5个测试用户
INSERT INTO users (id, open_id, union_id, nickname, avatar_url, gender, phone, email, created_at, updated_at) VALUES
('test_user_001', 'test_openid_001', 'test_unionid_001', 'Test运动达人', 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955Htv9ztzhn5DtCmcmjvdARs6HXzVsv3gJ2TNVxCxFpw7PXzjCc6I4THlIhMH0qCXCg/132', 1, '13800138001', 'test001@example.com', NOW(), NOW()),
('test_user_002', 'test_openid_002', 'test_unionid_002', 'Test户外领队', 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83eqdYm5CUFoWQQxXvVUQ8e3C8gia1xJbwVQPsWnZFsVRjibx3rQVvT4YbE3wHFOI0f9IrY1dicE3zxf0A/132', 1, '13800138002', 'test002@example.com', NOW(), NOW()),
('test_user_003', 'test_openid_003', 'test_unionid_003', 'Test文艺青年', 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJIbT9bibibUNjBDXiaO3PicB5lPZ6M7vwJ5T3jickbvicl5EgqibF8vicFYkYhbcfGFkJEp6Hiatqiaia3N0LA/132', 2, '13800138003', 'test003@example.com', NOW(), NOW()),
('test_user_004', 'test_openid_004', 'test_unionid_004', 'Test社交达人', 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132', 1, '13800138004', 'test004@example.com', NOW(), NOW()),
('test_user_005', 'test_openid_005', 'test_unionid_005', 'Test学习小组', 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83epXTjicW8nvRxQQXJ7hy0kXZDnZV1aKf0xJrZPGxaKM6xLF7xZ5sUibOiaciaFBBK03spxYGJ0fCLkBWQ/132', 2, '13800138005', 'test005@example.com', NOW(), NOW());

-- ============================================
-- 步骤 2: 插入10个测试活动
-- ============================================

-- 清理可能存在的测试活动数据
DELETE FROM activities WHERE id LIKE 'test_act_%';

-- 活动1: Test周末羽毛球活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_001',
    'Test周末羽毛球活动',
    '本次test活动欢迎所有羽毛球爱好者参加！不限水平，重在参与。活动提供羽毛球拍和羽毛球，也欢迎自带装备。场地设施完善，有专业教练现场指导初学者。活动后可以一起聚餐交流。',
    'test_user_001',
    'sports',
    'published',
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    DATE_ADD(NOW(), INTERVAL 3 DAY + INTERVAL 2 HOUR),
    DATE_ADD(NOW(), INTERVAL 2 DAY),
    '市体育馆羽毛球场',
    '北京市朝阳区东三环北路38号',
    39.9289400,
    116.4484100,
    500,
    20,
    8,
    10,
    0.00,
    'free',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动2: Test周日爬山徒步活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_002',
    'Test周日爬山徒步活动',
    '一起参加test户外活动，去爬山呼吸新鲜空气，锻炼身体！路线难度适中，适合新手和有经验的户外爱好者。全程约5公里，预计3-4小时完成。请自备登山鞋、防晒用品、饮用水和简单干粮。',
    'test_user_002',
    'outdoor',
    'published',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    DATE_ADD(NOW(), INTERVAL 7 DAY + INTERVAL 5 HOUR),
    DATE_ADD(NOW(), INTERVAL 6 DAY),
    '香山公园',
    '北京市海淀区买卖街40号香山公园北门',
    39.9945600,
    116.1897200,
    800,
    30,
    15,
    15,
    20.00,
    'AA',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动3: Test周六电影观影活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_003',
    'Test周六电影观影活动',
    'Test社交活动：一起看最新上映的热门电影，观影后可以在咖啡厅讨论交流观影心得。适合喜欢电影的朋友们一起分享快乐时光。电影票统一预订，提前10分钟到场取票。',
    'test_user_003',
    'entertainment',
    'published',
    DATE_ADD(NOW(), INTERVAL 5 DAY),
    DATE_ADD(NOW(), INTERVAL 5 DAY + INTERVAL 3 HOUR),
    DATE_ADD(NOW(), INTERVAL 4 DAY),
    '万达影城三里屯店',
    '北京市朝阳区三里屯路19号三里屯太古里',
    39.9368600,
    116.4551800,
    300,
    15,
    10,
    8,
    65.00,
    'uniform',
    true,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动4: Test周五桌游聚会
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_004',
    'Test周五桌游聚会',
    'Test桌游活动，各种桌游任你选！狼人杀、三国杀、卡坦岛、阿瓦隆等等应有尽有。轻松交友，认识新朋友。适合新手和老玩家，有专人讲解规则。提供免费饮料和小食。',
    'test_user_004',
    'social',
    'published',
    DATE_ADD(NOW(), INTERVAL 2 DAY),
    DATE_ADD(NOW(), INTERVAL 2 DAY + INTERVAL 4 HOUR),
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    '三里屯桌游吧',
    '北京市朝阳区三里屯SOHO 2号商场B1层',
    39.9373200,
    116.4546700,
    200,
    12,
    9,
    6,
    30.00,
    'AA',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动5: Test周三读书分享会
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_005',
    'Test周三读书分享会',
    'Test文化活动：本期主题是科幻小说《三体》三部曲。欢迎所有科幻爱好者参加，分享阅读感受和思考。活动包括：主题分享、小组讨论、互动问答。请提前阅读相关章节。',
    'test_user_005',
    'culture',
    'published',
    DATE_ADD(NOW(), INTERVAL 6 DAY),
    DATE_ADD(NOW(), INTERVAL 6 DAY + INTERVAL 2 HOUR),
    DATE_ADD(NOW(), INTERVAL 5 DAY),
    '市图书馆',
    '北京市西城区西长安街88号首都图书馆三楼会议室',
    39.9087700,
    116.3633900,
    400,
    25,
    18,
    10,
    0.00,
    'free',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动6: Test周二瑜伽课程
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_006',
    'Test周二瑜伽课程',
    'Test健身活动：专业瑜伽教练带领，适合初学者和有经验者。课程包括基础体式、呼吸练习、冥想放松。请自备瑜伽垫，穿着舒适的运动服装。活动氛围轻松愉快，帮助释放压力。',
    'test_user_001',
    'sports',
    'published',
    DATE_ADD(NOW(), INTERVAL 4 DAY),
    DATE_ADD(NOW(), INTERVAL 4 DAY + INTERVAL 90 MINUTE),
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    '悦动瑜伽馆',
    '北京市朝阳区建国门外大街1号国贸商城',
    39.9085400,
    116.4575900,
    300,
    18,
    12,
    8,
    50.00,
    'uniform',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动7: Test周六露营活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_007',
    'Test周六露营活动',
    'Test户外露营体验！远离城市喧嚣，亲近大自然。活动包括：搭建帐篷、篝火晚会、户外烹饪、星空观赏。提供露营装备租赁服务（额外收费）。请带好个人用品、防蚊用品和御寒衣物。',
    'test_user_002',
    'outdoor',
    'published',
    DATE_ADD(NOW(), INTERVAL 9 DAY),
    DATE_ADD(NOW(), INTERVAL 10 DAY),
    DATE_ADD(NOW(), INTERVAL 8 DAY),
    '怀柔山谷露营地',
    '北京市怀柔区雁栖镇范各庄村北',
    40.3667000,
    116.6367000,
    1000,
    25,
    6,
    15,
    150.00,
    'uniform',
    true,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动8: Test周四英语角活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_008',
    'Test周四英语角活动',
    'Test语言学习活动：每周四晚的英语角，提供轻松的英语交流环境。本周话题："Travel & Culture"。不限英语水平，鼓励开口交流。有外教参与互动，提供茶点饮料。',
    'test_user_005',
    'education',
    'published',
    DATE_ADD(NOW(), INTERVAL 8 DAY),
    DATE_ADD(NOW(), INTERVAL 8 DAY + INTERVAL 2 HOUR),
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    '星巴克咖啡（国贸店）',
    '北京市朝阳区建国门外大街1号国贸商城北区1层',
    39.9088100,
    116.4583200,
    200,
    20,
    14,
    8,
    0.00,
    'free',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动9: Test周日篮球友谊赛
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_009',
    'Test周日篮球友谊赛',
    'Test篮球活动：组织5对5篮球友谊赛，不限水平，欢迎篮球爱好者参加。室内标准篮球场，设施完善。提供饮用水和急救药箱。建议提前热身，注意运动安全。活动后可一起聚餐。',
    'test_user_001',
    'sports',
    'published',
    DATE_ADD(NOW(), INTERVAL 11 DAY),
    DATE_ADD(NOW(), INTERVAL 11 DAY + INTERVAL 3 HOUR),
    DATE_ADD(NOW(), INTERVAL 10 DAY),
    '工人体育馆篮球场',
    '北京市朝阳区工人体育场北路',
    39.9296000,
    116.4368000,
    500,
    24,
    16,
    10,
    30.00,
    'AA',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- 活动10: Test周六摄影外拍活动
INSERT INTO activities (
    id, title, description, organizer_id, type, status,
    start_time, end_time, register_deadline,
    place, address, latitude, longitude, checkin_radius,
    total, joined, min_participants, fee, fee_type,
    need_review, is_public, is_deleted,
    is_recurring, created_at, updated_at
) VALUES (
    'test_act_010',
    'Test周六摄影外拍活动',
    'Test摄影爱好者活动：前往颐和园进行外拍创作。主题为"秋色京城"，适合风光摄影和人像摄影。有资深摄影师现场指导构图和用光技巧。欢迎各类相机和手机摄影。活动后分享作品交流心得。',
    'test_user_003',
    'art',
    'published',
    DATE_ADD(NOW(), INTERVAL 12 DAY),
    DATE_ADD(NOW(), INTERVAL 12 DAY + INTERVAL 4 HOUR),
    DATE_ADD(NOW(), INTERVAL 11 DAY),
    '颐和园',
    '北京市海淀区新建宫门路19号颐和园东门',
    39.9996200,
    116.2751400,
    800,
    22,
    11,
    8,
    20.00,
    'uniform',
    false,
    true,
    false,
    false,
    NOW(),
    NOW()
);

-- ============================================
-- 步骤 3: 验证插入结果
-- ============================================

-- 查询测试用户数量
SELECT COUNT(*) as '测试用户数量' FROM users WHERE id LIKE 'test_user_%';

-- 查询测试活动数量
SELECT COUNT(*) as '测试活动数量' FROM activities WHERE id LIKE 'test_act_%';

-- 显示所有测试活动
SELECT
    id as '活动ID',
    title as '活动标题',
    type as '类型',
    status as '状态',
    is_public as '公开',
    total as '总人数',
    joined as '已报名',
    start_time as '开始时间',
    place as '地点'
FROM activities
WHERE id LIKE 'test_act_%'
ORDER BY start_time;

-- ============================================
-- 完成
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✓ 测试数据初始化完成！' as 'Status';
SELECT '- 已创建 5 个测试用户' as 'Info';
SELECT '- 已创建 10 个测试活动' as 'Info';
SELECT '- 所有活动标题都包含 "test"' as 'Info';
SELECT '- 所有活动状态为 published 且公开可见' as 'Info';
