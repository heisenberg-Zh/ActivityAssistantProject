-- ==========================================
-- ActivityAssistant Mock Data SQL Script
-- 将前端假数据导入后端数据库
-- ==========================================

USE activity_assistant;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 清理已存在的测试数据
DELETE FROM checkins WHERE activity_id LIKE 'h%' OR activity_id = 'a0' OR activity_id = 'a3' OR activity_id = 'a4' OR activity_id LIKE 'scheduled%';
DELETE FROM registrations WHERE activity_id LIKE 'scheduled%' OR activity_id LIKE 'h%' OR activity_id = 'a0' OR activity_id = 'a3' OR activity_id = 'a4' OR activity_id = 'private2' OR id IN ('r2', 'r3', 'r4');
DELETE FROM activities WHERE id LIKE 'scheduled%' OR id LIKE 'h%' OR id = 'a0' OR id = 'a3' OR id = 'a4' OR id = 'private2';

-- ==========================================
-- 1. 插入缺失的活动数据
-- ==========================================

-- 预发布活动
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, scheduled_publish_time, actual_publish_time, is_recurring, recurring_group_id, recurring_config, created_at, updated_at) VALUES
('scheduled1', '周一网球活动', '每周一固定网球活动，欢迎所有水平的球友参加。', 'u1', '运动', '预发布', '2025-12-23 19:00:00', '2025-12-23 22:00:00', '2025-12-23 18:00:00', '奥体中心网球场', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 16, 0, 8, 50.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false}]', '2025-12-22 12:00:00', NULL, 1, 'recurring_tennis_monday', '{"frequency":"weekly","weekdays":[1],"totalWeeks":4}', '2025-12-14 10:00:00', NOW()),

('scheduled2', '周三网球活动', '每周三固定网球活动，欢迎所有水平的球友参加。', 'u1', '运动', '预发布', '2025-12-25 19:00:00', '2025-12-25 22:00:00', '2025-12-25 18:00:00', '奥体中心网球场', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 16, 0, 8, 50.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false}]', '2025-12-24 12:00:00', NULL, 1, 'recurring_tennis_wednesday', '{"frequency":"weekly","weekdays":[3],"totalWeeks":4}', '2025-12-14 10:00:00', NOW()),

('scheduled3', '新年联欢晚会', '欢庆2026新年，公司年度联欢晚会，精彩节目不容错过！', 'u1', '聚会', '预发布', '2025-12-31 18:00:00', '2025-12-31 22:00:00', '2025-12-30 18:00:00', '国际会议中心', '北京市朝阳区国际会议中心', 39.9085000, 116.4579000, 300, 200, 0, 50, 0.00, '免费', 1, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false},{"id":"custom_1","label":"部门","required":true,"desc":"请填写您的部门","isCustom":true}]', '2025-12-20 09:00:00', NULL, 0, NULL, NULL, '2025-12-14 15:30:00', NOW());

-- 私密活动
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, administrators, whitelist, blacklist, custom_fields, created_at, updated_at) VALUES
('private2', '公司团建-密室逃脱', '公司年度团建活动，密室逃脱主题，仅限本公司员工参加。', 'u1', '培训', '即将开始', '2025-12-20 19:00:00', '2025-12-20 22:00:00', '2025-12-19 18:00:00', '三里屯密室逃脱', '北京市朝阳区三里屯路11号', 39.9370000, 116.4580000, 150, 20, 12, 10, 0.00, '免费', 1, 0, 0, '[{"userId":"u3","addedAt":"2025-12-10 15:00","addedBy":"u1"},{"userId":"u4","addedAt":"2025-12-10 15:30","addedBy":"u1"}]', '[{"phone":"136****9012","userId":"u3","addedAt":"2025-12-10 14:00","addedBy":"u1"},{"phone":"137****3456","userId":"u4","addedAt":"2025-12-10 14:00","addedBy":"u1"},{"phone":"180****1111","userId":null,"addedAt":"2025-12-11 10:00","addedBy":"u1"}]', '[]', '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false},{"id":"custom_1","label":"部门","required":true,"desc":"请填写您的部门","isCustom":true}]', '2025-12-10 14:00:00', NOW());

-- 近期活动（含分组）
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, `groups`, custom_fields, created_at, updated_at) VALUES
('a0', '周六羽毛球联赛', '专业场地，分4个级别组别，适合各个水平的羽毛球爱好者。欢迎报名参加，认识新球友，切磋球技！', 'u5', '运动', '即将开始', '2025-12-21 09:00:00', '2025-12-21 17:00:00', '2025-12-20 20:00:00', '朝阳体育中心羽毛球馆', '北京市朝阳区朝阳公园南路8号', 39.9320000, 116.4802000, 300, 48, 5, 20, 0.00, '免费', 0, 1, 0, '[{"id":"g1","name":"A组-新手入门","total":12,"joined":2,"fee":30,"feeType":"AA","requirements":"适合0-6个月球龄的新手，提供基础教学，无需球拍可免费借用","description":"专门为新手设计的入门课程，教练会从握拍、发球等基础动作开始教学。场地在1-3号场。活动时间：09:00-12:00"},{"id":"g2","name":"B组-初级提高","total":10,"joined":1,"fee":50,"feeType":"AA","requirements":"6个月-1年球龄，掌握基本技术，能完成简单对抗","description":"适合有一定基础的球友，通过练习和实战提升技术水平。场地在4-5号场。活动时间：09:00-12:00"},{"id":"g3","name":"C组-中级竞技","total":16,"joined":1,"fee":80,"feeType":"AA","requirements":"1-3年球龄，技术较为全面，有比赛经验者优先","description":"中级水平竞技组，采用单淘汰赛制，设冠亚季军奖励。场地在6-9号场。活动时间：13:00-17:00"},{"id":"g4","name":"D组-高级邀请","total":10,"joined":1,"fee":100,"feeType":"统一收费","requirements":"3年以上球龄，经常参加比赛，技术水平优秀","description":"高级别邀请赛，邀请制参赛，采用循环赛+淘汰赛制度，奖金丰厚。场地在10-11号专业场地。活动时间：13:00-17:00"}]', '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false}]', '2025-12-12 16:30:00', NOW());

-- 近期活动（无分组）
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('a3', '周末登山活动', '感受自然风光，锻炼身体，适合亲友共同参与。', 'u6', '户外', '即将开始', '2025-12-20 08:00:00', '2025-12-20 16:00:00', '2025-12-19 18:00:00', '密云山地公园', '北京密云山地公园集合点', 40.3764000, 116.8432000, 1000, 10, 6, 5, 50.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false},{"id":"custom_1","label":"紧急联系人","required":true,"desc":"","isCustom":true},{"id":"custom_2","label":"紧急联系电话","required":true,"desc":"","isCustom":true}]', '2025-12-09 09:00:00', NOW()),

('a4', '城市摄影漫步', '与摄影爱好者一起探索冬日城市的光影故事。', 'u2', '户外', '已结束', '2025-12-12 15:00:00', '2025-12-12 18:00:00', '2025-12-12 14:00:00', '国贸三期集合', '北京市朝阳区建外大街国贸三期', 39.9085000, 116.4579000, 200, 18, 18, 8, 0.00, '免费', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":false,"desc":"用于联系参与者","isCustom":false},{"id":"custom_1","label":"摄影经验","required":false,"desc":"","isCustom":true}]', '2025-12-05 12:00:00', NOW());

-- 历史活动 (2025年11月)
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('h1', '周末羽毛球约战', '奥体中心羽毛球馆，约战球友，提升技术。', 'u1', '运动', '已结束', '2025-11-23 14:00:00', '2025-11-23 18:00:00', '2025-11-23 12:00:00', '奥体中心羽毛球馆', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 16, 12, 8, 40.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"默认获取微信昵称，可修改","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"用于联系参与者","isCustom":false}]', '2025-09-18 10:00:00', NOW()),

('h2', '冬季徒步活动', '香山红叶徒步，感受初冬自然美景。', 'u6', '户外', '已结束', '2025-11-16 08:00:00', '2025-11-16 15:00:00', '2025-11-15 20:00:00', '香山公园', '北京市海淀区香山公园', 39.9950000, 116.1889000, 1000, 20, 18, 10, 0.00, '免费', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-11-10 09:00:00', NOW()),

('h3', '朋友聚餐', '老友相聚，畅谈近况。', 'u2', '聚会', '已结束', '2025-11-09 18:30:00', '2025-11-09 21:00:00', '2025-11-09 17:00:00', '蜀大侠火锅', '北京市朝阳区三里屯太古里', 39.9354000, 116.4481000, 300, 10, 8, 5, 120.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":false,"desc":"","isCustom":false}]', '2025-11-05 14:00:00', NOW());

-- 历史活动 (2025年10月)
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('h4', '周末篮球友谊赛', '3v3篮球友谊赛，欢迎各路球友参加。', 'u3', '运动', '已结束', '2025-10-27 15:00:00', '2025-10-27 18:00:00', '2025-10-27 12:00:00', '朝阳公园篮球场', '北京市朝阳区朝阳公园', 39.9320000, 116.4802000, 500, 12, 12, 6, 0.00, '免费', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-10-22 10:00:00', NOW()),

('h5', '周末羽毛球活动', '定期羽毛球活动，锻炼身体，结交朋友。', 'u1', '运动', '已结束', '2025-10-20 14:00:00', '2025-10-20 17:00:00', '2025-10-20 12:00:00', '奥体中心羽毛球馆', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 14, 11, 8, 50.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-10-15 09:00:00', NOW()),

('h6', 'UI设计分享会', '分享最新的UI设计趋势和实战案例。', 'u5', '培训', '已结束', '2025-10-13 14:00:00', '2025-10-13 17:00:00', '2025-10-13 12:00:00', '创新大厅', '北京市海淀区知春路创新中心', 39.9764000, 116.3252000, 300, 25, 20, 15, 0.00, '免费', 1, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":false,"desc":"","isCustom":false}]', '2025-10-05 10:00:00', NOW());

-- 历史活动 (2025年9月)
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('h7', '中秋聚餐活动', '中秋佳节，朋友相聚，共度美好时光。', 'u1', '聚会', '已结束', '2025-09-15 18:00:00', '2025-09-15 21:00:00', '2025-09-15 16:00:00', '烤鱼餐厅', '北京市朝阳区国贸', 39.9085000, 116.4579000, 300, 15, 12, 8, 100.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-09-08 11:00:00', NOW()),

('h8', '周末足球友谊赛', '5人制足球友谊赛，欢迎足球爱好者参加。', 'u4', '运动', '已结束', '2025-09-22 16:00:00', '2025-09-22 18:00:00', '2025-09-22 14:00:00', '工体足球场', '北京市朝阳区工人体育场', 39.9282000, 116.4375000, 500, 10, 10, 10, 60.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-09-18 09:00:00', NOW()),

('h9', '周日羽毛球活动', '定期羽毛球活动，欢迎新老球友。', 'u1', '运动', '已结束', '2025-09-08 14:00:00', '2025-09-08 17:00:00', '2025-09-08 12:00:00', '奥体中心羽毛球馆', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 16, 13, 8, 45.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-09-03 10:00:00', NOW());

-- 历史活动 (2025年8月)
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('h10', '夏日游泳活动', '消暑游泳，锻炼身体。', 'u1', '运动', '已结束', '2025-08-25 10:00:00', '2025-08-25 12:00:00', '2025-08-25 08:00:00', '奥体游泳馆', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 18, 15, 10, 30.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-07-20 09:00:00', NOW()),

('h11', '周末乒乓球活动', '乒乓球爱好者聚会，切磋球技。', 'u3', '运动', '已结束', '2025-08-18 15:00:00', '2025-08-18 18:00:00', '2025-08-18 13:00:00', '体育馆乒乓球室', '北京市海淀区体育馆', 39.9764000, 116.3252000, 300, 12, 10, 6, 20.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-08-13 10:00:00', NOW()),

('h12', '夏日烧烤聚会', '户外烧烤，享受夏日时光。', 'u1', '聚会', '已结束', '2025-08-11 17:00:00', '2025-08-11 21:00:00', '2025-08-11 15:00:00', '朝阳公园烧烤区', '北京市朝阳区朝阳公园', 39.9320000, 116.4802000, 500, 20, 16, 10, 80.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-10-05 14:00:00', NOW());

-- 历史活动 (2025年7月)
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('h13', '周末网球活动', '网球爱好者聚会，技术交流。', 'u2', '运动', '已结束', '2025-07-28 08:00:00', '2025-07-28 11:00:00', '2025-07-27 20:00:00', '奥体网球场', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 12, 10, 8, 60.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-07-23 09:00:00', NOW()),

('h14', '前端技术交流会', '分享前端最新技术和开发经验。', 'u5', '培训', '已结束', '2025-07-21 14:00:00', '2025-07-21 17:00:00', '2025-07-21 12:00:00', '科技园会议室', '北京市海淀区中关村科技园', 39.9764000, 116.3252000, 300, 30, 25, 15, 0.00, '免费', 1, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":false,"desc":"","isCustom":false},{"id":"custom_1","label":"公司","required":false,"desc":"","isCustom":true}]', '2025-07-14 10:00:00', NOW()),

('h15', '周末羽毛球活动', '定期羽毛球活动，欢迎新老球友。', 'u1', '运动', '已结束', '2025-07-14 14:00:00', '2025-07-14 17:00:00', '2025-07-14 12:00:00', '奥体中心羽毛球馆', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 16, 14, 8, 45.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-06-25 09:00:00', NOW());

-- 历史活动 (2025年6月)
INSERT INTO activities (id, title, description, organizer_id, type, status, start_time, end_time, register_deadline, place, address, latitude, longitude, checkin_radius, total, joined, min_participants, fee, fee_type, need_review, is_public, is_deleted, custom_fields, created_at, updated_at) VALUES
('h16', '端午龙舟观赛', '一起观看端午龙舟赛，感受传统文化。', 'u6', '户外', '已结束', '2025-06-22 09:00:00', '2025-06-22 12:00:00', '2025-06-21 20:00:00', '昆玉河龙舟赛场', '北京市海淀区昆玉河', 39.9764000, 116.3252000, 800, 25, 20, 10, 0.00, '免费', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":false,"desc":"","isCustom":false}]', '2025-06-15 10:00:00', NOW()),

('h17', '周末羽毛球活动', '定期羽毛球活动，欢迎新老球友。', 'u1', '运动', '已结束', '2025-06-16 14:00:00', '2025-06-16 17:00:00', '2025-06-16 12:00:00', '奥体中心羽毛球馆', '北京市朝阳区奥体中心', 39.9928000, 116.3972000, 500, 14, 12, 8, 40.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":true,"desc":"","isCustom":false}]', '2025-06-11 09:00:00', NOW()),

('h18', '周末聚餐活动', '老友相聚，畅聊生活。', 'u2', '聚会', '已结束', '2025-06-08 18:00:00', '2025-06-08 21:00:00', '2025-06-08 16:00:00', '川菜馆', '北京市朝阳区三里屯', 39.9354000, 116.4481000, 300, 12, 10, 6, 90.00, 'AA', 0, 1, 0, '[{"id":"name","label":"昵称","required":true,"desc":"","isCustom":false},{"id":"mobile","label":"手机号","required":false,"desc":"","isCustom":false}]', '2025-06-03 15:00:00', NOW());

-- ==========================================
-- 2. 插入报名记录
-- ==========================================

INSERT INTO registrations (id, activity_id, user_id, name, mobile, group_id, status, custom_data, registered_at, approved_at) VALUES
-- 羽毛球联赛报名
('r0_1', 'a0', 'u2', '李小雅', '139****5678', 'g1', 'approved', '{"球龄":"1个月","是否需要借用球拍":"不需要"}', '2025-12-13 14:35:00', '2025-12-13 14:35:00'),
('r0_2', 'a0', 'u7d3f31690438', '用户7d3f31', NULL, 'g1', 'approved', '{"球龄":"3个月","是否需要借用球拍":"需要"}', '2025-12-14 08:20:00', '2025-12-14 08:20:00'),
('r0_3', 'a0', 'u3', '王小文', '136****9012', 'g2', 'approved', '{"球龄":"8个月","擅长位置":"双打","T恤尺码":"L"}', '2025-12-14 09:15:00', '2025-12-14 09:15:00'),
('r0_4', 'a0', 'u4', '赵小海', '137****3456', 'g3', 'approved', '{"球龄":"2年","参赛类型":"男单","搭档姓名":"","T恤尺码":"XL"}', '2025-12-14 11:40:00', '2025-12-14 11:40:00'),
('r0_5', 'a0', 'u6', '王晨', '134****2345', 'g4', 'approved', '{"球龄":"5年","参赛类型":"男双","最好成绩":"市级比赛冠军","搭档姓名":"李强 139****1111","T恤尺码":"L","紧急联系人":"王晨妈妈 138****9999"}', '2025-12-15 08:30:00', '2025-12-15 08:30:00'),

-- 网球活动报名
('r2', 'a1', 'u2', '李小雅', '139****5678', 'g1', 'approved', '{}', '2025-12-14 13:15:00', '2025-12-14 13:15:00'),
('r3', 'a1', 'u3', '王小文', '136****9012', 'g2', 'approved', '{}', '2025-12-14 14:00:00', '2025-12-14 14:00:00'),

-- 聚餐活动报名
('r4', 'a1b', 'u4', '赵小海', '137****3456', NULL, 'approved', '{}', '2025-12-15 10:00:00', '2025-12-15 10:00:00'),

-- 历史活动报名记录（用户u1）
('rh1', 'h1', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-11-19 10:30:00', '2025-11-19 10:30:00'),
('rh2', 'h2', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-11-12 09:00:00', '2025-11-12 09:00:00'),
('rh3', 'h3', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-11-06 15:30:00', '2025-11-06 15:30:00'),
('rh4', 'h4', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-10-23 11:00:00', '2025-10-23 11:00:00'),
('rh5', 'h5', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-10-16 10:00:00', '2025-10-16 10:00:00'),
('rh6', 'h6', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-10-08 13:00:00', '2025-10-08 16:30:00'),
('rh7', 'h7', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-09-09 12:00:00', '2025-09-09 12:00:00'),
('rh8', 'h8', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-09-19 10:00:00', '2025-09-19 10:00:00'),
('rh9', 'h9', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-09-04 11:00:00', '2025-09-04 11:00:00'),
('rh10', 'h10', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-08-21 10:00:00', '2025-08-21 10:00:00'),
('rh11', 'h11', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-08-14 12:00:00', '2025-08-14 12:00:00'),
('rh12', 'h12', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-08-06 15:00:00', '2025-08-06 15:00:00'),
('rh13', 'h13', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-07-24 10:00:00', '2025-07-24 10:00:00'),
('rh14', 'h14', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-10-30 13:00:00', '2025-10-30 18:00:00'),
('rh15', 'h15', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-08-28 11:00:00', '2025-08-28 11:00:00'),
('rh16', 'h16', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-06-17 11:00:00', '2025-06-17 11:00:00'),
('rh17', 'h17', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-06-12 10:00:00', '2025-06-12 10:00:00'),
('rh18', 'h18', 'u1', '张小北', '138****1234', NULL, 'approved', '{}', '2025-10-28 16:00:00', '2025-10-28 16:00:00');

-- ==========================================
-- 3. 插入签到记录
-- ==========================================

INSERT INTO checkins (id, activity_id, user_id, registration_id, latitude, longitude, address, checkin_time, is_late, is_valid, distance) VALUES
('c2', 'a1', 'u2', 'r2', 39.9352000, 116.4479000, '北京市朝阳区三里屯太古里南区', '2025-12-15 18:12:00', 0, 1, 48.0),

-- 历史活动签到记录
('ch1', 'h1', 'u1', 'rh1', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-11-23 14:05:00', 0, 1, 20.0),
('ch2', 'h2', 'u1', 'rh2', 39.9950000, 116.1889000, '北京市海淀区香山公园', '2025-11-16 08:10:00', 0, 1, 30.0),
('ch3', 'h3', 'u1', 'rh3', 39.9354000, 116.4481000, '北京市朝阳区三里屯太古里', '2025-11-09 18:05:00', 0, 1, 15.0),
('ch4', 'h4', 'u1', 'rh4', 39.9320000, 116.4802000, '北京市朝阳区朝阳公园', '2025-10-27 15:08:00', 0, 1, 25.0),
('ch5', 'h5', 'u1', 'rh5', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-10-20 14:05:00', 0, 1, 18.0),
('ch7', 'h7', 'u1', 'rh7', 39.9085000, 116.4579000, '北京市朝阳区国贸', '2025-09-15 18:10:00', 0, 1, 22.0),
('ch8', 'h8', 'u1', 'rh8', 39.9282000, 116.4375000, '北京市朝阳区工人体育场', '2025-09-22 16:05:00', 0, 1, 28.0),
('ch9', 'h9', 'u1', 'rh9', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-09-08 14:08:00', 0, 1, 19.0),
('ch10', 'h10', 'u1', 'rh10', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-08-25 10:05:00', 0, 1, 21.0),
('ch11', 'h11', 'u1', 'rh11', 39.9764000, 116.3252000, '北京市海淀区体育馆', '2025-08-18 15:10:00', 0, 1, 17.0),
('ch12', 'h12', 'u1', 'rh12', 39.9320000, 116.4802000, '北京市朝阳区朝阳公园', '2025-08-11 17:05:00', 0, 1, 23.0),
('ch13', 'h13', 'u1', 'rh13', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-07-28 08:05:00', 0, 1, 16.0),
('ch14', 'h14', 'u1', 'rh14', 39.9764000, 116.3252000, '北京市海淀区中关村科技园', '2025-11-03 14:05:00', 0, 1, 26.0),
('ch15', 'h15', 'u1', 'rh15', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-09-01 14:06:00', 0, 1, 14.0),
('ch16', 'h16', 'u1', 'rh16', 39.9764000, 116.3252000, '北京市海淀区昆玉河', '2025-06-22 09:10:00', 0, 1, 32.0),
('ch17', 'h17', 'u1', 'rh17', 39.9928000, 116.3972000, '北京市朝阳区奥体中心', '2025-06-16 14:05:00', 0, 1, 24.0),
('ch18', 'h18', 'u1', 'rh18', 39.9354000, 116.4481000, '北京市朝阳区三里屯', '2025-11-02 14:05:00', 0, 1, 29.0);

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 执行完成提示
-- ==========================================
SELECT '数据导入完成！' AS message,
       (SELECT COUNT(*) FROM activities) AS total_activities,
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM registrations) AS total_registrations,
       (SELECT COUNT(*) FROM checkins) AS total_checkins;
